import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { codingLadder } from "@/lib/coding";
import { RichText } from "@/components/rich-text";

export default async function CodingLadderPage() {
  const supabase = await createClient();
  const ladder = await codingLadder(supabase);
  const { data: answers } = await supabase
    .from("answers")
    .select("question_id, score")
    .in("question_id", ladder.map((p) => p.id));

  const best = new Map<string, number>();
  for (const a of answers ?? []) best.set(a.question_id, Math.max(best.get(a.question_id) ?? 0, Number(a.score)));
  const nextUp = ladder.find((p) => best.get(p.id) !== 1);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Coding ladder</h1>
        <p className="text-base-content/60">
          One problem per coding day, in order, 20 minutes each, without AI.
          {nextUp && " Next up is highlighted."}
        </p>
      </div>
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6">
          <ul className="list">
            {ladder.map((p, n) => {
              const score = best.get(p.id);
              return (
                <li
                  key={p.id}
                  className={`list-row items-center px-0 sm:px-4 ${p.id === nextUp?.id ? "bg-base-200" : ""}`}
                >
                  <span className="text-base-content/50 w-6">{n + 1}</span>
                  <Link href={`/coding/${p.id}`} className="link link-hover list-col-grow">
                    <RichText text={p.title} />
                  </Link>
                  <span className="text-right">
                    {score === 1 ? (
                      <span className="badge badge-success badge-outline">Solved</span>
                    ) : score !== undefined ? (
                      <span className="badge badge-primary badge-outline whitespace-nowrap">
                        Best {Math.round(score * 100)}%
                      </span>
                    ) : (
                      <span className="badge badge-ghost whitespace-nowrap">{p.difficulty}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-base-content/60">More problems are added before you reach them.</p>
        </div>
      </div>
    </div>
  );
}
