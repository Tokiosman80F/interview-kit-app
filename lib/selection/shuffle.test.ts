import { describe, expect, it } from "vitest";
import { seededShuffle } from "./shuffle";

const options = ["a", "b", "c", "d"];

describe("seededShuffle", () => {
  it("gives the same order for the same seed", () => {
    expect(seededShuffle(options, "test-1:q-1")).toEqual(seededShuffle(options, "test-1:q-1"));
  });

  it("keeps every option exactly once", () => {
    expect([...seededShuffle(options, "x")].sort()).toEqual(options);
  });

  it("does not change the input", () => {
    seededShuffle(options, "x");
    expect(options).toEqual(["a", "b", "c", "d"]);
  });

  it("puts the first option in every position across many seeds", () => {
    const positions = new Set<number>();
    for (let i = 0; i < 100; i++) positions.add(seededShuffle(options, `seed-${i}`).indexOf("a"));
    expect([...positions].sort()).toEqual([0, 1, 2, 3]);
  });
});
