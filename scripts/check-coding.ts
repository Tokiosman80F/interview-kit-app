// Checks content/coding.json: every reference solution must pass all its
// tests, and the starter code must fail at least one (so the tests test
// something). Run with: npm run check-coding
import { readFileSync } from "node:fs";
import { codingFileSchema } from "../lib/content/schema.ts";
import { runTest } from "../lib/runner/run.ts";

const parsed = codingFileSchema.safeParse(JSON.parse(readFileSync("content/coding.json", "utf8")));
if (!parsed.success) {
  console.error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}

let failed = 0;
for (const q of parsed.data.questions) {
  for (const test of q.test_cases) {
    const r = await runTest(q.solution, test);
    if (!r.passed) {
      failed++;
      console.log(`FAIL ${q.id} "${test.name}": expected ${r.expected}, got ${r.actual}`);
    }
  }
  const starter = await Promise.all(q.test_cases.map((t) => runTest(q.starter_code, t)));
  if (starter.every((r) => r.passed)) {
    failed++;
    console.log(`FAIL ${q.id}: the starter code already passes every test`);
  }
}
console.log(`${parsed.data.questions.length} problems checked, ${failed} failed`);
process.exit(failed ? 1 : 0);
