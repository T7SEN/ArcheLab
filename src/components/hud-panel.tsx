import type { ReactNode } from "react";

interface HudPanelProps {
  title: string;
  titleId: string;
  children: ReactNode;
  /** Placement classes for the outer frame, such as grid columns. */
  className?: string;
}

/**
 * A panel in the HUD style (SKILL.md section 6): the top-left and bottom-right corners
 * are clipped, with a hairline edge in `line`. The outer layer draws the edge.
 */
export function HudPanel({
  title,
  titleId,
  children,
  className = "",
}: HudPanelProps) {
  return (
    <section
      aria-labelledby={titleId}
      className={`bg-line p-px hud-frame ${className}`}
    >
      <div className="bg-surface p-4 hud-frame sm:p-5">
        <h2
          id={titleId}
          className="font-display text-lg font-semibold tracking-wide"
        >
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}
