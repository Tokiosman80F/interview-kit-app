import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { codingProgress } from "@/lib/progress";
import { PASS_MARK } from "@/lib/scoring/unlock";
import { RichText } from "@/components/rich-text";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export default async function CodingLadderPage() {
  const supabase = await createClient();
  const { ladder, best, open } = await codingProgress(supabase);
  // Next up: the furthest problem you can open.
  const nextUp = ladder.filter((p) => open.has(p.id)).at(-1);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Coding ladder</h1>
        <p className="text-base-content/60">
          One problem per coding day, in order, without AI: 20 minutes each, 35 for hard ones. Pass at least{" "}
          {PASS_MARK}% of a problem&apos;s tests to open the next one.
        </p>
      </div>
      <Card>
        <CardBody>
          <ul className="list">
            {ladder.map((p, n) => {
              const score = best.get(p.id);
              const unlocked = open.has(p.id);
              return (
                <li
                  key={p.id}
                  className={cn("list-row items-center px-0 sm:px-4", p.id === nextUp?.id && "bg-base-200")}
                >
                  <span className="text-base-content/50 w-6">{n + 1}</span>
                  {unlocked ? (
                    <Link href={`/coding/${p.id}`} className="link link-hover list-col-grow">
                      <RichText text={p.title} />
                    </Link>
                  ) : (
                    <span className="text-base-content/60 list-col-grow">
                      <RichText text={p.title} />
                    </span>
                  )}
                  <span className="text-right">
                    {!unlocked ? (
                      <Badge>Locked</Badge>
                    ) : score === 100 ? (
                      <Badge tone="success" outline>
                        Solved
                      </Badge>
                    ) : score !== undefined ? (
                      <Badge tone="primary" outline>
                        Best {score}%
                      </Badge>
                    ) : (
                      <Badge>{p.difficulty}</Badge>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
