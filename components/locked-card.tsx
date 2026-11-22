import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";

// Shown instead of a topic or coding problem that is still locked: what it
// is, why it is locked, and one button to the thing that unlocks it.
export function LockedCard({
  eyebrow,
  title,
  children,
  href,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  href: string;
  action: ReactNode;
}) {
  return (
    <Card>
      <CardBody className="gap-3">
        {eyebrow && <p className="text-sm text-base-content/60">{eyebrow}</p>}
        <h1 className="text-2xl font-bold">{title}</h1>
        <Notice>
          <span>{children}</span>
        </Notice>
        <Link href={href} className="btn btn-primary self-start">
          {action}
        </Link>
      </CardBody>
    </Card>
  );
}
