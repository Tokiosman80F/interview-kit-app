import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { codingLadder } from "@/lib/coding";
import type { TestResult } from "@/lib/runner/run";
import { CodeBlock, RichText } from "@/components/rich-text";

type Answer = {
  response: string | null;
  feedback: { tests: TestResult[] } | null;
  question: { id: string; title: string; correct_answer: string | null };
};

export async function CodingResult({ supabase, testId, score }: { supabase: SupabaseClient; testId: string; score: number }) {
  const [{ data }, ladder] = await Promise.all([
    supabase
      .from("answers")
      .select("response, feedback, question:questions!inner(id, title, correct_answer)")
      .eq("test_id", testId)
      .single(),
    codingLadder(supabase),
  ]);
  const { response, feedback, question: q } = data as unknown as Answer;
  const tests = feedback?.tests ?? [];
  const passed = tests.filter((t) => t.passed).length;
  const next = ladder[ladder.findIndex((p) => p.id === q.id) + 1];

  return (
    <div className="flex flex-col gap-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6 items-center text-center">
          <p className="text-base-content/60">
            Coding: <RichText text={q.title} />
          </p>
          <p className="text-5xl font-bold">{score}%</p>
          <p>
            {passed} of {tests.length} tests passed
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6 gap-2">
          <h2 className="card-title text-base">Tests</h2>
          <ul className="flex flex-col gap-2">
            {tests.map((t) => (
              <li key={t.name} className="rounded-box border border-base-300 p-3 flex flex-col gap-1">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{t.name}</span>
                  <span className={`badge ${t.passed ? "badge-success" : "badge-error"}`}>
                    {t.passed ? "Pass" : "Fail"}
                  </span>
                </div>
                {!t.passed && (
                  <div className="text-sm font-mono break-all">
                    <div>Expected: {t.expected}</div>
                    <div>Actual: {t.actual}</div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6 gap-2">
          <h2 className="card-title text-base">Your code</h2>
          <CodeBlock code={response ?? ""} />
        </div>
      </div>

      {q.correct_answer && (
        <details className="collapse collapse-arrow bg-base-100 shadow">
          <summary className="collapse-title font-semibold">Model solution</summary>
          <div className="collapse-content flex flex-col gap-2">
            <p className="text-sm text-base-content/60">
              If you did not solve it, read this, then write it again from memory on your next coding day.
            </p>
            <CodeBlock code={q.correct_answer} />
          </div>
        </details>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Link href={`/coding/${q.id}`} className="btn">
          Try again
        </Link>
        {next ? (
          <Link href={`/coding/${next.id}`} className="btn btn-primary">
            Next problem →
          </Link>
        ) : (
          <Link href="/coding" className="btn btn-primary">
            Coding ladder
          </Link>
        )}
      </div>
    </div>
  );
}
