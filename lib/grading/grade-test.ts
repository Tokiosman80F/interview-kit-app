// Server only. Grades the written and coding answers of one test that have no
// grade yet, saves them, and marks the test graded with its final score.
// Used when a test is finished and again as the retry when a page loads.
import type { SupabaseClient } from "@supabase/supabase-js";
import { DONT_KNOW, testScore } from "@/lib/scoring/grade";
import { gradeAnswers } from "./grade-answers";
import type { GradingItem } from "./schema";

type Row = {
  id: string;
  response: string | null;
  score: number | null;
  feedback: Record<string, unknown> | null;
  graded_by: string | null;
  question: { type: string; prompt: string; title: string | null; key_points: string[] | null; correct_answer: string | null };
};

// A written answer of at least this AI score counts as correct.
const WRITTEN_CORRECT = 0.7;

const isBlank = (text: string | null) => !text || text.trim() === "" || text.trim() === DONT_KNOW;

// Returns true when the test ends up graded, false when the AI was unavailable
// and the test stays waiting for grading.
export async function gradeTest(supabase: SupabaseClient, testId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("answers")
    .select("id, response, score, feedback, graded_by, question:questions!inner(type, prompt, title, key_points, correct_answer)")
    .eq("test_id", testId);
  if (error) throw new Error(error.message);
  const rows = data as unknown as Row[];
  const pending = rows.filter((r) => r.graded_by === null && ["written", "coding"].includes(r.question.type));

  // A blank or "I don't know" written answer scores 0 without asking the AI.
  const blank = pending.filter((r) => r.question.type === "written" && isBlank(r.response));
  for (const r of blank) {
    const feedback = { covered: [], missed: r.question.key_points ?? [], mistakes: [], model_answer: r.question.correct_answer ?? "" };
    await save(supabase, r, { score: 0, is_correct: false, feedback, graded_by: "app" });
  }

  const toGrade = pending.filter((r) => !blank.includes(r));
  if (toGrade.length > 0) {
    const items: GradingItem[] = toGrade.map((r) =>
      r.question.type === "written"
        ? { id: r.id, kind: "written", question: r.question.prompt, keyPoints: r.question.key_points ?? [], answer: r.response ?? "" }
        : {
            id: r.id,
            kind: "coding",
            question: `${r.question.title ?? ""}\n${r.question.prompt}`,
            answer: r.response ?? "",
            tests: ((r.feedback?.tests ?? []) as { name: string; passed: boolean }[]).map(({ name, passed }) => ({ name, passed })),
          },
    );
    const outcome = await gradeAnswers(items);
    if (!outcome.ok) {
      console.error(`Grading test ${testId} failed:`, outcome.errors.join(" | "));
      return false;
    }
    for (const r of toGrade) {
      const g = outcome.results.get(r.id)!;
      if (r.question.type === "written") {
        const score = g.score / 10;
        const feedback = { covered: g.covered, missed: g.missed, mistakes: g.mistakes, model_answer: g.model_answer };
        await save(supabase, r, { score, is_correct: score >= WRITTEN_CORRECT, feedback, graded_by: outcome.provider });
      } else {
        // Code keeps the score from its tests; the AI review is feedback only.
        const review = { mistakes: g.mistakes, edge_cases: g.edge_cases, suggestion: g.suggestion, approach: g.model_answer };
        await save(supabase, r, { feedback: { ...r.feedback, review }, graded_by: outcome.provider });
      }
    }
  }

  // Every answer now has a score: the test score is their average.
  const { data: scores, error: scoreError } = await supabase.from("answers").select("score").eq("test_id", testId);
  if (scoreError) throw new Error(scoreError.message);
  const { error: testError } = await supabase
    .from("tests")
    .update({ status: "graded", score: testScore((scores ?? []).map((a) => Number(a.score ?? 0))) })
    .eq("id", testId);
  if (testError) throw new Error(testError.message);
  return true;
}

async function save(supabase: SupabaseClient, row: Row, values: Record<string, unknown>) {
  const { error } = await supabase.from("answers").update(values).eq("id", row.id);
  if (error) throw new Error(error.message);
}

// The retry: grade every test that is still waiting. Called on page loads.
export async function gradeWaitingTests(supabase: SupabaseClient) {
  const { data } = await supabase.from("tests").select("id").eq("status", "waiting_for_grading");
  for (const t of data ?? []) await gradeTest(supabase, t.id);
}
