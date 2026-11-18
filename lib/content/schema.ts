import { z } from "zod";

// Schemas for content/syllabus.json and content/questions/level-N.json.
// The seed script uses them to fail loudly on bad data.

export const syllabusSchema = z.object({
  tracks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      levels: z.array(
        z.object({
          id: z.string(),
          number: z.number().int().positive(),
          title: z.string(),
          topics: z.array(
            z.object({
              id: z.string(),
              position: z.number().int().positive(),
              title: z.string(),
              interview_question: z.string(),
              reference_url: z.url(),
            }),
          ),
        }),
      ),
    }),
  ),
});

const base = {
  id: z.string(),
  topic_id: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  prompt: z.string().min(1),
};

export const questionSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...base,
      type: z.literal("mcq"),
      options: z.array(z.string().min(1)).min(3).max(5),
      correct_answer: z.string(),
      explanation: z.string().min(1),
    })
    .refine((q) => q.options.includes(q.correct_answer), {
      message: "correct_answer must be one of the options",
    })
    .refine((q) => new Set(q.options).size === q.options.length, {
      message: "options must be unique",
    }),
  // prompt is the code snippet; correct_answer is exactly what it prints.
  z.object({
    ...base,
    type: z.literal("output"),
    correct_answer: z.string().min(1),
    explanation: z.string().min(1),
  }),
  // correct_answer is a short model answer.
  z.object({
    ...base,
    type: z.literal("written"),
    key_points: z.array(z.string().min(1)).min(3).max(5),
    correct_answer: z.string().min(1),
  }),
]);

export type Question = z.infer<typeof questionSchema>;

// Per topic: 9 mcq (3 per difficulty), 3 output and 3 written (1 per difficulty).
const required: Record<string, number> = {
  "mcq-easy": 3, "mcq-medium": 3, "mcq-hard": 3,
  "output-easy": 1, "output-medium": 1, "output-hard": 1,
  "written-easy": 1, "written-medium": 1, "written-hard": 1,
};

export const questionFileSchema = z
  .object({ level: z.number().int().positive(), questions: z.array(questionSchema) })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    const counts = new Map<string, Record<string, number>>();
    for (const q of file.questions) {
      if (ids.has(q.id)) ctx.addIssue({ code: "custom", message: `duplicate id ${q.id}` });
      ids.add(q.id);
      const c = counts.get(q.topic_id) ?? {};
      const key = `${q.type}-${q.difficulty}`;
      c[key] = (c[key] ?? 0) + 1;
      counts.set(q.topic_id, c);
    }
    for (const [topic, c] of counts) {
      for (const [key, n] of Object.entries(required)) {
        if ((c[key] ?? 0) !== n)
          ctx.addIssue({ code: "custom", message: `${topic}: expected ${n} ${key}, got ${c[key] ?? 0}` });
      }
    }
  });
