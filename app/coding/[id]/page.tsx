import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { codingLadder } from "@/lib/coding";
import type { TestCase } from "@/lib/runner/run";
import { RichText } from "@/components/rich-text";
import { CodingRunner } from "./coding-client";

export default async function CodingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [ladder, { data: q }] = await Promise.all([
    codingLadder(supabase),
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
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6">
          <p>
            <RichText text={q.prompt} />
          </p>
          <p className="text-sm text-base-content/60">No AI and no looking it up. Run the tests as often as you like.</p>
        </div>
      </div>

      <CodingRunner questionId={id} starter={q.starter_code} tests={q.test_cases as TestCase[]} />

      <div className="flex justify-between gap-2">
        <Link href="/coding" className="btn btn-ghost btn-sm">
          ← Coding ladder
        </Link>
        {next && (
          <Link href={`/coding/${next.id}`} className="btn btn-ghost btn-sm">
            <RichText text={next.title} /> →
          </Link>
        )}
      </div>
    </div>
  );
}
