import type { SupabaseClient } from "@supabase/supabase-js";
import { topicsInOrder, type TopicRow } from "@/lib/data";
import { codingLadder, type CodingRow } from "@/lib/coding";
import { bestScores, unlockedIds } from "@/lib/scoring/unlock";
import {
  LEVEL_PASS_MARK,
  levelExamAvailable,
  retakeAt,
  reviewState,
  unlockedLevels,
  weakTopics,
  type ExamResult,
  type ReviewState,
} from "@/lib/scoring/exams";
import { now } from "@/lib/now";

export type LevelState = {
  id: string;
  number: number;
  title: string;
  unlocked: boolean;
  examAvailable: boolean;
  passed: boolean;
  bestExam: number | null;
  retakeAt: Date | null;
};

type FinishedTest = { kind: string; topic_id: string | null; level_id: string | null; score: number; finished_at: string };

// Everything the pages need to decide what is open: topics in syllabus order,
// best quiz scores, open topics, level and exam state, and the review state.
export async function topicProgress(supabase: SupabaseClient) {
  const [topics, { data, error }] = await Promise.all([
    topicsInOrder(supabase),
    supabase
      .from("tests")
      .select("kind, topic_id, level_id, score, finished_at")
      .in("kind", ["topic_quiz", "level_exam", "review"])
      .eq("status", "graded"),
  ]);
  if (error) throw new Error(error.message);
  const tests = (data ?? []) as FinishedTest[];
  const quizzes = tests.filter((t) => t.kind === "topic_quiz");
  const best = bestScores(quizzes.map((t) => ({ id: t.topic_id!, score: Number(t.score) })));

  // Levels: in order, unlocked by the previous level's exam.
  const levelRows = [...new Map(topics.map((t) => [t.level.id, t.level])).values()].sort((a, b) => a.number - b.number);
  const numberOf = new Map(levelRows.map((l) => [l.id, l.number]));
  const exams: ExamResult[] = tests
    .filter((t) => t.kind === "level_exam" && t.level_id)
    .map((t) => ({ level: numberOf.get(t.level_id!)!, score: Number(t.score), finishedAt: new Date(t.finished_at) }));
  const openLevels = unlockedLevels(levelRows.map((l) => l.number), exams);
  const at = now();
  const levels: LevelState[] = levelRows.map((l) => {
    const own = exams.filter((e) => e.level === l.number);
    const topicIds = topics.filter((t) => t.level.id === l.id).map((t) => t.id);
    return {
      ...l,
      unlocked: openLevels.has(l.number),
      examAvailable: levelExamAvailable(topicIds, best, openLevels.has(l.number)),
      passed: own.some((e) => e.score >= LEVEL_PASS_MARK),
      bestExam: own.length ? Math.max(...own.map((e) => e.score)) : null,
      retakeAt: retakeAt(own, at),
    };
  });

  // A topic opens when the topic before it has 50% and its level is unlocked.
  const byScore = unlockedIds(topics.map((t) => t.id), best);
  const open = new Set(topics.filter((t) => byScore.has(t.id) && openLevels.has(t.level.number)).map((t) => t.id));

  // Review: due 3 days after the last review, or after the first quiz.
  const times = (kind: string) => tests.filter((t) => t.kind === kind).map((t) => new Date(t.finished_at).getTime());
  const reviews = times("review");
  const quizTimes = times("topic_quiz");
  const review: ReviewState = reviewState(
    reviews.length ? new Date(Math.max(...reviews)) : null,
    quizTimes.length ? new Date(Math.min(...quizTimes)) : null,
    at,
  );

  return { topics, best, open, levels, review } as {
    topics: TopicRow[];
    best: Map<string, number>;
    open: Set<string>;
    levels: LevelState[];
    review: ReviewState;
  };
}

// The last answer to every question and every graded answer with its topic,
// read in pages. Used to pick exam questions and to find weak topics.
export async function answerHistory(supabase: SupabaseClient) {
  const rows: { question_id: string; score: number; topic_id: string; at: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("answers")
      .select("question_id, score, question:questions!inner(topic_id), test:tests!inner(finished_at, status)")
      .eq("test.status", "graded")
      .not("score", "is", null)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of data as unknown as { question_id: string; score: number; question: { topic_id: string }; test: { finished_at: string } }[])
      rows.push({ question_id: r.question_id, score: Number(r.score), topic_id: r.question.topic_id, at: new Date(r.test.finished_at).getTime() });
    if (data.length < 1000) break;
  }
  const last = new Map<string, { score: number; at: number }>();
  for (const r of rows) if (!last.has(r.question_id) || last.get(r.question_id)!.at < r.at) last.set(r.question_id, { score: r.score, at: r.at });
  const weak = weakTopics(rows.map((r) => ({ topicId: r.topic_id, score: r.score, at: new Date(r.at) })));
  return { last, weak };
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
