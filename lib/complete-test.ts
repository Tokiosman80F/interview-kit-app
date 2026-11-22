// Server only. Finishes a quiz or exam: grades multiple choice and output
// answers, scores the coding answer from the test results the browser sent,
// marks the test waiting for grading, then lets gradeTest() grade the written
// answers and code review with the AI and set the final score. If the AI is
// down, the test stays waiting and the results page retries it.
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { gradeCoding, gradeMcq, gradeOutput } from "@/lib/scoring/grade";
import { gradeTest } from "@/lib/grading/grade-test";
import { now } from "@/lib/now";

export const codingResultsSchema = z.record(
  z.string(),
  z.array(z.object({ name: z.string(), passed: z.boolean(), expected: z.string(), actual: z.string() })),
);
export type CodingResults = z.infer<typeof codingResultsSchema>;

type Row = {
  id: string;
  test_id: string;
  question_id: string;
  response: string | null;
  question: { type: string; correct_answer: string; test_cases: unknown[] | null };
};

// Returns false if the test was already finished.
export async function completeTest(supabase: SupabaseClient, testId: string, coding: CodingResults = {}): Promise<boolean> {
  const { data: test } = await supabase.from("tests").select("status").eq("id", testId).single();
  if (test?.status !== "in_progress") return false;

  const { data, error } = await supabase
    .from("answers")
    .select("id, test_id, question_id, response, question:questions!inner(type, correct_answer, test_cases)")
    .eq("test_id", testId);
  if (error) throw new Error(error.message);

  const updates = (data as unknown as Row[]).flatMap(({ question, ...a }): Record<string, unknown>[] => {
    if (question.type === "mcq" || question.type === "output") {
      const score =
        question.type === "mcq" ? gradeMcq(a.response, question.correct_answer) : gradeOutput(a.response, question.correct_answer);
      return [{ ...a, score, is_correct: score === 1, feedback: null, graded_by: "app" }];
    }
    if (question.type === "coding") {
      // Tests only run in the browser. With no results (for example the time
      // ran out with the tab closed) the code scores 0; the AI still reviews it.
      const results = coding[a.question_id];
      const valid = results && results.length === (question.test_cases ?? []).length;
      const score = valid ? gradeCoding(results.map((r) => r.passed)) : 0;
      return [{ ...a, score, is_correct: score === 1, feedback: { tests: valid ? results : [] }, graded_by: null }];
    }
    return [];
  });

  const { error: saveError } = await supabase.from("answers").upsert(updates);
  if (saveError) throw new Error(saveError.message);

  const { error: testError } = await supabase
    .from("tests")
    .update({ status: "waiting_for_grading", finished_at: now().toISOString() })
    .eq("id", testId);
  if (testError) throw new Error(testError.message);

  await gradeTest(supabase, testId);
  return true;
}
