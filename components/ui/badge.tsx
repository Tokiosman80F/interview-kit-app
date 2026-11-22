import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// A daisyUI badge. Each tone maps to a complete class name so Tailwind keeps it.
const tones = {
  ghost: "badge-ghost",
  primary: "badge-primary",
  info: "badge-info",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
};

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "ghost",
  outline,
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone; outline?: boolean }) {
  return <span className={cn("badge whitespace-nowrap", tones[tone], outline && "badge-outline", className)} {...props} />;
}
