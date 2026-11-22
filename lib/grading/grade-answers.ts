// Server only. One request grades every written and coding answer of a test.
import { callGemini } from "./gemini";
import { callGroq } from "./groq";
import { buildPrompt } from "./prompt";
import { parseGradingResponse, type GradingItem, type GradingResult } from "./schema";

export type Provider = "gemini" | "groq";
type Call = (prompt: { system: string; user: string }) => Promise<string>;

export type GradeOutcome =
  | { ok: true; provider: Provider; results: Map<string, GradingResult> }
  | { ok: false; errors: string[] };

// Gemini first. On any error, including a 429 or a reply that is not valid
// JSON in our shape, the same prompt goes to Groq. If both fail, the caller
// keeps the test waiting for grading and tries again later.
export async function gradeAnswers(
  items: GradingItem[],
  providers: [Provider, Call][] = [
    ["gemini", callGemini],
    ["groq", callGroq],
  ],
): Promise<GradeOutcome> {
  const prompt = buildPrompt(items);
  const ids = items.map((i) => i.id);
  const errors: string[] = [];
  for (const [provider, call] of providers) {
    try {
      return { ok: true, provider, results: parseGradingResponse(await call(prompt), ids) };
    } catch (e) {
      errors.push(`${provider}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { ok: false, errors };
}
