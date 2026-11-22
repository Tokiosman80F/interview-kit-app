import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { codingProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import type { TestCase } from "@/lib/runner/run";
import { RichText } from "@/components/rich-text";
import { LockedCard } from "@/components/locked-card";
import { Card, CardBody } from "@/components/ui/card";
import { CodingRunner } from "./coding-client";

export default async function CodingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ ladder, best, open }, { data: q }] = await Promise.all([
    codingProgress(supabase),
    supabase
      .from("questions")
      .select("title, prompt, difficulty, starter_code, test_cases, topic:topics!inner(id, title)")
      .eq("id", id)
      .eq("type", "coding")
      .maybeSingle(),
  ]);
  if (!q) notFound();
  const topic = q.topic as unknown as { id: string; title: string };
  const i = ladder.findIndex((p) => p.id === id);
  const next = ladder[i + 1];

  if (!open.has(id)) {
    const blocker = ladder[ladder.findIndex((p) => !open.has(p.id)) - 1];
    return (
      <LockedCard
        title={<RichText text={q.title} />}
        href={`/coding/${blocker.id}`}
        action={
          <>
            Go to <RichText text={blocker.title} />
          </>
        }
      >
        This problem is locked. Pass at least {PASS_MARK}% of the tests on <RichText text={blocker.title} /> to open the
        next problem{best.has(blocker.id) ? ` (your best so far is ${best.get(blocker.id)}%)` : ""}.
      </LockedCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-base-content/60">
          Coding ladder {i + 1} of {ladder.length} · {q.difficulty} · topic:{" "}
          <Link href={`/topic/${topic.id}`} className="link">
            <RichText text={topic.title} />
          </Link>
        </p>
        <h1 className="text-2xl font-bold">
          <RichText text={q.title} />
        </h1>
      </div>
      <Card>
        <CardBody>
          <p>
            <RichText text={q.prompt} />
          </p>
          <p className="text-sm text-base-content/60">No AI and no looking it up. You have {q.difficulty === "hard" ? 35 : 20} minutes. Run the tests as often as you like.</p>
        </CardBody>
      </Card>

      <CodingRunner
        questionId={id}
        starter={q.starter_code}
        tests={q.test_cases as TestCase[]}
        minutes={q.difficulty === "hard" ? 35 : 20}
      />

      <div className="flex justify-between gap-2">
        <Link href="/coding" className="btn btn-ghost btn-sm">
          ← Coding ladder
        </Link>
        {next && open.has(next.id) && (
          <Link href={`/coding/${next.id}`} className="btn btn-ghost btn-sm">
            <RichText text={next.title} /> →
          </Link>
        )}
      </div>
    </div>
  );
}
