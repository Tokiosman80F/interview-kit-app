import { describe, expect, it } from "vitest";
import { levelExamAvailable, retakeAt, reviewState, unlockedLevels, weakTopics } from "./exams";

const day = (d: number, hour = 12) => new Date(Date.UTC(2026, 10, d, hour));

describe("unlockedLevels", () => {
  it("always opens level 1", () => {
    expect([...unlockedLevels([1, 2, 3], [])]).toEqual([1]);
  });
  it("opens the next level at exactly 70%", () => {
    expect([...unlockedLevels([1, 2, 3], [{ level: 1, score: 70, finishedAt: day(1) }])]).toEqual([1, 2]);
  });
  it("keeps the next level locked at 69%", () => {
    expect([...unlockedLevels([1, 2], [{ level: 1, score: 69, finishedAt: day(1) }])]).toEqual([1]);
  });
  it("uses any passing attempt, even after a later fail", () => {
    const exams = [
      { level: 1, score: 80, finishedAt: day(1) },
      { level: 1, score: 40, finishedAt: day(5) },
    ];
    expect(unlockedLevels([1, 2], exams).has(2)).toBe(true);
  });
  it("stops at the first level not passed", () => {
    const exams = [{ level: 2, score: 90, finishedAt: day(1) }];
    expect([...unlockedLevels([1, 2, 3], exams)]).toEqual([1]);
  });
});

describe("levelExamAvailable", () => {
  it("needs a quiz score on every topic of the level", () => {
    expect(levelExamAvailable(["a", "b"], new Map([["a", 60]]), true)).toBe(false);
    expect(levelExamAvailable(["a", "b"], new Map([["a", 60], ["b", 10]]), true)).toBe(true);
  });
  it("is never available in a locked level", () => {
    expect(levelExamAvailable(["a"], new Map([["a", 100]]), false)).toBe(false);
  });
});

describe("retakeAt", () => {
  it("allows the first attempt", () => {
    expect(retakeAt([], day(1))).toBeNull();
  });
  it("waits 24 hours after a fail", () => {
    const exams = [{ level: 1, score: 50, finishedAt: day(1, 10) }];
    expect(retakeAt(exams, day(2, 9))).toEqual(day(2, 10));
    expect(retakeAt(exams, day(2, 10))).toBeNull();
  });
  it("does not wait after a pass", () => {
    expect(retakeAt([{ level: 1, score: 90, finishedAt: day(1) }], day(1))).toBeNull();
  });
  it("looks only at the latest attempt", () => {
    const exams = [
      { level: 1, score: 20, finishedAt: day(1) },
      { level: 1, score: 75, finishedAt: day(3) },
    ];
    expect(retakeAt(exams, day(3, 13))).toBeNull();
  });
});

describe("reviewState", () => {
  it("is not due before any topic is finished", () => {
    expect(reviewState(null, null, day(10))).toEqual({ dueAt: null, due: false, overdue: false });
  });
  it("is due 3 days after the first quiz when there was no review yet", () => {
    const s = reviewState(null, day(1), day(4));
    expect(s.dueAt).toEqual(day(4));
    expect(s.due).toBe(true);
    expect(s.overdue).toBe(false);
  });
  it("is not due on day 2", () => {
    expect(reviewState(day(1), day(1), day(3, 11)).due).toBe(false);
  });
  it("becomes overdue one day after it is due", () => {
    expect(reviewState(day(1), null, day(5, 11)).overdue).toBe(false);
    expect(reviewState(day(1), null, day(5, 12)).overdue).toBe(true);
  });
  it("counts from the last review, not the first quiz", () => {
    expect(reviewState(day(8), day(1), day(10)).due).toBe(false);
  });
});

describe("weakTopics", () => {
  it("uses only the last 3 answers of a topic", () => {
    const answers = [
      { topicId: "a", score: 0, at: day(1) },
      { topicId: "a", score: 1, at: day(2) },
      { topicId: "a", score: 1, at: day(3) },
      { topicId: "a", score: 1, at: day(4) },
    ];
    expect(weakTopics(answers)).toEqual([]);
  });
  it("marks a topic under 70% as weak, worst first", () => {
    const answers = [
      { topicId: "a", score: 0.5, at: day(1) },
      { topicId: "b", score: 0, at: day(1) },
      { topicId: "c", score: 0.7, at: day(1) },
    ];
    expect(weakTopics(answers).map((w) => w.topicId)).toEqual(["b", "a"]);
  });
});
