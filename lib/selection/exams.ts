// Picks the questions of a level exam and of a review exam.
import { easyToHard } from "./topic-quiz";
import { seededShuffle } from "./shuffle";

export type ExamCandidate = {
  id: string;
  topic_id: string;
  type: "mcq" | "output" | "written" | "coding";
  difficulty: "easy" | "medium" | "hard";
};

// The last answer to each question: its score (0 to 1) and when (ms since 1970).
export type AnswerHistory = Map<string, { score: number; at: number }>;

const WRONG_BELOW = 0.7;

// Exams prefer questions you got wrong, then ones you have not answered for
// the longest time (never answered counts as longest). Ties are broken by a
// seeded shuffle, so two exams do not always pick the same questions.
export function rankByNeed<T extends { id: string }>(candidates: T[], history: AnswerHistory, seed: string): T[] {
  const rank = (c: T): [number, number] => {
    const h = history.get(c.id);
    if (h && h.score < WRONG_BELOW) return [0, h.at];
    if (!h) return [1, 0];
    return [2, h.at];
  };
  return seededShuffle(candidates, seed).sort((a, b) => {
    const [ga, ta] = rank(a);
    const [gb, tb] = rank(b);
    return ga - gb || ta - tb;
  });
}

type Group = "choice" | "written" | "coding";
const groupOf = (c: ExamCandidate): Group => (c.type === "mcq" || c.type === "output" ? "choice" : c.type);

// Takes candidates in order while their group still has room.
function take(ordered: ExamCandidate[], quota: Map<string, number>, key: (c: ExamCandidate) => string, picked: ExamCandidate[], limit = Infinity) {
  let n = 0;
  for (const c of ordered) {
    if (n >= limit) break;
    const left = quota.get(key(c)) ?? 0;
    if (left <= 0 || picked.includes(c)) continue;
    quota.set(key(c), left - 1);
    picked.push(c);
    n++;
  }
}

// Fills any empty slots (for example no coding problem in this level) with
// multiple choice or output questions, so the exam keeps its length.
function fillUp(ordered: ExamCandidate[], picked: ExamCandidate[], size: number) {
  for (const c of ordered) {
    if (picked.length >= size) break;
    if (!picked.includes(c) && groupOf(c) === "choice") picked.push(c);
  }
}

// Level exam: 15 questions from the level's topics, medium and hard only:
// 8 multiple choice, 3 output, 3 written, 1 coding.
export function buildLevelExam(candidates: ExamCandidate[], history: AnswerHistory, seed: string): ExamCandidate[] {
  const hardEnough = candidates.filter((c) => c.difficulty !== "easy");
  // Some levels only have easy coding problems; then any coding problem will do.
  const coding = hardEnough.some((c) => c.type === "coding") ? [] : candidates.filter((c) => c.type === "coding");
  const ordered = rankByNeed([...hardEnough, ...coding], history, seed);
  const picked: ExamCandidate[] = [];
  const quota = new Map<string, number>([["mcq", 8], ["output", 3], ["written", 3], ["coding", 1]]);
  take(ordered, quota, (c) => c.type, picked);
  fillUp(ordered, picked, 15);
  return easyToHard(picked);
}

// Review exam: 10 questions from finished topics, about 6 from weak topics and
// 4 at random: 6 multiple choice or output, 3 written, 1 coding, any difficulty.
export function buildReviewExam(
  candidates: ExamCandidate[],
  weakTopicIds: Set<string>,
  history: AnswerHistory,
  seed: string,
): ExamCandidate[] {
  const picked: ExamCandidate[] = [];
  const quota = new Map<string, number>([["choice", 6], ["written", 3], ["coding", 1]]);
  const fromWeak = rankByNeed(candidates.filter((c) => weakTopicIds.has(c.topic_id)), history, seed);
  take(fromWeak, quota, groupOf, picked, 6);
  const random = seededShuffle(candidates, `${seed}:random`);
  take(random, quota, groupOf, picked);
  fillUp(random, picked, 10);
  return easyToHard(picked);
}
