import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { topicsInOrder } from "@/lib/data";
import { CodeBlock, RichText } from "@/components/rich-text";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";

type Row = {
  id: string;
  response: string | null;
  score: number;
  feedback: { model_answer?: string } | null;
  question: { id: string; type: string; prompt: string; title: string | null; correct_answer: string | null; explanation: string | null; topic_id: string };
  test: { id: string; finished_at: string };
};

// Every wrong or low-scored answer (under 70%), newest first, filterable by level and topic.
export default async function MistakesPage({ searchParams }: { searchParams: Promise<{ level?: string; topic?: string }> }) {
  const { level, topic } = await searchParams;
  const supabase = await createClient();
  const topics = await topicsInOrder(supabase);
  const levels = [...new Map(topics.map((t) => [t.level.id, t.level])).values()];
  const topicIds = topic ? [topic] : level ? topics.filter((t) => t.level.id === level).map((t) => t.id) : null;

  let query = supabase
    .from("answers")
    .select(
      "id, response, score, feedback, question:questions!inner(id, type, prompt, title, correct_answer, explanation, topic_id), test:tests!inner(id, finished_at, status)",
    )
    .eq("test.status", "graded")
    .lt("score", 0.7)
    .order("finished_at", { referencedTable: "tests", ascending: false })
    .limit(200);
  if (topicIds) query = query.in("question.topic_id", topicIds);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data as unknown as Row[]).sort((a, b) => b.test.finished_at.localeCompare(a.test.finished_at));
  const titleOf = new Map(topics.map((t) => [t.id, t.title]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Mistakes</h1>
        <p className="text-base-content/60">Every answer you got wrong or scored under 70%, newest first. Reread them before interviews.</p>
      </div>

      {/* A plain GET form: the filters live in the URL, no client code needed. */}
      <form className="flex flex-wrap gap-2 items-end">
        <select name="level" defaultValue={level ?? ""} className="select select-sm w-auto">
          <option value="">All levels</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              Level {l.number}: {l.title}
            </option>
          ))}
        </select>
        <select name="topic" defaultValue={topic ?? ""} className="select select-sm w-auto max-w-64">
          <option value="">All topics</option>
          {topics
            .filter((t) => !level || t.level.id === level)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.title.replaceAll("`", "")}
              </option>
            ))}
        </select>
        <button className="btn btn-sm">Filter</button>
        {(level || topic) && (
          <Link href="/mistakes" className="btn btn-sm btn-ghost">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 && <p className="text-base-content/60">No mistakes here. Nice.</p>}

      {rows.map((r) => {
        const q = r.question;
        const answer = q.type === "written" ? r.feedback?.model_answer || q.correct_answer : q.correct_answer;
        return (
          <Card key={r.id}>
            <CardBody className="gap-2">
              <div className="flex flex-wrap justify-between gap-2 text-sm text-base-content/60">
                <Link href={`/topic/${q.topic_id}`} className="link link-hover">
                  <RichText text={titleOf.get(q.topic_id) ?? ""} />
                </Link>
                <span className="flex gap-2 items-center">
                  {new Date(r.test.finished_at).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short" })}
                  <Badge tone="error" outline>
                    {q.type === "written" ? `${Math.round(r.score * 10)}/10` : q.type === "coding" ? `${Math.round(r.score * 100)}%` : "Wrong"}
                  </Badge>
                </span>
              </div>
              {q.type === "output" ? (
                <>
                  <p className="font-semibold">What does this code print?</p>
                  <CodeBlock code={q.prompt} />
                </>
              ) : (
                <div className="font-semibold">
                  <RichText text={q.type === "coding" ? (q.title ?? q.prompt) : q.prompt} />
                </div>
              )}
              {q.type !== "coding" && (
                <p>
                  <span className="text-base-content/60">Your answer: </span>
                  {r.response ? <RichText text={r.response} /> : <em>no answer</em>}
                </p>
              )}
              {q.type === "coding" ? (
                <Link href={`/results/${r.test.id}`} className="link link-primary">
                  See your code, the tests and the model solution
                </Link>
              ) : (
                answer && (
                  <Callout title={q.type === "written" ? "Model answer" : "Correct answer"}>
                    <RichText text={answer} />
                    {q.explanation && (
                      <p className="text-sm mt-1">
                        <RichText text={q.explanation} />
                      </p>
                    )}
                  </Callout>
                )
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
