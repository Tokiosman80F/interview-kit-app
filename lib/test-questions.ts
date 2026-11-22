import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuizQuestion } from "@/lib/data";
import { easyToHard } from "@/lib/selection/topic-quiz";

// feedback holds the AI grading for written answers (Version 3).
export type WrittenFeedback = { covered: string[]; missed: string[]; mistakes: string[]; model_answer: string };

export type TestItem = {
  response: string | null;
  is_correct: boolean | null;
  score: number | null;
  feedback: WrittenFeedback | null;
  graded_by: string | null;
  question: QuizQuestion;
};

// A test's answers with their questions, ordered easy to hard.
export async function testItems(supabase: SupabaseClient, testId: string): Promise<TestItem[]> {
  const { data, error } = await supabase
    .from("answers")
    .select("response, is_correct, score, feedback, graded_by, question:questions!inner(id, type, difficulty, prompt, options, correct_answer, explanation)")
    .eq("test_id", testId);
  if (error) throw new Error(error.message);
  const items = (data as unknown as TestItem[]).sort((a, b) => a.question.id.localeCompare(b.question.id));
  return easyToHard(items.map((it) => ({ ...it, difficulty: it.question.difficulty })));
}
