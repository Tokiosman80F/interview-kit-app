// Joins class names and skips empty ones, so conditional classes read cleanly:
// cn("badge", passed && "badge-success", className)
// Like shadcn's cn, but without tailwind-merge: daisyUI classes rarely clash,
// so a later class does not need to override an earlier one.
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
