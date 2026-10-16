import type { ReactNode } from "react";

interface SectionHeaderProps {
  /** The heading's id, for `aria-labelledby` on the section. */
  id: string;
  /** A Lucide icon, drawn in a violet chip before the title. */
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  /** A link or controls at the right: "Open", carousel buttons. */
  action?: ReactNode;
}

/**
 * The header every home section shares (ADR 0018): an icon chip and a display title,
 * a line of description, and an action at the right that wraps below on narrow screens.
 */
export function SectionHeader({
  id,
  icon,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="grid gap-1.5">
        <h2
          id={id}
          className="flex items-center gap-3 font-display text-3xl font-semibold tracking-wide"
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary [&>svg]:size-5"
          >
            {icon}
          </span>
          {title}
        </h2>
        {description === undefined ? null : (
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
