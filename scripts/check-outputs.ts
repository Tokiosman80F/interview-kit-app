// Runs every output-prediction snippet with Node and compares what it
// prints with the stored answer. Run with: npm run check-outputs
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { normalizeOutput } from "../lib/scoring/grade.ts";

let failed = 0;
let checked = 0;
for (const file of readdirSync("content/questions").filter((f) => f.endsWith(".json"))) {
  const { questions } = JSON.parse(readFileSync(`content/questions/${file}`, "utf8"));
  for (const q of questions) {
    if (q.type !== "output") continue;
    checked++;
    const run = spawnSync(process.execPath, ["-e", q.prompt], { encoding: "utf8", timeout: 5000 });
    const actual = normalizeOutput(run.stdout);
    if (run.status !== 0 || actual !== normalizeOutput(q.correct_answer)) {
      failed++;
      console.log(`FAIL ${q.id}\n  stored: ${q.correct_answer}\n  actual: ${actual}\n  ${run.stderr.split("\n")[0]}`);
    }
  }
}
console.log(`${checked} snippets checked, ${failed} failed`);
process.exit(failed ? 1 : 0);
