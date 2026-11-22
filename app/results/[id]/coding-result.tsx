import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { codingProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import type { TestResult } from "@/lib/runner/run";
import { CodeBlock, RichText } from "@/components/rich-text";

type Review = { mistakes: string[]; edge_cases: string[]; suggestion: string; approach: string };

type Answer = {
  response: string | null;
  feedback: { tests: TestResult[]; review?: Review } | null;
  graded_by: string | null;
  question: { id: string; title: string; correct_answer: string | null; explanation: string | null };
};

export async function CodingResult({
  supabase,
  testId,
  score,
  waiting,
}: {
  supabase: SupabaseClient;
  testId: string;
  score: number;
  waiting: boolean;
}) {
  const [{ data }, { ladder, open }] = await Promise.all([
    supabase
      .from("answers")
      .select("response, feedback, graded_by, question:questions!inner(id, title, correct_answer, explanation)")
      .eq("test_id", testId)
      .single(),
    codingProgress(supabase),
  ]);
  const { response, feedback, graded_by: gradedBy, question: q } = data as unknown as Answer;
  const review = feedback?.review;
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

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6 gap-3">
          <h2 className="card-title text-base">AI review</h2>
          {review ? (
            <>
              <ReviewList title="Mistakes" items={review.mistakes} tone="text-warning" />
              <ReviewList title="Edge cases not handled" items={review.edge_cases} tone="text-error" />
              {review.suggestion && (
                <div className="bg-base-200 rounded-box p-3">
                  <p className="font-semibold">One suggestion</p>
                  <p>
                    <RichText text={review.suggestion} />
                  </p>
                </div>
              )}
              {review.mistakes.length === 0 && review.edge_cases.length === 0 && (
                <p>No mistakes or missed edge cases found.</p>
              )}
              <p className="text-xs text-base-content/50">
                Reviewed by {gradedBy === "gemini" ? "Gemini" : "Groq"}. The review is feedback only; your score comes
                from the tests.
              </p>
            </>
          ) : (
            <p className="text-base-content/60">
              {waiting
                ? "The AI reviewers are busy or unavailable. Open this page again later and the review will appear."
                : "No review for this attempt."}
            </p>
          )}
        </div>
      </div>

      {q.correct_answer && (
        <details className="collapse collapse-arrow bg-base-100 shadow">
          <summary className="collapse-title font-semibold">Model solution and explanation</summary>
          <div className="collapse-content flex flex-col gap-3">
            <p className="text-sm text-base-content/60">
              If you did not solve it, read this, then write it again from memory on your next coding day.
            </p>
            {q.explanation && (
              <div className="bg-base-200 rounded-box p-3">
                <p className="font-semibold">How it works</p>
                <p>
                  <RichText text={q.explanation} />
                </p>
              </div>
            )}
            <CodeBlock code={q.correct_answer} />
          </div>
        </details>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Link href={`/coding/${q.id}`} className="btn">
          Try again
        </Link>
        {next && !open.has(next.id) ? (
          <p className="text-base-content/60 self-center">Pass at least {PASS_MARK}% of the tests to open the next problem.</p>
        ) : next ? (
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

function ReviewList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className={"font-semibold " + tone}>{title}</p>
      <ul className="list-disc pl-5">
        {items.map((t) => (
          <li key={t}>
            <RichText text={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}
