import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { testItems } from "@/lib/test-questions";
import { TestRunner } from "@/components/test-runner";
import { seededShuffle } from "@/lib/selection/shuffle";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: test } = await supabase
    .from("tests")
    .select("status, topic:topics(title)")
    .eq("id", id)
    .maybeSingle();
  if (!test) notFound();
  if (test.status !== "in_progress") redirect(`/results/${id}`);

  const items = await testItems(supabase, id);
  const topic = test.topic as unknown as { title: string } | null;

  return (
    <TestRunner
      testId={id}
      title={topic ? `Quiz: ${topic.title}` : "Test"}
      // Correct answers stay on the server.
      questions={items.map(({ question }) => ({
        id: question.id,
        type: question.type,
        difficulty: question.difficulty,
        prompt: question.prompt,
        // The content files list the right option first, so shuffle per attempt.
        options: question.options && seededShuffle(question.options, `${id}:${question.id}`),
      }))}
      initialResponses={items.map((it) => it.response ?? "")}
    />
  );
}
