import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// A daisyUI card, built from parts like shadcn's Card:
// <Card><CardBody><CardTitle>Notes</CardTitle>...</CardBody></Card>

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("card bg-base-100 shadow", className)} {...props} />;
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("card-body p-4 sm:p-6", className)} {...props} />;
}

// A page's main card uses as="h1"; section cards keep the default h2.
export function CardTitle({ as: Tag = "h2", className, ...props }: ComponentProps<"h2"> & { as?: "h1" | "h2" }) {
  return <Tag className={cn("card-title", className)} {...props} />;
}
