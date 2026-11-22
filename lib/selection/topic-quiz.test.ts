import { describe, expect, it } from "vitest";
import { buildTopicQuiz, easyToHard } from "./topic-quiz";

const q = (id: string, type: string, difficulty: "easy" | "medium" | "hard") => ({ id, type, difficulty });

describe("buildTopicQuiz", () => {
  it("keeps mcq, output and written, drops coding, orders easy to hard", () => {
    const quiz = buildTopicQuiz([
      q("h1", "mcq", "hard"),
      q("w1", "written", "easy"),
      q("e1", "mcq", "easy"),
      q("m1", "output", "medium"),
      q("e2", "output", "easy"),
      q("c1", "coding", "easy"),
    ]);
    expect(quiz.map((x) => x.id)).toEqual(["w1", "e1", "e2", "m1", "h1"]);
  });
  it("returns an empty quiz for no questions", () => {
    expect(buildTopicQuiz([])).toEqual([]);
  });
  it("does not change the input array", () => {
    const input = [q("h", "mcq", "hard"), q("e", "mcq", "easy")];
    easyToHard(input);
    expect(input[0].id).toBe("h");
  });
});
