"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradeMcq, gradeOutput, testScore } from "@/lib/scoring/grade";

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

// Grades every answer with lib/scoring, saves the score and opens the results.
export async function finishTest(testId: string) {
  const supabase = await createClient();
  const { data: test } = await supabase.from("tests").select("status").eq("id", testId).single();
  if (test?.status !== "in_progress") redirect(`/results/${testId}`);

  const { data, error } = await supabase
    .from("answers")
    .select("id, test_id, question_id, response, question:questions!inner(type, correct_answer)")
    .eq("test_id", testId);
  if (error) throw new Error(error.message);

  const graded = (data as unknown as AnswerToGrade[]).map(({ question, ...a }) => {
    const score =
      question.type === "mcq"
        ? gradeMcq(a.response, question.correct_answer)
        : gradeOutput(a.response, question.correct_answer);
    return { ...a, score, is_correct: score === 1, graded_by: "app" };
  });

  const { error: saveError } = await supabase.from("answers").upsert(graded);
  if (saveError) throw new Error(saveError.message);

  const { error: testError } = await supabase
    .from("tests")
    .update({
      score: testScore(graded.map((a) => a.score)),
      status: "graded",
      finished_at: new Date().toISOString(),
    })
    .eq("id", testId);
  if (testError) throw new Error(testError.message);

  redirect(`/results/${testId}`);
}
