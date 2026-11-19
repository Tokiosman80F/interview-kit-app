"use client";

import { useEffect, useState, useTransition } from "react";
import { CodeEditor } from "@/components/code-editor";
import { runInWorker } from "@/lib/runner/client";
import type { TestCase, TestResult } from "@/lib/runner/run";
import { submitCoding } from "@/app/coding/[id]/actions";

const LIMIT_MS = 20 * 60 * 1000;

type Draft = { code: string; startedAt: number };

// The draft lives in localStorage so a refresh or a closed tab does not lose
// your code. This component only renders in the browser (see coding-client).
function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, draft: Draft | null) {
  try {
    if (draft) localStorage.setItem(key, JSON.stringify(draft));
    else localStorage.removeItem(key);
  } catch {
    // Storage can be full or blocked; the editor still works without it.
  }
}

function clock(ms: number) {
  const s = Math.floor(Math.abs(ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function CodingRunner({
  questionId,
  starter,
  tests,
}: {
  questionId: string;
  starter: string;
  tests: TestCase[];
}) {
  const key = `coding-draft:${questionId}`;
  const [draft] = useState(() => readDraft(key) ?? { code: starter, startedAt: Date.now() });
  const [code, setCode] = useState(draft.code);
  const [editorStart, setEditorStart] = useState(draft.code);
  const [editorKey, setEditorKey] = useState(0);
  const [startedAt, setStartedAt] = useState(draft.startedAt);
  const [now, setNow] = useState(draft.startedAt);
  const [results, setResults] = useState<(TestResult | null)[]>(() => tests.map(() => null));
  const [running, setRunning] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = LIMIT_MS - (now - startedAt);
  const passed = results.filter((r) => r?.passed).length;
  const busy = running || submitting;

  function edit(value: string) {
    setCode(value);
    writeDraft(key, { code: value, startedAt });
  }

  async function run() {
    setRunning(true);
    setError("");
    setResults(tests.map(() => null));
    const all = await runInWorker(code, tests, (i, r) =>
      setResults((prev) => prev.map((x, j) => (j === i ? r : x))),
    );
    setResults(all);
    setRunning(false);
    return all;
  }

  async function submit() {
    const all = await run();
    const failing = all.filter((r) => !r.passed).length;
    if (failing > 0 && !confirm(`${failing} test(s) still fail. Submit anyway?`)) return;
    startSubmit(async () => {
      try {
        writeDraft(key, null);
        await submitCoding(questionId, code, all, startedAt);
      } catch (e) {
        // A redirect is how a successful submit ends; let Next handle it.
        if (e && typeof e === "object" && String((e as { digest?: unknown }).digest).startsWith("NEXT_")) throw e;
        writeDraft(key, { code, startedAt });
        setError("Could not save. Check your connection and try again.");
      }
    });
  }

  function reset() {
    if (!confirm("Start again with the starter code? Your code and timer are cleared.")) return;
    const fresh = { code: starter, startedAt: Date.now() };
    writeDraft(key, fresh);
    setCode(starter);
    setEditorStart(starter);
    setEditorKey((k) => k + 1);
    setStartedAt(fresh.startedAt);
    setNow(fresh.startedAt);
    setResults(tests.map(() => null));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className={`badge ${left < 0 ? "badge-warning" : "badge-ghost"} font-mono`}>
          {left < 0 ? `Over by ${clock(left)}` : `${clock(left)} left`}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset} disabled={busy}>
          Reset
        </button>
      </div>
      {left < 0 && (
        <div role="alert" className="alert alert-warning">
          Your 20 minutes are up. Finish if you are close, then submit. If not, read the model solution on the
          results page and write it again from memory tomorrow.
        </div>
      )}

      <CodeEditor key={editorKey} initial={editorStart} onChange={edit} />

      {error && (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <button type="button" className="btn" onClick={run} disabled={busy}>
          {running && <span className="loading loading-spinner loading-sm" />}
          Run tests
        </button>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
          {submitting && <span className="loading loading-spinner loading-sm" />}
          Submit
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6 gap-3">
          <h2 className="card-title text-base">
            Tests{results.some(Boolean) && `: ${passed} of ${tests.length} passed`}
          </h2>
          <ul className="flex flex-col gap-2">
            {tests.map((t, i) => {
              const r = results[i];
              return (
                <li key={t.name} className="rounded-box border border-base-300 p-3 flex flex-col gap-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{t.name}</span>
                    {r && (
                      <span className={`badge ${r.passed ? "badge-success" : "badge-error"}`}>
                        {r.passed ? "Pass" : "Fail"}
                      </span>
                    )}
                  </div>
                  <code className="text-sm break-all">{t.call}</code>
                  {r && !r.passed && (
                    <div className="text-sm font-mono break-all">
                      <div>Expected: {r.expected || JSON.stringify(t.expected)}</div>
                      <div>Actual: {r.actual}</div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
