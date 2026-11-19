import type { SupabaseClient } from "@supabase/supabase-js";

export type CodingRow = { id: string; title: string; difficulty: string; topic_id: string };

// The coding ladder in order (ids are code-01, code-02, ...).
export async function codingLadder(supabase: SupabaseClient): Promise<CodingRow[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, title, difficulty, topic_id")
    .eq("type", "coding")
    .order("id");
  if (error) throw new Error(error.message);
  return data as CodingRow[];
}
