import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TopicRow } from "@/lib/data";
import { topicProgress } from "@/lib/progress";
import { gradeWaitingTests } from "@/lib/grading/grade-test";
import { PASS_MARK } from "@/lib/scoring/unlock";
import { EXAM_MINUTES, LEVEL_PASS_MARK, RETAKE_HOURS } from "@/lib/scoring/exams";
import { startLevelExam } from "@/app/exam/actions";
import { RichText } from "@/components/rich-text";
import { ReviewBanner, formatWhen } from "@/components/review-banner";

export default async function SyllabusPage() {
  const supabase = await createClient();
  // The retry: grade any test the AI could not grade before.
  await gradeWaitingTests(supabase);
  const [{ topics, open: unlocked, levels, review }, notes, tests] = await Promise.all([
    topicProgress(supabase),
    supabase.from("notes").select("topic_id, body"),
    supabase
      .from("tests")
      .select("topic_id, score, status")
      .eq("kind", "topic_quiz")
      .order("started_at"),
  ]);

  const hasNote = new Set((notes.data ?? []).filter((n) => n.body.trim()).map((n) => n.topic_id));
  const scores = new Map<string, number[]>();
  const started = new Set<string>();
  for (const t of tests.data ?? []) {
    started.add(t.topic_id);
    if (t.status === "graded") scores.set(t.topic_id, [...(scores.get(t.topic_id) ?? []), Number(t.score)]);
  }
  const topicsOf = (levelId: string): TopicRow[] => topics.filter((t) => t.level.id === levelId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Syllabus</h1>
        <p className="text-base-content/60">
          Score {PASS_MARK}% or more on a topic quiz to open the next topic. When every topic in a level has a quiz
          score, take the level exam: {LEVEL_PASS_MARK}% or more opens the next level.
        </p>
      </div>
      <ReviewBanner review={review} />
      {levels.map((level, n) => (
        <section key={level.id} className="card bg-base-100 shadow">
          <div className="card-body p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="card-title">
                Level {level.number}: {level.title}
              </h2>
              {!level.unlocked ? (
                <span className="badge badge-ghost whitespace-nowrap">Locked</span>
              ) : level.passed ? (
                <span className="badge badge-success badge-outline whitespace-nowrap">Exam passed · {level.bestExam}%</span>
              ) : null}
            </div>
            {!level.unlocked && (
              <p className="text-base-content/60">
                Score {LEVEL_PASS_MARK}% or more on the Level {levels[n - 1]?.number} exam to open this level.
              </p>
            )}
            <ul className="list">
              {topicsOf(level.id).map((t) => {
                const s = scores.get(t.id);
                const open = unlocked.has(t.id);
                return (
                  <li key={t.id} className="list-row items-center px-0 sm:px-4">
                    <span className="text-base-content/50 w-6">{t.position}</span>
                    {open ? (
                      <Link href={`/topic/${t.id}`} className="link link-hover list-col-grow">
                        <RichText text={t.title} />
                      </Link>
                    ) : (
                      <span className="text-base-content/60 list-col-grow">
                        <RichText text={t.title} />
                      </span>
                    )}
                    <span className="text-right">
                      {!open ? (
                        <span className="badge badge-ghost whitespace-nowrap">Locked</span>
                      ) : s ? (
                        <span className="badge badge-primary badge-outline whitespace-nowrap">
                          Best {Math.max(...s)}% · Last {s[s.length - 1]}%
                        </span>
                      ) : hasNote.has(t.id) || started.has(t.id) ? (
                        <span className="badge badge-info badge-outline">Studied</span>
                      ) : (
                        <span className="badge badge-ghost">Not started</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            {level.unlocked && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-3">
                {level.examAvailable && !level.retakeAt ? (
                  <>
                    <span className="text-sm text-base-content/60">
                      Level exam: 15 questions, {EXAM_MINUTES.level_exam} minutes, pass at {LEVEL_PASS_MARK}%.
                      {level.bestExam !== null && ` Your best: ${level.bestExam}%.`}
                    </span>
                    <form action={startLevelExam.bind(null, level.id)}>
                      <button className={`btn btn-sm ${level.passed ? "" : "btn-primary"}`}>
                        {level.passed ? "Retake level exam" : "Start level exam"}
                      </button>
                    </form>
                  </>
                ) : level.retakeAt ? (
                  <span className="text-sm text-base-content/60">
                    Level exam: {level.bestExam}% so far. You can retake it {RETAKE_HOURS} hours after a fail, from{" "}
                    {formatWhen(level.retakeAt)}. Use the time to redo the weak topics.
                  </span>
                ) : (
                  <span className="text-sm text-base-content/60">
                    The level exam opens when every topic in this level has a quiz score.
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
