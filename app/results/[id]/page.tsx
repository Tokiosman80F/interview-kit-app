import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { topicProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import { testItems, type TestItem } from "@/lib/test-questions";
import { gradeTest } from "@/lib/grading/grade-test";
import { CodeBlock, RichText } from "@/components/rich-text";
import { CodingResult } from "./coding-result";
import { LEVEL_PASS_MARK } from "@/lib/scoring/exams";
import { formatWhen } from "@/components/review-banner";
import type { TestResult } from "@/lib/runner/run";
import { cn } from "@/lib/cn";
import { Card, CardBody } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Badge } from "@/components/ui/badge";
import { BulletList } from "@/components/ui/bullet-list";
import { Callout } from "@/components/ui/callout";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const loadTest = async () =>
    (await supabase.from("tests").select("kind, status, score, topic_id, level:levels(id, number, title)").eq("id", id).maybeSingle()).data;
  let test = await loadTest();
  if (!test) notFound();
  // The retry: the AI was unavailable last time, so try grading again now.
  if (test.status === "waiting_for_grading" && (await gradeTest(supabase, id))) test = (await loadTest())!;
  const waiting = test.status === "waiting_for_grading";
  if (test.kind === "coding")
    return <CodingResult supabase={supabase} testId={id} score={Number(test.score)} waiting={waiting} />;
  if (test.status === "in_progress") redirect(`/test/${id}`);

  const [items, { topics, open, levels }] = await Promise.all([testItems(supabase, id), topicProgress(supabase)]);
  const level = test.level as unknown as { id: string; number: number; title: string } | null;
  const levelState = levels.find((l) => l.id === level?.id);
  const nextLevel = levels.find((l) => level && l.number === level.number + 1);
  const passed = !waiting && Number(test.score) >= LEVEL_PASS_MARK;
  const i = topics.findIndex((t) => t.id === test.topic_id);
  const topic = topics[i];
  const next = topics[i + 1];
  const right = items.filter((it) => it.is_correct).length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody className="items-center text-center">
          <p className="text-base-content/60">
            {test.kind === "review" ? (
              "Review exam"
            ) : test.kind === "level_exam" && level ? (
              `Level ${level.number} exam: ${level.title}`
            ) : topic ? (
              <>
                Quiz: <RichText text={topic.title} />
              </>
            ) : null}
          </p>
          {waiting ? (
            <p className="text-2xl font-bold">Waiting for grading</p>
          ) : (
            <p className="text-5xl font-bold">{Number(test.score)}%</p>
          )}
          <p>
            {right} of {items.length} correct{waiting && " so far"}
          </p>
          {test.kind === "level_exam" && !waiting && (
            <p className={cn("font-semibold", passed ? "text-success" : "text-error")}>
              {passed
                ? nextLevel
                  ? `Passed. Level ${nextLevel.number} is now open.`
                  : "Passed. You have finished the last level."
                : `Not passed yet: you need ${LEVEL_PASS_MARK}%.${levelState?.retakeAt ? ` You can retake it from ${formatWhen(levelState.retakeAt)}.` : ""}`}
            </p>
          )}
        </CardBody>
      </Card>
      {waiting && (
        <Notice tone="warning">
          The AI graders are busy or unavailable, so your written answers are not graded yet. Open this page again
          later and they will be graded then.
        </Notice>
      )}

      {items.map(({ question: q, response, is_correct, score, feedback, graded_by }, n) => (
        <Card key={q.id}>
          <CardBody className="gap-2">
            <div className="flex justify-between gap-2">
              <span className="text-sm text-base-content/60">
                {n + 1}. {q.difficulty}
              </span>
              {q.type === "written" ? (
                <Badge tone={score === null ? "ghost" : is_correct ? "success" : "error"}>
                  {score === null ? "Waiting" : `${Math.round(Number(score) * 10)}/10`}
                </Badge>
              ) : q.type === "coding" ? (
                <Badge tone={is_correct ? "success" : "error"}>{Math.round(Number(score ?? 0) * 100)}% of tests</Badge>
              ) : (
                <Badge tone={is_correct ? "success" : "error"}>{is_correct ? "Right" : "Wrong"}</Badge>
              )}
            </div>
            {q.type === "coding" ? (
              <CodingAnswerView title={q.title ?? ""} code={response ?? ""} feedback={feedback as CodingFeedback | null} waiting={waiting} />
            ) : q.type === "output" ? (
              <>
                <p className="font-semibold">What does this code print?</p>
                <CodeBlock code={q.prompt} />
              </>
            ) : (
              <div className="font-semibold">
                <RichText text={q.prompt} />
              </div>
            )}
            {q.type !== "coding" && (
              <p>
                <span className="text-base-content/60">Your answer: </span>
                {response ? <RichText text={response} /> : <em>no answer</em>}
              </p>
            )}
            {q.type === "coding" ? null : q.type === "written" ? (
              feedback && <WrittenFeedbackView feedback={feedback} gradedBy={graded_by} />
            ) : !is_correct && (
              <>
                <p>
                  <span className="text-base-content/60">Correct answer: </span>
                  <RichText text={q.correct_answer ?? ""} />
                </p>
                {q.explanation && (
                  <Callout>
                    <span className="font-semibold">Why: </span>
                    <RichText text={q.explanation} />
                  </Callout>
                )}
              </>
            )}
          </CardBody>
        </Card>
      ))}

      <div className="flex flex-wrap justify-between gap-2">
        {topic && (
          <Link href={`/topic/${topic.id}`} className="btn">
            Back to topic
          </Link>
        )}
        {next && open.has(next.id) && (
          <Link href={`/topic/${next.id}`} className="btn btn-primary">
            Next topic →
          </Link>
        )}
        {next && !open.has(next.id) && (
          <p className="text-base-content/60 self-center">Score {PASS_MARK}% or more to open the next topic.</p>
        )}
        {!topic && (
          <Link href="/syllabus" className="btn btn-primary">
            Back to the syllabus
          </Link>
        )}
      </div>
    </div>
  );
}

