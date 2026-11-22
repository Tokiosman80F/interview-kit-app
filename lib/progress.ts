import type { SupabaseClient } from "@supabase/supabase-js";
import { topicsInOrder, type TopicRow } from "@/lib/data";
import { codingLadder, type CodingRow } from "@/lib/coding";
import { bestScores, unlockedIds } from "@/lib/scoring/unlock";

// Topics in syllabus order, each topic's best quiz score, and which are open.
export async function topicProgress(supabase: SupabaseClient) {
  const [topics, { data, error }] = await Promise.all([
    topicsInOrder(supabase),
    supabase.from("tests").select("topic_id, score").eq("kind", "topic_quiz").eq("status", "graded"),
  ]);
  if (error) throw new Error(error.message);
  const best = bestScores((data ?? []).map((t) => ({ id: t.topic_id as string, score: Number(t.score) })));
  const open = unlockedIds(topics.map((t) => t.id), best);
  return { topics, best, open } as { topics: TopicRow[]; best: Map<string, number>; open: Set<string> };
}

// The coding ladder, each problem's best score (0 to 100), and which are open.
export async function codingProgress(supabase: SupabaseClient) {
  const ladder = await codingLadder(supabase);
  const { data, error } = await supabase
    .from("answers")
    .select("question_id, score")
    .in("question_id", ladder.map((p) => p.id))
    .not("score", "is", null);
  if (error) throw new Error(error.message);
  const best = bestScores((data ?? []).map((a) => ({ id: a.question_id as string, score: Math.round(Number(a.score) * 100) })));
  const open = unlockedIds(ladder.map((p) => p.id), best);
  return { ladder, best, open } as { ladder: CodingRow[]; best: Map<string, number>; open: Set<string> };
}
