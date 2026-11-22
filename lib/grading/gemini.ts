// Server only: reads GEMINI_API_KEY. Never import this from a client component.
import { responseJsonSchema } from "./schema";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

// Sends the prompt to Gemini's generateContent with a JSON schema and returns
// the reply text. Throws on a missing key, any non-200 status (429 included),
// or an empty reply.
export async function callGemini(prompt: { system: string; user: string }): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt.system }] },
      contents: [{ role: "user", parts: [{ text: prompt.user }] }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text).join("");
  if (!text) throw new Error("Gemini returned no text");
  return text;
}
