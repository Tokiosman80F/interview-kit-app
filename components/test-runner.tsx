"use client";

import { useState, useTransition } from "react";
import { saveAnswer, finishTest } from "@/app/test/[id]/actions";
import { CodeBlock, RichText } from "@/components/rich-text";
import type { QuizQuestion } from "@/lib/data";
import { DONT_KNOW } from "@/lib/scoring/grade";

type Question = Omit<QuizQuestion, "correct_answer" | "explanation">;

export function TestRunner({
  testId,
  title,
  questions,
  initialResponses,
}: {
  testId: string;
  title: string;
  questions: Question[];
  initialResponses: string[];
}) {
  const [responses, setResponses] = useState(initialResponses);
  const [saved, setSaved] = useState(initialResponses);
  // Resume at the first unanswered question.
  const [index, setIndex] = useState(() => Math.max(0, initialResponses.findIndex((r) => r === "")));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const q = questions[index];
  const last = index === questions.length - 1;
  const unanswered = responses.filter((r) => r.trim() === "").length;

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

  function finish() {
    if (unanswered > 0 && !confirm(`${unanswered} question(s) have no answer. Finish anyway?`)) return;
    setError("");
    // finishTest redirects to the results page, so no try/catch here.
    startTransition(async () => {
      await save(index, responses[index]);
      await finishTest(testId);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-baseline gap-2">
        <h1 className="text-xl font-bold">
          <RichText text={title} />
        </h1>
        <span className="text-sm text-base-content/60 whitespace-nowrap">
          {index + 1} / {questions.length}
        </span>
      </div>
      <progress className="progress progress-primary w-full" value={index + 1} max={questions.length} />

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6 gap-4">
          <span className="badge badge-ghost">{q.difficulty}</span>
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
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <button className="btn" disabled={index === 0 || pending} onClick={() => go(index - 1)}>
          Previous
        </button>
        {last ? (
          <button className="btn btn-primary" disabled={pending} onClick={finish}>
            {pending && <span className="loading loading-spinner loading-sm" />}
            Finish
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