function WrittenFeedbackView({ feedback, gradedBy }: { feedback: NonNullable<TestItem["feedback"]>; gradedBy: string | null }) {
  return (
    <div className="flex flex-col gap-3">
      <BulletList title="Key points covered" items={feedback.covered} tone="success" />
      <BulletList title="Key points missed" items={feedback.missed} tone="error" />
      <BulletList title="Mistakes" items={feedback.mistakes} tone="warning" />
      <Callout title="Model answer">
        <p>
          <RichText text={feedback.model_answer} />
        </p>
      </Callout>
      {gradedBy && gradedBy !== "app" && (
        <p className="text-xs text-base-content/50">Graded by {gradedBy === "gemini" ? "Gemini" : "Groq"}</p>
      )}
    </div>
  );
}

type CodingFeedback = {
  tests?: TestResult[];
  review?: { mistakes: string[]; edge_cases: string[]; suggestion: string };
};

// The coding question of an exam: your code, the tests, and the AI review.
function CodingAnswerView({ title, code, feedback, waiting }: { title: string; code: string; feedback: CodingFeedback | null; waiting: boolean }) {
  const tests = feedback?.tests ?? [];
  const review = feedback?.review;
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        <RichText text={title} />
      </p>
      <CodeBlock code={code || "// no answer"} />
      {tests.length === 0 ? (
        <p className="text-base-content/60">The tests did not run, so this answer scores 0.</p>
      ) : (
        <ul className="text-sm flex flex-col gap-1">
          {tests.map((t) => (
            <li key={t.name} className={t.passed ? "text-success" : "text-error"}>
              {t.passed ? "✓" : "✗"} {t.name}
              {!t.passed && <span className="font-mono break-all"> (expected {t.expected}, got {t.actual})</span>}
            </li>
          ))}
        </ul>
      )}
      {review ? (
        <Callout title="AI review" className="flex flex-col gap-2">
          {[...review.mistakes, ...review.edge_cases].map((m) => (
            <p key={m}>
              • <RichText text={m} />
            </p>
          ))}
          {review.suggestion && (
            <p>
              <span className="font-semibold">Suggestion: </span>
              <RichText text={review.suggestion} />
            </p>
          )}
        </Callout>
      ) : (
        waiting && <p className="text-base-content/60">The AI review will appear once grading is done.</p>
      )}
    </div>
  );
}
