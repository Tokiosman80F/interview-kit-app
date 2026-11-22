"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildTopicQuiz } from "@/lib/selection/topic-quiz";
import type { QuizQuestion } from "@/lib/data";
import { topicProgress } from "@/lib/progress";

export async function saveNote(topicId: string, body: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .upsert({ topic_id: topicId, body, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

// Resumes an unfinished quiz for the topic, or starts a new one.
export async function startQuiz(topicId: string) {
  const supabase = await createClient();
  const { open: unlocked } = await topicProgress(supabase);
  if (!unlocked.has(topicId)) redirect(`/topic/${topicId}`);

  const { data: open } = await supabase
    .from("tests")
    .select("id")
    .eq("kind", "topic_quiz")
    .eq("topic_id", topicId)
    .eq("status", "in_progress")
    .limit(1)
    .maybeSingle();
  if (open) redirect(`/test/${open.id}`);

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, type, difficulty")
    .eq("topic_id", topicId)
    .order("id");
  if (error) throw new Error(error.message);
  const quiz = buildTopicQuiz(questions as Pick<QuizQuestion, "id" | "type" | "difficulty">[]);
  if (quiz.length === 0) throw new Error("This topic has no quiz questions yet.");

  const { data: test, error: testError } = await supabase
    .from("tests")
    .insert({ kind: "topic_quiz", topic_id: topicId })
    .select("id")
    .single();
  if (testError) throw new Error(testError.message);

  const { error: answersError } = await supabase
    .from("answers")
    .insert(quiz.map((q) => ({ test_id: test.id, question_id: q.id })));
  if (answersError) throw new Error(answersError.message);

  redirect(`/test/${test.id}`);
}
