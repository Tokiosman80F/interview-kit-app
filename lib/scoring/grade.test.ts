import { describe, expect, it } from "vitest";
import { gradeMcq, gradeOutput, normalizeOutput, testScore } from "./grade";

describe("gradeMcq", () => {
  it("scores 1 only for the exact correct option", () => {
    expect(gradeMcq("b", "b")).toBe(1);
    expect(gradeMcq("a", "b")).toBe(0);
    expect(gradeMcq(null, "b")).toBe(0);
  });
});

describe("gradeOutput", () => {
  it("ignores extra spaces, newlines and tabs", () => {
    expect(gradeOutput("  1   4\n3\t2 ", "1 4 3 2")).toBe(1);
    expect(normalizeOutput("\n a \n\n b ")).toBe("a b");
  });
  it("is case sensitive and needs every word", () => {
    expect(gradeOutput("Object", "object")).toBe(0);
    expect(gradeOutput("1 4 3", "1 4 3 2")).toBe(0);
  });
  it("scores an empty or missing answer as 0", () => {
    expect(gradeOutput(null, "x")).toBe(0);
    expect(gradeOutput("   ", "x")).toBe(0);
  });
});

describe("testScore", () => {
  it("averages question scores as a percentage", () => {
    expect(testScore([1, 1, 1])).toBe(100);
    expect(testScore([1, 0, 1, 0])).toBe(50);
    expect(testScore([1, 0, 0])).toBe(33);
    expect(testScore([0.5, 1])).toBe(75);
  });
  it("scores a test with zero questions as 0", () => {
    expect(testScore([])).toBe(0);
  });
});
