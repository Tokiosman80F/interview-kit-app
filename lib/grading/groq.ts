// Server only: reads GROQ_API_KEY. Never import this from a client component.
import { responseJsonSchema } from "./schema";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

// Sends the prompt to Groq's chat completions with a strict JSON schema and
// returns the reply text. Throws on a missing key, any non-200 status (429
// included), or an empty reply.
export async function callGroq(prompt: { system: string; user: string }): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      response_format: { type: "json_schema", json_schema: { name: "grading", strict: true, schema: responseJsonSchema } },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text: string | undefined = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned no text");
  return text;
}
