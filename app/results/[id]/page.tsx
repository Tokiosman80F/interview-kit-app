import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { topicProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import { testItems } from "@/lib/test-questions";
import { CodeBlock, RichText } from "@/components/rich-text";
import { CodingResult } from "./coding-result";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: test } = await supabase
    .from("tests")
    .select("kind, status, score, topic_id")
    .eq("id", id)
    .maybeSingle();
  if (!test) notFound();
  if (test.kind === "coding") return <CodingResult supabase={supabase} testId={id} score={Number(test.score)} />;
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
          <p className="text-5xl font-bold">{Number(test.score)}%</p>
          <p>
            {right} of {items.length} correct
          </p>
        </div>
      </div>

      {items.map(({ question: q, response, is_correct }, n) => (
        <div key={q.id} className="card bg-base-100 shadow">
          <div className="card-body p-4 sm:p-6 gap-2">
            <div className="flex justify-between gap-2">
              <span className="text-sm text-base-content/60">
                {n + 1}. {q.difficulty}
              </span>
              <span className={`badge ${is_correct ? "badge-success" : "badge-error"}`}>
                {is_correct ? "Right" : "Wrong"}
              </span>
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
            {!is_correct && (
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
