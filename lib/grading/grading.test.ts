import { describe, expect, it, vi } from "vitest";
import { gradeAnswers, type Provider } from "./grade-answers";
import { buildPrompt } from "./prompt";
import { parseGradingResponse, type GradingItem } from "./schema";

const items: GradingItem[] = [
  { id: "1", kind: "written", question: "What is a closure?", keyPoints: ["Remembers outer variables"], answer: "A function with its scope." },
  { id: "2", kind: "coding", question: "Write map", answer: "function map() {}", tests: [{ name: "doubles", passed: false }] },
];

const result = (id: string, score = 7) => ({
  id,
  score,
  covered: [],
  missed: [],
  mistakes: [],
  model_answer: "A good answer.",
  edge_cases: [],
  suggestion: "",
});
const reply = JSON.stringify({ results: [result("1", 8), result("2", 5)] });

type Call = (p: { system: string; user: string }) => Promise<string>;
const providers = (gemini: Call, groq: Call): [Provider, Call][] => [
  ["gemini", gemini],
  ["groq", groq],
];

describe("gradeAnswers", () => {
  it("uses Gemini when it works, and never calls Groq", async () => {
    const groq = vi.fn();
    const out = await gradeAnswers(items, providers(async () => reply, groq));
    expect(out.ok && out.provider).toBe("gemini");
    expect(out.ok && out.results.get("1")?.score).toBe(8);
    expect(groq).not.toHaveBeenCalled();
  });

  it("falls back to Groq when Gemini fails, for example with a 429", async () => {
    const out = await gradeAnswers(
      items,
      providers(async () => {
        throw new Error("Gemini 429");
      }, async () => reply),
    );
    expect(out.ok && out.provider).toBe("groq");
  });

  it("falls back to Groq when Gemini returns invalid JSON", async () => {
    const out = await gradeAnswers(items, providers(async () => "not json {", async () => reply));
    expect(out.ok && out.provider).toBe("groq");
  });

  it("falls back when Gemini leaves out an answer", async () => {
    const partial = JSON.stringify({ results: [result("1")] });
    const out = await gradeAnswers(items, providers(async () => partial, async () => reply));
    expect(out.ok && out.provider).toBe("groq");
  });

  it("reports a failure when both providers fail", async () => {
    const out = await gradeAnswers(
      items,
      providers(async () => {
        throw new Error("down");
      }, async () => "{}"),
    );
    expect(out.ok).toBe(false);
    expect(!out.ok && out.errors).toHaveLength(2);
  });

  it("sends every answer in one request", async () => {
    const gemini = vi.fn(async () => reply);
    await gradeAnswers(items, providers(gemini, vi.fn()));
    expect(gemini).toHaveBeenCalledTimes(1);
    const sent = JSON.parse((gemini.mock.calls[0] as unknown as [{ user: string }])[0].user);
    expect(sent.answers.map((a: { id: string }) => a.id)).toEqual(["1", "2"]);
  });
});

describe("parseGradingResponse", () => {
  it("rejects a score outside 0 to 10", () => {
    const bad = JSON.stringify({ results: [result("1", 11)] });
    expect(() => parseGradingResponse(bad, ["1"])).toThrow();
  });

  it("rejects a reply with a missing field", () => {
    const noSuggestion: Partial<ReturnType<typeof result>> = result("1");
    delete noSuggestion.suggestion;
    expect(() => parseGradingResponse(JSON.stringify({ results: [noSuggestion] }), ["1"])).toThrow();
  });
});

describe("buildPrompt", () => {
  it("includes the key points for written answers and the tests for code", () => {
    const { user } = buildPrompt(items);
    const sent = JSON.parse(user);
    expect(sent.answers[0].key_points).toEqual(["Remembers outer variables"]);
    expect(sent.answers[1].tests).toEqual([{ name: "doubles", passed: false }]);
  });
});
