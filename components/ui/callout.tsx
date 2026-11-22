import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

// A grey box with an optional bold title, for things like "Model answer".
export function Callout({ title, className, children, ...props }: ComponentProps<"div"> & { title?: ReactNode }) {
  return (
    <div className={cn("bg-base-200 rounded-box p-3", className)} {...props}>
      {title && <p className="font-semibold">{title}</p>}
      {children}
    </div>
  );
}
