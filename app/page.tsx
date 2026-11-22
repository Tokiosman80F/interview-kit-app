import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { answerHistory, codingProgress, topicProgress } from "@/lib/progress";
import { gradeWaitingTests } from "@/lib/grading/grade-test";
import { nextDayType, streak } from "@/lib/scoring/daily";
import { now } from "@/lib/now";
import { startLevelExam, startReview } from "@/app/exam/actions";
import { RichText } from "@/components/rich-text";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Dashboard() {
  const supabase = await createClient();
  await gradeWaitingTests(supabase);
  const [{ topics, best, open, levels, review }, coding, { weak }, { data: finished }] = await Promise.all([
    topicProgress(supabase),
    codingProgress(supabase),
    answerHistory(supabase),
    supabase.from("tests").select("kind, finished_at").not("finished_at", "is", null).order("finished_at"),
  ]);
  const at = now();
  const done = finished ?? [];
  const days = streak(done.map((t) => new Date(t.finished_at)), at);
  const lastDaily = done.filter((t) => t.kind === "topic_quiz" || t.kind === "coding").at(-1);
  const dayType = nextDayType((lastDaily?.kind as "topic_quiz" | "coding") ?? null);

  const currentLevel = levels.filter((l) => l.unlocked).at(-1);
  const examLevel = levels.find((l) => l.examAvailable && !l.passed && !l.retakeAt);
  const nextTopic = topics.filter((t) => open.has(t.id)).find((t) => !best.has(t.id)) ?? topics.filter((t) => open.has(t.id)).at(-1);
  const nextProblem = coding.ladder.filter((p) => coding.open.has(p.id)).find((p) => coding.best.get(p.id) !== 100);
  const daysToReview = review.dueAt ? Math.ceil((review.dueAt.getTime() - at.getTime()) / 86_400_000) : null;
  const title = new Map(topics.map((t) => [t.id, t.title]));

  // Today's task: a due review first, then a level exam, then quiz or coding day.
  let task: { label: string; detail: string; action: React.ReactNode };
  if (review.due) {
    task = {
      label: "Review exam",
      detail: "10 questions weighted to your weak topics, 30 minutes.",
      action: (
        <form action={startReview}>
          <button className="btn btn-primary btn-lg w-full">Start review exam</button>
        </form>
      ),
    };
  } else if (examLevel) {
    task = {
      label: `Level ${examLevel.number} exam`,
      detail: "Every topic has a quiz score. Score 70% to open the next level. 40 minutes.",
      action: (
        <form action={startLevelExam.bind(null, examLevel.id)}>
          <button className="btn btn-primary btn-lg w-full">Start level exam</button>
        </form>
      ),
    };
  } else if (dayType === "coding" && nextProblem) {
    task = {
      label: "Coding day",
      detail: "One problem, no AI, with the timer.",
      action: (
        <Link href={`/coding/${nextProblem.id}`} className="btn btn-primary btn-lg w-full">
          <RichText text={nextProblem.title} />
        </Link>
      ),
    };
  } else {
    task = {
      label: "Quiz day",
      detail: "Read the topic, answer its question out loud, then take the quiz.",
      action: nextTopic && (
        <Link href={`/topic/${nextTopic.id}`} className="btn btn-primary btn-lg w-full">
          <RichText text={nextTopic.title} />
        </Link>
      ),
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody className="gap-3">
          <p className="text-sm text-base-content/60">Today: {task.label}</p>
          <p>{task.detail}</p>
          {task.action}
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Level" value={currentLevel ? String(currentLevel.number) : "1"} />
        <Stat label="Streak" value={`${days} ${days === 1 ? "day" : "days"}`} />
        <Stat
          label="Next review"
          value={daysToReview === null ? "—" : daysToReview <= 0 ? "Due" : `${daysToReview} ${daysToReview === 1 ? "day" : "days"}`}
        />
      </div>

      <Card>
        <CardBody className="gap-2">
          <CardTitle className="text-base">Weak topics</CardTitle>
          {weak.length === 0 ? (
            <p className="text-base-content/60">None right now. A topic is weak when your last 3 answers on it average under 70%.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {weak.slice(0, 5).map((w) => (
                <li key={w.topicId} className="flex justify-between gap-2">
                  <Link href={`/topic/${w.topicId}`} className="link link-hover">
                    <RichText text={title.get(w.topicId) ?? w.topicId} />
                  </Link>
                  <Badge tone="error" outline>
                    {Math.round(w.average * 100)}%
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody className="p-3 sm:p-4 gap-0 items-center text-center">
        <p className="text-xs text-base-content/60">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </CardBody>
    </Card>
  );
}
