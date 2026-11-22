import { z } from "zod";

// What we send: every written and coding answer of one test, in one request.
export type GradingItem =
  | { id: string; kind: "written"; question: string; keyPoints: string[]; answer: string }
  | { id: string; kind: "coding"; question: string; answer: string; tests: { name: string; passed: boolean }[] };

// What each provider must return, one result per answer id.
const result = z.object({
  id: z.string(),
  score: z.number().int().min(0).max(10),
  covered: z.array(z.string()),
  missed: z.array(z.string()),
  mistakes: z.array(z.string()),
  model_answer: z.string(),
  edge_cases: z.array(z.string()),
  suggestion: z.string(),
});
export type GradingResult = z.infer<typeof result>;
const response = z.object({ results: z.array(result) });

// The same shape as JSON Schema for the providers' structured output.
// Written by hand: every field required and no extra fields, which strict
// mode needs, and only keywords both Gemini and Groq support (no min/max;
// Zod checks the score range).
const strings = { type: "array", items: { type: "string" } };
export const responseJsonSchema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          score: { type: "integer" },
          covered: strings,
          missed: strings,
          mistakes: strings,
          model_answer: { type: "string" },
          edge_cases: strings,
          suggestion: { type: "string" },
        },
        required: ["id", "score", "covered", "missed", "mistakes", "model_answer", "edge_cases", "suggestion"],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
};

// Parses a provider's reply. Throws unless it is valid JSON in the right shape
// with exactly one result for every id we asked about.
export function parseGradingResponse(text: string, ids: string[]): Map<string, GradingResult> {
  const parsed = response.parse(JSON.parse(text));
  const byId = new Map(parsed.results.map((r) => [r.id, r]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) throw new Error(`No result for answer ${missing.join(", ")}`);
  return byId;
}
