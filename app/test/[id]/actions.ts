"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradeMcq, gradeOutput } from "@/lib/scoring/grade";
import { gradeTest } from "@/lib/grading/grade-test";

export async function saveAnswer(testId: string, questionId: string, response: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("answers")
    .update({ response })
    .eq("test_id", testId)
    .eq("question_id", questionId);
  if (error) throw new Error(error.message);
}

type AnswerToGrade = {
  id: string;
  test_id: string;
  question_id: string;
  response: string | null;
  question: { type: string; correct_answer: string };
};

// Grades multiple choice and output answers here, marks the test as waiting
// for grading, then lets gradeTest() grade the written answers with the AI
// and set the final score. If the AI is down, the test stays waiting and the
// results page retries it.
export async function finishTest(testId: string) {
  const supabase = await createClient();
  const { data: test } = await supabase.from("tests").select("status").eq("id", testId).single();
  if (test?.status !== "in_progress") redirect(`/results/${testId}`);

  const { data, error } = await supabase
    .from("answers")
    .select("id, test_id, question_id, response, question:questions!inner(type, correct_answer)")
    .eq("test_id", testId);
  if (error) throw new Error(error.message);

  const appGraded = (data as unknown as AnswerToGrade[])
    .filter(({ question }) => question.type === "mcq" || question.type === "output")
    .map(({ question, ...a }) => {
      const score =
        question.type === "mcq"
          ? gradeMcq(a.response, question.correct_answer)
          : gradeOutput(a.response, question.correct_answer);
      return { ...a, score, is_correct: score === 1, graded_by: "app" };
    });

  const { error: saveError } = await supabase.from("answers").upsert(appGraded);
  if (saveError) throw new Error(saveError.message);

  const { error: testError } = await supabase
    .from("tests")
    .update({ status: "waiting_for_grading", finished_at: new Date().toISOString() })
    .eq("id", testId);
  if (testError) throw new Error(testError.message);

  await gradeTest(supabase, testId);
  redirect(`/results/${testId}`);
}
