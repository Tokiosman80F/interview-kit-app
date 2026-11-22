import { describe, expect, it } from "vitest";
import { bestScores, unlockedIds } from "./unlock";

const ids = ["a", "b", "c", "d"];

describe("unlockedIds", () => {
  it("opens only the first item when nothing is done", () => {
    expect([...unlockedIds(ids, new Map())]).toEqual(["a"]);
  });

  it("opens the next item at exactly 50%", () => {
    expect([...unlockedIds(ids, new Map([["a", 50]]))]).toEqual(["a", "b"]);
  });

  it("keeps the next item locked below 50%", () => {
    expect([...unlockedIds(ids, new Map([["a", 49]]))]).toEqual(["a"]);
  });

  it("stops at the first item below the mark, even if later items have scores", () => {
    const best = new Map([["a", 80], ["b", 30], ["c", 90]]);
    expect([...unlockedIds(ids, best)]).toEqual(["a", "b"]);
  });

  it("opens everything when every item is passed", () => {
    const best = new Map(ids.map((id) => [id, 100]));
    expect([...unlockedIds(ids, best)]).toEqual(ids);
  });

  it("handles an empty list", () => {
    expect(unlockedIds([], new Map()).size).toBe(0);
  });
});

describe("bestScores", () => {
  it("keeps the best attempt per id", () => {
    const best = bestScores([
      { id: "a", score: 42 },
      { id: "a", score: 67 },
      { id: "a", score: 33 },
      { id: "b", score: 0 },
    ]);
    expect(best.get("a")).toBe(67);
    expect(best.get("b")).toBe(0);
  });
});
