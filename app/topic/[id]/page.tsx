import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { topicProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import { LEVEL_PASS_MARK } from "@/lib/scoring/exams";
import { ReviewBanner } from "@/components/review-banner";
import { RichText } from "@/components/rich-text";
import { NotesBox } from "@/components/notes-box";
import { LockedCard } from "@/components/locked-card";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { startQuiz } from "./actions";
import explanations from "@/content/explain.json";
import links from "@/content/links.json";

// Extra reading links per topic, shown next to the javascript.info link.
const extraLinks: Record<string, { label: string; url: string }[]> = links;

// Cheat-sheet lines that have a static explanation page in public/explain/.
const explainLinks: Record<string, string> = explanations;

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ topics, best, open, levels, review }, topicRes, noteRes, countRes, writtenRes, codingRes] = await Promise.all([
    topicProgress(supabase),
    supabase.from("topics").select("interview_question, reference_url").eq("id", id).maybeSingle(),
    supabase.from("notes").select("body").eq("topic_id", id).maybeSingle(),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", id)
      .in("type", ["mcq", "output"]),
    // The cheat sheet is the key points of the topic's written questions.
    supabase.from("questions").select("key_points").eq("topic_id", id).eq("type", "written").order("id"),
    supabase.from("questions").select("id, title").eq("topic_id", id).eq("type", "coding").order("id"),
  ]);
  const keyPoints = (writtenRes.data ?? []).flatMap((q) => (q.key_points ?? []) as string[]);
  const i = topics.findIndex((t) => t.id === id);
  if (i === -1 || !topicRes.data) notFound();
  const topic = topics[i];
  const prev = topics[i - 1];
  const next = topics[i + 1];

  const eyebrow = `Level ${topic.level.number}: ${topic.level.title} · Topic ${topic.position}`;
  const levelIndex = levels.findIndex((l) => l.id === topic.level.id);
  if (!levels[levelIndex]?.unlocked) {
    const previous = levels[levelIndex - 1];
    return (
      <LockedCard eyebrow={eyebrow} title={<RichText text={topic.title} />} href="/syllabus" action="Go to the syllabus">
        Level {topic.level.number} is locked. Score {LEVEL_PASS_MARK}% or more on the Level {previous?.number} exam to
        open it.
      </LockedCard>
    );
  }

  if (!open.has(id)) {
    // The first locked topic is the one after the last topic you passed.
    const blocker = topics[topics.findIndex((t) => !open.has(t.id)) - 1];
    return (
      <LockedCard
        eyebrow={eyebrow}
        title={<RichText text={topic.title} />}
        href={`/topic/${blocker.id}`}
        action={
          <>
            Go to <RichText text={blocker.title} />
          </>
        }
      >
        This topic is locked. Score {PASS_MARK}% or more on the <RichText text={blocker.title} /> quiz to open the next
        topic{best.has(blocker.id) ? ` (your best so far is ${best.get(blocker.id)}%)` : ""}.
      </LockedCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-base-content/60">{eyebrow}</p>
        <h1 className="text-2xl font-bold">
          <RichText text={topic.title} />
        </h1>
      </div>

      {/* Its own colours, so not the shared Card: cn() cannot override bg-base-100. */}
      <div className="card bg-primary text-primary-content">
        <CardBody>
          <h2 className="font-semibold">Interview question</h2>
          <p className="text-lg">
            <RichText text={topicRes.data.interview_question} />
          </p>
          <p className="text-sm opacity-80">Answer it out loud, without notes, before you take the quiz.</p>
        </CardBody>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <a href={topicRes.data.reference_url} target="_blank" rel="noreferrer" className="link link-primary">
          Read the javascript.info chapter
        </a>
        {(extraLinks[id] ?? []).map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="link link-primary">
            {l.label}
          </a>
        ))}
      </div>

      <Card>
        <CardBody>
          <CardTitle>My notes</CardTitle>
          <NotesBox topicId={id} initial={noteRes.data?.body ?? ""} />
        </CardBody>
      </Card>

      {keyPoints.length > 0 && (
        // Closed by default, so you answer the interview question before peeking.
        <details className="collapse collapse-arrow bg-base-100 shadow">
          <summary className="collapse-title font-semibold">Cheat sheet: key points to remember</summary>
          <div className="collapse-content">
            <ul className="list-disc pl-5 flex flex-col gap-1">
              {keyPoints.map((p) => (
                <li key={p}>
                  <RichText text={p} />
                  {explainLinks[p] && (
                    <>
                      {" "}
                      <a href={explainLinks[p]} className="link link-primary whitespace-nowrap">
                        Explain this →
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}

      {review.overdue ? (
        <ReviewBanner review={review} />
      ) : countRes.count ? (
        <form action={startQuiz.bind(null, id)}>
          <button className="btn btn-primary btn-block">Start quiz</button>
        </form>
      ) : (
        <p className="text-base-content/60">Quiz questions for this topic are not added yet.</p>
      )}
      {(codingRes.data ?? []).map((c) => (
        <Link key={c.id} href={`/coding/${c.id}`} className="btn btn-outline btn-block">
          Coding: <RichText text={c.title} />
        </Link>
      ))}

      <div className="flex justify-between gap-2">
        {prev ? <Link href={`/topic/${prev.id}`} className="btn btn-ghost btn-sm">← <RichText text={prev.title} /></Link> : <span />}
        {next && <Link href={`/topic/${next.id}`} className="btn btn-ghost btn-sm"><RichText text={next.title} /> →</Link>}
      </div>
    </div>
  );
}
