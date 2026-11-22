import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { testItems } from "@/lib/test-questions";
import { TestRunner } from "@/components/test-runner";
import { seededShuffle } from "@/lib/selection/shuffle";
import { completeTest } from "@/lib/complete-test";
import { EXAM_MINUTES } from "@/lib/scoring/exams";
import { now } from "@/lib/now";
import type { TestCase } from "@/lib/runner/run";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: test } = await supabase
    .from("tests")
    .select("kind, status, started_at, topic:topics(title), level:levels(number, title)")
    .eq("id", id)
    .maybeSingle();
  if (!test) notFound();
  if (test.status !== "in_progress") redirect(`/results/${id}`);

  // Exams are timed. If the time ran out while you were away, the exam is
  // finished now with the answers you saved.
  const kind = test.kind as string;
  const minutes = kind === "level_exam" || kind === "review" ? EXAM_MINUTES[kind] : null;
  const timeLeftMs = minutes === null ? null : new Date(test.started_at).getTime() + minutes * 60_000 - now().getTime();
  if (timeLeftMs !== null && timeLeftMs <= 0) {
    await completeTest(supabase, id);
    redirect(`/results/${id}`);
  }

  const items = await testItems(supabase, id);
  const topic = test.topic as unknown as { title: string } | null;
  const level = test.level as unknown as { number: number; title: string } | null;
  const title =
    test.kind === "review"
      ? "Review exam"
      : test.kind === "level_exam" && level
        ? `Level ${level.number} exam: ${level.title}`
        : topic
          ? `Quiz: ${topic.title}`
          : "Test";

  return (
    <TestRunner
      testId={id}
      title={title}
      timeLeftMs={timeLeftMs}
      // Correct answers and reference solutions stay on the server.
      questions={items.map(({ question }) => ({
        id: question.id,
        type: question.type,
        difficulty: question.difficulty,
        prompt: question.prompt,
        // The content files list the right option first, so shuffle per attempt.
        options: question.options && seededShuffle(question.options, `${id}:${question.id}`),
        title: question.title,
        starter_code: question.starter_code,
        test_cases: question.test_cases as TestCase[] | null,
      }))}
      initialResponses={items.map((it) => it.response ?? "")}
    />
  );
}
