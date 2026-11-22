import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RichText } from "@/components/rich-text";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  kind: string;
  status: string;
  score: number | null;
  finished_at: string;
  topic: { title: string } | null;
  level: { number: number } | null;
  answers: { question: { title: string | null } | null }[];
};

const KIND = { topic_quiz: "Quiz", level_exam: "Level exam", review: "Review", coding: "Coding" } as const;

// Every finished test, newest first, with a link to its results.
export default async function HistoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tests")
    .select("id, kind, status, score, finished_at, topic:topics(title), level:levels(number), answers(question:questions(title))")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  const rows = data as unknown as Row[];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">History</h1>
      <Card>
        <CardBody>
          {rows.length === 0 ? (
            <p className="text-base-content/60">No finished tests yet.</p>
          ) : (
            <ul className="list">
              {rows.map((t) => {
                const name =
                  t.kind === "level_exam"
                    ? `Level ${t.level?.number}`
                    : t.kind === "coding"
                      ? (t.answers[0]?.question?.title ?? "")
                      : (t.topic?.title ?? "Review exam");
                return (
                  <li key={t.id} className="list-row items-center px-0 sm:px-4">
                    <span className="text-sm text-base-content/60 w-16">
                      {new Date(t.finished_at).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short" })}
                    </span>
                    <Link href={`/results/${t.id}`} className="link link-hover list-col-grow">
                      <span className="text-base-content/60">{KIND[t.kind as keyof typeof KIND]}: </span>
                      <RichText text={name} />
                    </Link>
                    {t.status === "graded" ? (
                      <Badge tone={Number(t.score) >= 70 ? "success" : "primary"} outline>
                        {Number(t.score)}%
                      </Badge>
                    ) : (
                      <Badge>Waiting</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
