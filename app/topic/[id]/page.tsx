import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { topicsInOrder } from "@/lib/data";
import { RichText } from "@/components/rich-text";
import { NotesBox } from "@/components/notes-box";
import { startQuiz } from "./actions";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [topics, topicRes, noteRes, countRes] = await Promise.all([
    topicsInOrder(supabase),
    supabase.from("topics").select("interview_question, reference_url").eq("id", id).maybeSingle(),
    supabase.from("notes").select("body").eq("topic_id", id).maybeSingle(),
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("topic_id", id),
  ]);
  const i = topics.findIndex((t) => t.id === id);
  if (i === -1 || !topicRes.data) notFound();
  const topic = topics[i];
  const prev = topics[i - 1];
  const next = topics[i + 1];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-base-content/60">
          Level {topic.level.number}: {topic.level.title} · Topic {topic.position}
        </p>
        <h1 className="text-2xl font-bold">
          <RichText text={topic.title} />
        </h1>
      </div>

      <div className="card bg-primary text-primary-content">
        <div className="card-body p-4 sm:p-6">
          <h2 className="font-semibold">Interview question</h2>
          <p className="text-lg">
            <RichText text={topicRes.data.interview_question} />
          </p>
          <p className="text-sm opacity-80">Answer it out loud, without notes, before you take the quiz.</p>
        </div>
      </div>

      <a href={topicRes.data.reference_url} target="_blank" rel="noreferrer" className="link link-primary">
        Read the javascript.info chapter
      </a>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6">
          <h2 className="card-title">My notes</h2>
          <NotesBox topicId={id} initial={noteRes.data?.body ?? ""} />
        </div>
      </div>

      {countRes.count ? (
        <form action={startQuiz.bind(null, id)}>
          <button className="btn btn-primary btn-block">Start quiz</button>
        </form>
      ) : (
        <p className="text-base-content/60">Quiz questions for this topic are not added yet.</p>
      )}

      <div className="flex justify-between gap-2">
        {prev ? <Link href={`/topic/${prev.id}`} className="btn btn-ghost btn-sm">← <RichText text={prev.title} /></Link> : <span />}
        {next && <Link href={`/topic/${next.id}`} className="btn btn-ghost btn-sm"><RichText text={next.title} /> →</Link>}
      </div>
    </div>
  );
}
