/**
 * ArcheLab's mark (T7SEN's design, 2026-10-16): one round-capped stroke drawing an "A"
 * on a 128 grid, its legs at 60 degrees. `src/app/icon.svg` (the favicon) draws the same
 * path; `logo-mark.test.ts` keeps them equal.
 */
export const logoPath =
  "M64.35 27.5 22.2 100.5H49.2L77.5 51.5 105.8 100.5H77.5";

/** The width of the stroke on the 128 grid. */
export const logoStrokeWidth = 12;

/**
 * The mark alone, cropped to its edges and drawn in the current text color. It is
 * decorative: the word ArcheLab beside it names the heading, and in the navbar the
 * link's label does.
 * Size it by height; the width follows.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="16 21 96 86"
      width="96"
      height="86"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={logoPath}
        stroke="currentColor"
        strokeWidth={logoStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
