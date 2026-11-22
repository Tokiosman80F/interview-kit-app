"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { answerHistory, topicProgress } from "@/lib/progress";
import { buildLevelExam, buildReviewExam, type ExamCandidate } from "@/lib/selection/exams";
import { now } from "@/lib/now";

// Resumes an unfinished exam of this kind (and level), if there is one.
async function resume(supabase: SupabaseClient, kind: string, levelId: string | null) {
  let query = supabase.from("tests").select("id").eq("kind", kind).eq("status", "in_progress");
  query = levelId ? query.eq("level_id", levelId) : query;
  const { data } = await query.limit(1).maybeSingle();
  if (data) redirect(`/test/${data.id}`);
}

async function candidates(supabase: SupabaseClient, topicIds: string[]): Promise<ExamCandidate[]> {
  const { data, error } = await supabase.from("questions").select("id, topic_id, type, difficulty").in("topic_id", topicIds);
  if (error) throw new Error(error.message);
  return data as ExamCandidate[];
}

async function create(supabase: SupabaseClient, kind: string, levelId: string | null, questions: ExamCandidate[]) {
  if (questions.length === 0) throw new Error("No questions for this exam yet.");
  // started_at comes from now(), so the exam timer also works with DEV_NOW.
  const { data: test, error } = await supabase
    .from("tests")
    .insert({ kind, level_id: levelId, started_at: now().toISOString() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const { error: answersError } = await supabase
    .from("answers")
    .insert(questions.map((q) => ({ test_id: test.id, question_id: q.id })));
  if (answersError) throw new Error(answersError.message);
  redirect(`/test/${test.id}`);
}

export async function startLevelExam(levelId: string) {
  const supabase = await createClient();
  await resume(supabase, "level_exam", levelId);
  const { topics, levels } = await topicProgress(supabase);
  const level = levels.find((l) => l.id === levelId);
  if (!level?.examAvailable || level.retakeAt) redirect("/syllabus");
  const [pool, { last }] = await Promise.all([
    candidates(supabase, topics.filter((t) => t.level.id === levelId).map((t) => t.id)),
    answerHistory(supabase),
  ]);
  await create(supabase, "level_exam", levelId, buildLevelExam(pool, last, `${levelId}:${now().getTime()}`));
}

// The review covers finished topics: topics with a graded quiz.
export async function startReview() {
  const supabase = await createClient();
  await resume(supabase, "review", null);
  const { best } = await topicProgress(supabase);
  if (best.size === 0) redirect("/syllabus");
  const [pool, { last, weak }] = await Promise.all([candidates(supabase, [...best.keys()]), answerHistory(supabase)]);
  const exam = buildReviewExam(pool, new Set(weak.map((w) => w.topicId)), last, `review:${now().getTime()}`);
  await create(supabase, "review", null, exam);
}
