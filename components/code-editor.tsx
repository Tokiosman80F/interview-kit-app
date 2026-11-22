"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";

const theme = EditorView.theme({
  "&": { fontSize: "14px" },
  ".cm-content, .cm-gutter": { minHeight: "18rem" },
  ".cm-scroller": { fontFamily: "ui-monospace, monospace" },
});

// CodeMirror 6 with JavaScript highlighting and Tab to indent.
// The editor owns its text and reads `initial` only when it first mounts; to
// replace the text (Reset, or another question), change this component's key.
export function CodeEditor({ initial, onChange }: { initial: string; onChange: (code: string) => void }) {
  const parent = useRef<HTMLDivElement>(null);
  const latestOnChange = useRef(onChange);
  // Read once: later changes to `initial` (the live text) must not rebuild the editor.
  const startText = useRef(initial);

  useEffect(() => {
    latestOnChange.current = onChange;
  });

  useEffect(() => {
    const view = new EditorView({
      doc: startText.current,
      parent: parent.current!,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        javascript(),
        theme,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) latestOnChange.current(u.state.doc.toString());
        }),
      ],
    });
    return () => view.destroy();
  }, []);

  return <div ref={parent} className="rounded-box border border-base-300 overflow-hidden bg-base-100" />;
}
