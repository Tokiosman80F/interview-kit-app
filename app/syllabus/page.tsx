import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TopicRow } from "@/lib/data";
import { topicProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import { RichText } from "@/components/rich-text";

export default async function SyllabusPage() {
  const supabase = await createClient();
  const [{ topics, open: unlocked }, questions, notes, tests] = await Promise.all([
    topicProgress(supabase),
    supabase.from("questions").select("topic_id"),
    supabase.from("notes").select("topic_id, body"),
    supabase
      .from("tests")
      .select("topic_id, score, status")
      .eq("kind", "topic_quiz")
      .order("started_at"),
  ]);

  const hasQuestions = new Set((questions.data ?? []).map((q) => q.topic_id));
  const hasNote = new Set((notes.data ?? []).filter((n) => n.body.trim()).map((n) => n.topic_id));
  const scores = new Map<string, number[]>();
  const started = new Set<string>();
  for (const t of tests.data ?? []) {
    started.add(t.topic_id);
    if (t.status === "graded") scores.set(t.topic_id, [...(scores.get(t.topic_id) ?? []), Number(t.score)]);
  }

  const levels = new Map<number, { title: string; topics: TopicRow[] }>();
  for (const t of topics) {
    const level = levels.get(t.level.number) ?? { title: t.level.title, topics: [] };
    level.topics.push(t);
    levels.set(t.level.number, level);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Syllabus</h1>
        <p className="text-base-content/60">Score {PASS_MARK}% or more on a topic quiz to open the next topic.</p>
      </div>
      {[...levels].map(([number, level]) => {
        const open = level.topics.some((t) => hasQuestions.has(t.id));
        return (
          <section key={number} className="card bg-base-100 shadow">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title">
                Level {number}: {level.title}
              </h2>
              {!open && <p className="text-base-content/60">Questions not added yet.</p>}
              <ul className="list">
                {level.topics.map((t) => {
                  const s = scores.get(t.id);
                  return (
                    <li key={t.id} className="list-row items-center px-0 sm:px-4">
                      <span className="text-base-content/50 w-6">{t.position}</span>
                      {open && unlocked.has(t.id) ? (
                        <Link href={`/topic/${t.id}`} className="link link-hover list-col-grow">
                          <RichText text={t.title} />
                        </Link>
                      ) : (
                        <span className="text-base-content/60 list-col-grow">
                          <RichText text={t.title} />
                        </span>
                      )}
                      <span className="text-right">
                        {open && !unlocked.has(t.id) ? (
                          <span className="badge badge-ghost whitespace-nowrap">Locked</span>
                        ) : s ? (
                          <span className="badge badge-primary badge-outline whitespace-nowrap">
                            Best {Math.max(...s)}% · Last {s[s.length - 1]}%
                          </span>
                        ) : hasNote.has(t.id) || started.has(t.id) ? (
                          <span className="badge badge-info badge-outline">Studied</span>
                        ) : open ? (
                          <span className="badge badge-ghost">Not started</span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
