import type { ReactNode } from "react";

/** A filter chip in an index's toggle groups, filled while pressed. */
export const filterChipClass =
  "rounded-full px-3 aria-pressed:border-primary/60 aria-pressed:bg-primary/15 aria-pressed:text-foreground";

/** One row of an index's filters: its label, then its chips (ADR 0023, ADR 0024). */
export function FilterRow({
  id,
  label,
  children,
}: {
  /** The label's id, for the toggle group's `aria-labelledby`. */
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    // On phones every label sits above its chips, so the rows line up.
    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3">
      <span
        id={id}
        className="w-24 shrink-0 text-xs font-medium text-muted-foreground"
      >
        {label}
      </span>
      {children}
    </div>
  );
}
