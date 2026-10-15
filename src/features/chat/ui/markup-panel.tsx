"use client";

import { useRef } from "react";

interface MarkupPanelProps {
  id: string;
  value: string;
  /** Where the input box cuts this text, or null when it fits. */
  overflowAt: number | null;
  describedBy: string;
  onChange: (text: string) => void;
}

const textMetrics =
  "px-3 py-2 font-mono text-sm leading-6 break-words whitespace-pre-wrap";

/**
 * The raw markup, editable. A backdrop behind the transparent-background textarea
 * highlights what the game's input box cuts off; it repeats the text with the same
 * metrics so the highlight lines up. Styled like shadcn's Textarea (ADR 0009).
 */
export function MarkupPanel({
  id,
  value,
  overflowAt,
  describedBy,
  onChange,
}: MarkupPanelProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  return (
    <div className="relative overflow-hidden rounded-lg border border-input bg-input/30 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden text-transparent ${textMetrics}`}
      >
        {overflowAt === null ? (
          value
        ) : (
          <>
            {value.slice(0, overflowAt)}
            <mark className="rounded-sm bg-warning/35 text-transparent">
              {value.slice(overflowAt)}
            </mark>
          </>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        rows={4}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        placeholder="<red>Markup</> appears here as you type."
        aria-describedby={describedBy}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          // Chat is one line.
          if (event.key === "Enter") {
            event.preventDefault();
          }
        }}
        onScroll={(event) => {
          if (backdropRef.current !== null) {
            backdropRef.current.scrollTop = event.currentTarget.scrollTop;
          }
        }}
        className={`relative block w-full resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground ${textMetrics}`}
      />
    </div>
  );
}
