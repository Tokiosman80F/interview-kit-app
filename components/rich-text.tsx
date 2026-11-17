// Renders question text: ```blocks``` become code blocks, `inline` becomes code.
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("```").map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="bg-base-200 rounded p-3 my-2 overflow-x-auto text-sm">
            <code>{part.replace(/^\n|\n$/g, "")}</code>
          </pre>
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {part.split("`").map((p, j) =>
              j % 2 === 1 ? <code key={j} className="bg-base-200 rounded px-1 text-[0.9em]">{p}</code> : p,
            )}
          </span>
        ),
      )}
    </>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-base-200 rounded p-3 my-2 overflow-x-auto text-sm">
      <code>{code}</code>
    </pre>
  );
}
