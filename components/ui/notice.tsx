import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// A daisyUI alert. Tailwind only keeps classes it can see written out in full,
// so each tone maps to a complete class name instead of `alert-${tone}`.
const tones = { info: "alert-info", success: "alert-success", warning: "alert-warning", error: "alert-error" };

export function Notice({ tone, className, ...props }: ComponentProps<"div"> & { tone?: keyof typeof tones }) {
  return <div role="alert" className={cn("alert", tone && tones[tone], className)} {...props} />;
}
