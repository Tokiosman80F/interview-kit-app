import { cn } from "@/lib/cn";
import { RichText } from "@/components/rich-text";

const tones = { success: "text-success", warning: "text-warning", error: "text-error" };

// A titled bullet list of short texts, like "Key points missed". Renders
// nothing when the list is empty, so callers do not need to check.
export function BulletList({ title, items, tone }: { title: string; items: string[]; tone?: keyof typeof tones }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className={cn("font-semibold", tone && tones[tone])}>{title}</p>
      <ul className="list-disc pl-5">
        {items.map((text) => (
          <li key={text}>
            <RichText text={text} />
          </li>
        ))}
      </ul>
    </div>
  );
}
