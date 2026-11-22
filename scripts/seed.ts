// Validates content/ and loads it into Supabase. Safe to run many times:
// every row is upserted by its id, so nothing is duplicated.
// Run with: npm run seed
import { readFileSync, readdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { codingFileSchema, questionFileSchema, syllabusSchema, type Question } from "../lib/content/schema.ts";

function fail(message: string): never {
  console.error(`\nSeed failed: ${message}`);
  process.exit(1);
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

const syllabus = syllabusSchema.safeParse(readJson("content/syllabus.json"));
if (!syllabus.success) fail(`content/syllabus.json\n${issues(syllabus.error)}`);

const topicLevel = new Map<string, number>();
for (const track of syllabus.data.tracks)
  for (const level of track.levels)
    for (const topic of level.topics) topicLevel.set(topic.id, level.number);

const questions: Question[] = [];
const files = readdirSync("content/questions").filter((f) => /^level-\d+\.json$/.test(f));
for (const file of files) {
  const parsed = questionFileSchema.safeParse(readJson(`content/questions/${file}`));
  if (!parsed.success) fail(`content/questions/${file}\n${issues(parsed.error)}`);
  for (const q of parsed.data.questions) {
    const level = topicLevel.get(q.topic_id);
    if (level === undefined) fail(`${file}: ${q.id} has unknown topic ${q.topic_id}`);
    if (level !== parsed.data.level) fail(`${file}: ${q.id} belongs to level ${level}`);
  }
  questions.push(...parsed.data.questions);
}

const coding = codingFileSchema.safeParse(readJson("content/coding.json"));
if (!coding.success) fail(`content/coding.json\n${issues(coding.error)}`);
for (const q of coding.data.questions)
  if (!topicLevel.has(q.topic_id)) fail(`coding.json: ${q.id} has unknown topic ${q.topic_id}`);

function issues(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
const db = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table: string, rows: object[]) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict: "id" });
    if (error) fail(`${table}: ${error.message}`);
  }
}

// Every id currently in a table, read in pages (Supabase returns at most 1000 rows at once).
async function existingIds(table: string): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select("id").order("id").range(from, from + 999);
    if (error) fail(`${table}: ${error.message}`);
    ids.push(...data.map((r) => r.id as string));
    if (data.length < 1000) return ids;
  }
}

// Removes rows that are no longer in content/. If any of the owner's tests,
// answers or notes still point to a row, the delete fails and the seed stops,
// so trimming the syllabus can never silently drop the owner's data.
async function removeStale(table: string, keep: Set<string>) {
  const stale = (await existingIds(table)).filter((id) => !keep.has(id));
  if (stale.length === 0) return;
  const { error } = await db.from(table).delete().in("id", stale);
  if (error) fail(`${table}: could not remove ${stale.join(", ")}. Your own data still uses them: ${error.message}`);
  console.log(`Removed ${stale.length} ${table} no longer in content/.`);
}

const tracks = syllabus.data.tracks;
const levels = tracks.flatMap((t) => t.levels.map((l) => ({ track: t.id, ...l })));
const topics = levels.flatMap((l) => l.topics.map((t) => ({ ...t, level_id: l.id })));

// The order matters, because of foreign keys and the unique (level_id, position):
// 1. remove questions no longer in content/;
// 2. write levels, then park every topic at position + 1000, so new topics
//    exist without clashing with the old positions;
// 3. write the questions, which moves any question onto its new topic;
// 4. remove topics and levels no longer in content/ (nothing points to them now);
// 5. write the real topic positions, which are all free by then.
await removeStale("questions", new Set([...questions.map((q) => q.id), ...coding.data.questions.map((q) => q.id)]));
await upsert("tracks", tracks.map(({ id, name }) => ({ id, name })));
await upsert("levels", levels.map((l) => ({ id: l.id, track_id: l.track, number: l.number, title: l.title })));
await upsert("topics", topics.map((t) => ({ ...t, position: t.position + 1000 })));
await upsert(
  "questions",
  questions.map((q) => ({
    id: q.id,
    topic_id: q.topic_id,
    type: q.type,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: q.type === "mcq" ? q.options : null,
    correct_answer: q.correct_answer,
    explanation: q.type === "written" ? null : q.explanation,
    key_points: q.type === "written" ? q.key_points : null,
    test_cases: null,
    starter_code: null,
  }))
);
await upsert(
  "questions",
  coding.data.questions.map((q) => ({
    id: q.id,
    topic_id: q.topic_id,
    type: "coding",
    difficulty: q.difficulty,
    title: q.title,
    prompt: q.prompt,
    options: null,
    correct_answer: q.solution,
    explanation: q.explanation,
    key_points: null,
    test_cases: q.test_cases,
    starter_code: q.starter_code,
  }))
);
await removeStale("topics", new Set(topics.map((t) => t.id)));
await removeStale("levels", new Set(levels.map((l) => l.id)));
await upsert("topics", topics);

console.log(`Seeded ${tracks.length} track, ${levels.length} levels, ${topicLevel.size} topics.`);
const summary = new Map<number, Record<string, number>>();
for (const q of questions) {
  const level = topicLevel.get(q.topic_id)!;
  const row = summary.get(level) ?? {};
  row[q.type] = (row[q.type] ?? 0) + 1;
  summary.set(level, row);
}
for (const [level, row] of [...summary].sort((a, b) => a[0] - b[0]))
  console.log(`Level ${level}: ${Object.entries(row).map(([t, n]) => `${n} ${t}`).join(", ")}`);
console.log(`Coding: ${coding.data.questions.length} problems`);
