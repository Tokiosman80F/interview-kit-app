"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveAnswer, finishTest } from "@/app/test/[id]/actions";
import { CodeBlock, RichText } from "@/components/rich-text";
import { CodeEditor } from "@/components/code-editor";
import { Card, CardBody } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion } from "@/lib/data";
import { DONT_KNOW } from "@/lib/scoring/grade";
import { runInWorker } from "@/lib/runner/client";
import type { TestCase, TestResult } from "@/lib/runner/run";

export type RunnerQuestion = Omit<QuizQuestion, "correct_answer" | "explanation"> & {
  title?: string | null;
  starter_code?: string | null;
  test_cases?: TestCase[] | null;
};

function clock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function TestRunner({
  testId,
  title,
  questions,
  initialResponses,
  timeLeftMs,
}: {
  testId: string;
  title: string;
  questions: RunnerQuestion[];
  initialResponses: string[];
  // Exams only: time left when the page loaded. Null for untimed topic quizzes.
  timeLeftMs: number | null;
}) {
  // A coding answer starts from the starter code.
  const [responses, setResponses] = useState(() =>
    initialResponses.map((r, i) => (r === "" && questions[i].type === "coding" ? (questions[i].starter_code ?? "") : r)),
  );
  const [saved, setSaved] = useState(initialResponses);
  // Resume at the first unanswered question.
  const [index, setIndex] = useState(() => Math.max(0, initialResponses.findIndex((r) => r === "")));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [runs, setRuns] = useState<Record<string, TestResult[]>>({});
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(timeLeftMs);

  const q = questions[index];
  const last = index === questions.length - 1;
  const unanswered = responses.filter((r, i) => r.trim() === "" || (questions[i].type === "coding" && r === questions[i].starter_code)).length;

  async function save(i: number, value: string) {
    if (value === saved[i]) return;
    await saveAnswer(testId, questions[i].id, value);
    setSaved((s) => s.map((x, j) => (j === i ? value : x)));
  }

  function run(task: () => Promise<void>) {
    setError("");
    startTransition(async () => {
      try {
        await task();
      } catch {
        setError("Could not save. Check your connection and try again.");
      }
    });
  }

  // Background saves stay outside the transition so they never disable the
  // Next or Finish button and swallow a click.
  function saveInBackground(i: number, value: string) {
    setError("");
    save(i, value).catch(() => setError("Could not save. Check your connection and try again."));
  }

  function choose(value: string) {
    setResponses((r) => r.map((x, j) => (j === index ? value : x)));
    saveInBackground(index, value);
  }

  function type(value: string) {
    setResponses((r) => r.map((x, j) => (j === index ? value : x)));
  }

  function go(to: number) {
    run(async () => {
      await save(index, responses[index]);
      setIndex(to);
    });
  }

  async function runTests(i: number) {
    const question = questions[i];
    const results = await runInWorker(responses[i], question.test_cases ?? [], () => {});
    setRuns((r) => ({ ...r, [question.id]: results }));
    return results;
  }

  function finish(auto = false) {
    if (!auto && unanswered > 0 && !confirm(`${unanswered} question(s) have no answer. Finish anyway?`)) return;
    setError("");
    // finishTest redirects to the results page, so no try/catch here.
    startTransition(async () => {
      await Promise.all(responses.map((r, i) => save(i, r)));
      // Run every coding question's tests on the final code; the score comes from these.
      const coding: Record<string, TestResult[]> = {};
      for (let i = 0; i < questions.length; i++)
        if (questions[i].type === "coding") coding[questions[i].id] = await runTests(i);
      await finishTest(testId, coding);
    });
  }

  // Exam timer: counts down and finishes the exam when it reaches 0:00.
  const latestFinish = useRef(finish);
  const deadline = useRef(0);
  useEffect(() => {
    latestFinish.current = finish;
  });
  useEffect(() => {
    if (timeLeftMs === null) return;
    deadline.current = Date.now() + timeLeftMs;
    let done = false;
    const id = setInterval(() => {
      const remaining = deadline.current - Date.now();
      setLeft(remaining);
      if (remaining <= 0 && !done) {
        done = true;
        clearInterval(id);
        latestFinish.current(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeftMs]);

  const result = runs[q.id];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-baseline gap-2">
        <h1 className="text-xl font-bold">
          <RichText text={title} />
        </h1>
        <span className="flex items-center gap-2 text-sm text-base-content/60 whitespace-nowrap">
          {left !== null && (
            <Badge tone={left < 5 * 60 * 1000 ? "warning" : "ghost"} className="font-mono">
              {clock(left)}
            </Badge>
          )}
          {index + 1} / {questions.length}
        </span>
      </div>
      <progress className="progress progress-primary w-full" value={index + 1} max={questions.length} />

      <Card>
        <CardBody className="gap-4">
          <Badge>{q.difficulty}</Badge>
          {q.type === "output" ? (
            <>
              <p className="font-semibold">What does this code print?</p>
              <CodeBlock code={q.prompt} />
              <input
                className="input w-full font-mono"
                placeholder="Exactly what is printed. Separate lines with a space."
                value={responses[index]}
                onChange={(e) => type(e.target.value)}
                onBlur={() => saveInBackground(index, responses[index])}
              />
              <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => choose(DONT_KNOW)}>
                {DONT_KNOW}
              </button>
            </>
          ) : q.type === "written" ? (
            <>
              <div className="font-semibold">
                <RichText text={q.prompt} />
              </div>
              <textarea
                className="textarea w-full min-h-40"
                placeholder="Answer as you would in an interview, in your own words. It is graded by AI against the key points."
                value={responses[index]}
                onChange={(e) => type(e.target.value)}
                onBlur={() => saveInBackground(index, responses[index])}
              />
              <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => choose(DONT_KNOW)}>
                {DONT_KNOW}
              </button>
            </>
          ) : q.type === "coding" ? (
            <>
              {q.title && (
                <p className="font-semibold">
                  <RichText text={q.title} />
                </p>
              )}
              <div>
                <RichText text={q.prompt} />
              </div>
              <CodeEditor key={q.id} initial={responses[index]} onChange={type} />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={running || pending}
                  onClick={async () => {
                    setRunning(true);
                    await runTests(index);
                    setRunning(false);
                  }}
                >
                  {running && <span className="loading loading-spinner loading-xs" />}
                  Run tests
                </button>
                {result && (
                  <span className="text-sm">
                    {result.filter((r) => r.passed).length} of {result.length} tests passed
                  </span>
                )}
              </div>
              {result && result.some((r) => !r.passed) && (
                <ul className="text-sm font-mono flex flex-col gap-1">
                  {result
                    .filter((r) => !r.passed)
                    .map((r) => (
                      <li key={r.name} className="break-all">
                        ✗ {r.name}: expected {r.expected || "?"}, got {r.actual}
                      </li>
                    ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="font-semibold">
                <RichText text={q.prompt} />
              </div>
              <div className="flex flex-col gap-2">
                {[...(q.options ?? []), DONT_KNOW].map((opt) => (
                  <label
                    key={opt}
                    className="flex gap-3 items-start cursor-pointer rounded-box border border-base-300 p-3 hover:bg-base-200"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="radio radio-primary radio-sm mt-0.5"
                      checked={responses[index] === opt}
                      onChange={() => choose(opt)}
                    />
                    <span>
                      <RichText text={opt} />
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex justify-between gap-2">
        <button className="btn" disabled={index === 0 || pending} onClick={() => go(index - 1)}>
          Previous
        </button>
        {last ? (
          <button className="btn btn-primary" disabled={pending} onClick={() => finish()}>
            {pending && <span className="loading loading-spinner loading-sm" />}
            {pending ? "Grading…" : "Finish"}
          </button>
        ) : (
          <button className="btn btn-primary" disabled={pending} onClick={() => go(index + 1)}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
