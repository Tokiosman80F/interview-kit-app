"use client";

import { useEffect, useRef, useState } from "react";
import { saveNote } from "@/app/topic/[id]/actions";

// Saves about 1 second after typing stops.
export function NotesBox({ topicId, initial }: { topicId: string; initial: string }) {
  const [body, setBody] = useState(initial);
  const [status, setStatus] = useState<"saved" | "typing" | "saving" | "error">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(value: string) {
    setBody(value);
    setStatus("typing");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveNote(topicId, value);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 1000);
  }

  return (
    <div className="flex flex-col gap-1">
      <textarea
        className="textarea w-full min-h-48"
        placeholder="Explain this topic in your own words..."
        value={body}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className={`text-sm ${status === "error" ? "text-error" : "text-base-content/60"}`}>
        {{ saved: "Saved", typing: "Typing...", saving: "Saving...", error: "Not saved. Check your connection and type again." }[status]}
      </span>
    </div>
  );
}
