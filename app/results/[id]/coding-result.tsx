import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { codingProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import type { TestResult } from "@/lib/runner/run";
import { CodeBlock, RichText } from "@/components/rich-text";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BulletList } from "@/components/ui/bullet-list";
import { Callout } from "@/components/ui/callout";

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
      <Card>
        <CardBody className="items-center text-center">
          <p className="text-base-content/60">
            Coding: <RichText text={q.title} />
          </p>
          <p className="text-5xl font-bold">{score}%</p>
          <p>
            {passed} of {tests.length} tests passed
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="gap-2">
          <CardTitle className="text-base">Tests</CardTitle>
          <ul className="flex flex-col gap-2">
            {tests.map((t) => (
              <li key={t.name} className="rounded-box border border-base-300 p-3 flex flex-col gap-1">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{t.name}</span>
                  <Badge tone={t.passed ? "success" : "error"}>{t.passed ? "Pass" : "Fail"}</Badge>
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
        </CardBody>
      </Card>

      <Card>
        <CardBody className="gap-2">
          <CardTitle className="text-base">Your code</CardTitle>
          <CodeBlock code={response ?? ""} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="gap-3">
          <CardTitle className="text-base">AI review</CardTitle>
          {review ? (
            <>
              <BulletList title="Mistakes" items={review.mistakes} tone="warning" />
              <BulletList title="Edge cases not handled" items={review.edge_cases} tone="error" />
              {review.suggestion && (
                <Callout title="One suggestion">
                  <p>
                    <RichText text={review.suggestion} />
                  </p>
                </Callout>
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
        </CardBody>
      </Card>

      {q.correct_answer && (
        <details className="collapse collapse-arrow bg-base-100 shadow">
          <summary className="collapse-title font-semibold">Model solution and explanation</summary>
          <div className="collapse-content flex flex-col gap-3">
            <p className="text-sm text-base-content/60">
              If you did not solve it, read this, then write it again from memory on your next coding day.
            </p>
            {q.explanation && (
              <Callout title="How it works">
                <p>
                  <RichText text={q.explanation} />
                </p>
              </Callout>
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
