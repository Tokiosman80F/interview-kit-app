import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { topicProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import { testItems, type TestItem } from "@/lib/test-questions";
import { gradeTest } from "@/lib/grading/grade-test";
import { CodeBlock, RichText } from "@/components/rich-text";
import { CodingResult } from "./coding-result";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const loadTest = async () =>
    (await supabase.from("tests").select("kind, status, score, topic_id").eq("id", id).maybeSingle()).data;
  let test = await loadTest();
  if (!test) notFound();
  // The retry: the AI was unavailable last time, so try grading again now.
  if (test.status === "waiting_for_grading" && (await gradeTest(supabase, id))) test = (await loadTest())!;
  const waiting = test.status === "waiting_for_grading";
  if (test.kind === "coding")
    return <CodingResult supabase={supabase} testId={id} score={Number(test.score)} waiting={waiting} />;
  if (test.status === "in_progress") redirect(`/test/${id}`);

  const [items, { topics, open }] = await Promise.all([testItems(supabase, id), topicProgress(supabase)]);
  const i = topics.findIndex((t) => t.id === test.topic_id);
  const topic = topics[i];
  const next = topics[i + 1];
  const right = items.filter((it) => it.is_correct).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6 items-center text-center">
          {topic && (
            <p className="text-base-content/60">
              Quiz: <RichText text={topic.title} />
            </p>
          )}
          {waiting ? (
            <p className="text-2xl font-bold">Waiting for grading</p>
          ) : (
            <p className="text-5xl font-bold">{Number(test.score)}%</p>
          )}
          <p>
            {right} of {items.length} correct{waiting && " so far"}
          </p>
        </div>
      </div>
      {waiting && (
        <div role="alert" className="alert alert-warning">
          The AI graders are busy or unavailable, so your written answers are not graded yet. Open this page again
          later and they will be graded then.
        </div>
      )}

      {items.map(({ question: q, response, is_correct, score, feedback, graded_by }, n) => (
        <div key={q.id} className="card bg-base-100 shadow">
          <div className="card-body p-4 sm:p-6 gap-2">
            <div className="flex justify-between gap-2">
              <span className="text-sm text-base-content/60">
                {n + 1}. {q.difficulty}
              </span>
              {q.type === "written" ? (
                <span className={`badge ${score === null ? "badge-ghost" : is_correct ? "badge-success" : "badge-error"}`}>
                  {score === null ? "Waiting" : `${Math.round(Number(score) * 10)}/10`}
                </span>
              ) : (
                <span className={`badge ${is_correct ? "badge-success" : "badge-error"}`}>
                  {is_correct ? "Right" : "Wrong"}
                </span>
              )}
            </div>
            {q.type === "output" ? (
              <>
                <p className="font-semibold">What does this code print?</p>
                <CodeBlock code={q.prompt} />
              </>
            ) : (
              <div className="font-semibold">
                <RichText text={q.prompt} />
              </div>
            )}
            <p>
              <span className="text-base-content/60">Your answer: </span>
              {response ? <RichText text={response} /> : <em>no answer</em>}
            </p>
            {q.type === "written" ? (
              feedback && <WrittenFeedbackView feedback={feedback} gradedBy={graded_by} />
            ) : !is_correct && (
              <>
                <p>
                  <span className="text-base-content/60">Correct answer: </span>
                  <RichText text={q.correct_answer ?? ""} />
                </p>
                {q.explanation && (
                  <p className="bg-base-200 rounded-box p-3">
                    <span className="font-semibold">Why: </span>
                    <RichText text={q.explanation} />
                  </p>
                )}
              </>
            )}
          </div>
        </div>
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
      </div>
    </div>
  );
}

function WrittenFeedbackView({ feedback, gradedBy }: { feedback: NonNullable<TestItem["feedback"]>; gradedBy: string | null }) {
  const list = (title: string, items: string[], tone: string) =>
    items.length > 0 && (
      <div>
        <p className={`font-semibold ${tone}`}>{title}</p>
        <ul className="list-disc pl-5">
          {items.map((t) => (
            <li key={t}>
              <RichText text={t} />
            </li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="flex flex-col gap-3">
      {list("Key points covered", feedback.covered, "text-success")}
      {list("Key points missed", feedback.missed, "text-error")}
      {list("Mistakes", feedback.mistakes, "text-warning")}
      <div className="bg-base-200 rounded-box p-3">
        <p className="font-semibold">Model answer</p>
        <p>
          <RichText text={feedback.model_answer} />
        </p>
      </div>
      {gradedBy && gradedBy !== "app" && (
        <p className="text-xs text-base-content/50">Graded by {gradedBy === "gemini" ? "Gemini" : "Groq"}</p>
      )}
    </div>
  );
}
