import { describe, expect, it } from "vitest";
import { buildLevelExam, buildReviewExam, rankByNeed, type AnswerHistory, type ExamCandidate } from "./exams";

// A topic's full question set: 9 mcq (3 per difficulty), 1 output and 1 written per difficulty.
function topic(t: string, coding: ExamCandidate["difficulty"][] = []): ExamCandidate[] {
  const out: ExamCandidate[] = [];
  const diffs = ["easy", "medium", "hard"] as const;
  diffs.forEach((d) => {
    for (let i = 0; i < 3; i++) out.push({ id: `${t}-mcq-${d}-${i}`, topic_id: t, type: "mcq", difficulty: d });
    out.push({ id: `${t}-output-${d}`, topic_id: t, type: "output", difficulty: d });
    out.push({ id: `${t}-written-${d}`, topic_id: t, type: "written", difficulty: d });
  });
  coding.forEach((d, i) => out.push({ id: `${t}-coding-${i}`, topic_id: t, type: "coding", difficulty: d }));
  return out;
}
const count = (qs: ExamCandidate[], type: string) => qs.filter((q) => q.type === type).length;
const rank = { easy: 0, medium: 1, hard: 2 };

describe("rankByNeed", () => {
  it("puts wrong answers first, then never answered, then oldest answered", () => {
    const qs = [{ id: "right-old" }, { id: "never" }, { id: "wrong" }, { id: "right-new" }];
    const history: AnswerHistory = new Map([
      ["wrong", { score: 0, at: 500 }],
      ["right-old", { score: 1, at: 100 }],
      ["right-new", { score: 1, at: 900 }],
    ]);
    expect(rankByNeed(qs, history, "s").map((q) => q.id)).toEqual(["wrong", "never", "right-old", "right-new"]);
  });
});

describe("buildLevelExam", () => {
  const pool = [...topic("a", ["medium"]), ...topic("b"), ...topic("c")];

  it("has 15 questions: 8 mcq, 3 output, 3 written, 1 coding", () => {
    const exam = buildLevelExam(pool, new Map(), "seed");
    expect(exam).toHaveLength(15);
    expect([count(exam, "mcq"), count(exam, "output"), count(exam, "written"), count(exam, "coding")]).toEqual([8, 3, 3, 1]);
  });

  it("uses only medium and hard questions", () => {
    expect(buildLevelExam(pool, new Map(), "seed").every((q) => q.difficulty !== "easy")).toBe(true);
  });

  it("is ordered easy to hard", () => {
    const d = buildLevelExam(pool, new Map(), "seed").map((q) => rank[q.difficulty]);
    expect(d).toEqual([...d].sort((x, y) => x - y));
  });

  it("includes a question answered wrong before", () => {
    const history: AnswerHistory = new Map([["c-mcq-hard-2", { score: 0, at: 1 }]]);
    expect(buildLevelExam(pool, history, "seed").some((q) => q.id === "c-mcq-hard-2")).toBe(true);
  });

  it("fills the coding slot with multiple choice when the level has no coding problem", () => {
    const exam = buildLevelExam([...topic("b"), ...topic("c")], new Map(), "seed");
    expect(exam).toHaveLength(15);
    expect(count(exam, "coding")).toBe(0);
  });

  it("uses an easy coding problem when the level has no harder one", () => {
    const exam = buildLevelExam([...topic("a", ["easy"]), ...topic("b")], new Map(), "seed");
    expect(count(exam, "coding")).toBe(1);
  });
});

describe("buildReviewExam", () => {
  const pool = [...topic("weak", ["easy"]), ...topic("ok1"), ...topic("ok2")];

  it("has 10 questions: 6 multiple choice or output, 3 written, 1 coding", () => {
    const exam = buildReviewExam(pool, new Set(["weak"]), new Map(), "seed");
    expect(exam).toHaveLength(10);
    expect(count(exam, "mcq") + count(exam, "output")).toBe(6);
    expect(count(exam, "written")).toBe(3);
    expect(count(exam, "coding")).toBe(1);
  });

  it("takes about 6 questions from weak topics", () => {
    const exam = buildReviewExam(pool, new Set(["weak"]), new Map(), "seed");
    expect(exam.filter((q) => q.topic_id === "weak").length).toBeGreaterThanOrEqual(6);
  });

  it("still makes a full exam with no weak topics", () => {
    expect(buildReviewExam(pool, new Set(), new Map(), "seed")).toHaveLength(10);
  });
});
