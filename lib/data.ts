import type { SupabaseClient } from "@supabase/supabase-js";

export type TopicRow = {
  id: string;
  position: number;
  title: string;
  level: { id: string; number: number; title: string };
};

// Every topic in syllabus order (level number, then position).
export async function topicsInOrder(supabase: SupabaseClient): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("id, position, title, level:levels!inner(id, number, title)");
  if (error) throw new Error(error.message);
  const rows = data as unknown as TopicRow[];
  return rows.sort((a, b) => a.level.number - b.level.number || a.position - b.position);
}

export type QuizQuestion = {
  id: string;
  type: "mcq" | "output" | "written" | "coding";
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
};
