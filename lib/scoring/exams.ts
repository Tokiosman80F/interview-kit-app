// Pure rules for level exams, the review exam and weak topics. Every function
// that depends on time takes `now`, so tests can use fixed dates.

export const LEVEL_PASS_MARK = 70; // percent
export const RETAKE_HOURS = 24;
export const REVIEW_EVERY_DAYS = 3;
export const REVIEW_GRACE_HOURS = 24; // due for one day before it locks quizzes
export const WEAK_BELOW = 0.7;
export const EXAM_MINUTES = { level_exam: 40, review: 30 } as const;

const HOUR = 60 * 60 * 1000;

export type ExamResult = { level: number; score: number; finishedAt: Date };

// Level 1 is always open. Each next level opens when the level before it has
// a level exam score of LEVEL_PASS_MARK or more.
export function unlockedLevels(levelNumbers: number[], exams: ExamResult[]): Set<number> {
  const sorted = [...levelNumbers].sort((a, b) => a - b);
  const open = new Set<number>();
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && !exams.some((e) => e.level === sorted[i - 1] && e.score >= LEVEL_PASS_MARK)) break;
    open.add(sorted[i]);
  }
  return open;
}

// The exam opens once the level is unlocked and every topic in it has a quiz score.
export function levelExamAvailable(topicIds: string[], bestQuiz: Map<string, number>, levelUnlocked: boolean): boolean {
  return levelUnlocked && topicIds.length > 0 && topicIds.every((id) => bestQuiz.has(id));
}

// After a failed exam, the next attempt waits RETAKE_HOURS. Returns when the
// next attempt may start, or null if it may start now.
export function retakeAt(examsOfLevel: ExamResult[], now: Date): Date | null {
  const last = [...examsOfLevel].sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime())[0];
  if (!last || last.score >= LEVEL_PASS_MARK) return null;
  const at = new Date(last.finishedAt.getTime() + RETAKE_HOURS * HOUR);
  return at > now ? at : null;
}

export type ReviewState = { dueAt: Date | null; due: boolean; overdue: boolean };

// The review is due REVIEW_EVERY_DAYS after the last review, or after the
// first finished topic quiz if there has been no review yet. It is overdue,
// and locks topic quizzes, REVIEW_GRACE_HOURS after that.
export function reviewState(lastReviewAt: Date | null, firstQuizAt: Date | null, now: Date): ReviewState {
  const anchor = lastReviewAt ?? firstQuizAt;
  if (!anchor) return { dueAt: null, due: false, overdue: false };
  const dueAt = new Date(anchor.getTime() + REVIEW_EVERY_DAYS * 24 * HOUR);
  return {
    dueAt,
    due: now >= dueAt,
    overdue: now.getTime() >= dueAt.getTime() + REVIEW_GRACE_HOURS * HOUR,
  };
}

export type ScoredAnswer = { topicId: string; score: number; at: Date };

// A topic is weak when the average of its last 3 answer scores is under 70%.
// Returns weak topics, worst first.
export function weakTopics(answers: ScoredAnswer[]): { topicId: string; average: number }[] {
  const byTopic = new Map<string, ScoredAnswer[]>();
  for (const a of answers) byTopic.set(a.topicId, [...(byTopic.get(a.topicId) ?? []), a]);
  const weak: { topicId: string; average: number }[] = [];
  for (const [topicId, list] of byTopic) {
    const last3 = list.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 3);
    const average = last3.reduce((sum, a) => sum + a.score, 0) / last3.length;
    if (average < WEAK_BELOW) weak.push({ topicId, average });
  }
  return weak.sort((a, b) => a.average - b.average);
}
