"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { gradeCoding, testScore } from "@/lib/scoring/grade";

const resultsSchema = z.array(
  z.object({ name: z.string(), passed: z.boolean(), expected: z.string(), actual: z.string() }),
);

// Saves one coding attempt as a finished `coding` test with one answer.
// The tests ran in the browser; the score is the fraction that passed.
export async function submitCoding(questionId: string, code: string, rawResults: unknown, startedAt: number) {
  const results = resultsSchema.parse(rawResults);
  const supabase = await createClient();
  const { data: question } = await supabase
    .from("questions")
    .select("topic_id, test_cases")
    .eq("id", questionId)
    .eq("type", "coding")
    .single();
  if (!question) throw new Error("Unknown coding problem");
  if (results.length !== (question.test_cases as unknown[]).length) throw new Error("Wrong number of results");

  const score = gradeCoding(results.map((r) => r.passed));
  const { data: test, error } = await supabase
    .from("tests")
    .insert({
      kind: "coding",
      topic_id: question.topic_id,
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
      score: testScore([score]),
      status: "graded",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: answerError } = await supabase.from("answers").insert({
    test_id: test.id,
    question_id: questionId,
    response: code,
    score,
    is_correct: score === 1,
    feedback: { tests: results },
    graded_by: "app",
  });
  if (answerError) throw new Error(answerError.message);

  redirect(`/results/${test.id}`);
}
