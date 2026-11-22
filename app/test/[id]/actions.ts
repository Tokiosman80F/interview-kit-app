"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeTest, codingResultsSchema } from "@/lib/complete-test";

export async function saveAnswer(testId: string, questionId: string, response: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("answers")
    .update({ response })
    .eq("test_id", testId)
    .eq("question_id", questionId);
  if (error) throw new Error(error.message);
}

// Finishes the test and opens its results. `coding` holds the test results
// the browser ran for any coding question in the test.
export async function finishTest(testId: string, coding: unknown = {}) {
  const supabase = await createClient();
  await completeTest(supabase, testId, codingResultsSchema.parse(coding));
  redirect(`/results/${testId}`);
}
