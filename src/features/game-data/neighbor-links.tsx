import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Neighbor {
  readonly slug: string;
  readonly name: string;
}

/**
 * The previous and next pages at the end of a Descendant or weapon page, in its index's
 * order (ADR 0023, ADR 0024), marked `rel="prev"` and `rel="next"`.
 */
export function NeighborLinks({
  label,
  basePath,
  previous,
  next,
}: {
  /** The nav's accessible name: "More Descendants". */
  label: string;
  /** Where the pages live: "/descendants". */
  basePath: string;
  previous: Neighbor | null;
  next: Neighbor | null;
}) {
  if (previous === null && next === null) {
    return null;
  }
  return (
    <nav
      aria-label={label}
      className="mx-auto grid max-w-6xl gap-3 px-4 pt-2 pb-12 sm:grid-cols-2"
    >
      {previous === null ? null : (
        <NeighborLink link={previous} basePath={basePath} next={false} />
      )}
      {next === null ? null : (
        <NeighborLink link={next} basePath={basePath} next />
      )}
    </nav>
  );
}

function NeighborLink({
  link,
  basePath,
  next,
}: {
  link: Neighbor;
  basePath: string;
  next: boolean;
}) {
  return (
    <Link
      href={`${basePath}/${link.slug}`}
      rel={next ? "next" : "prev"}
      className={`group grid gap-1 rounded-2xl border bg-card/60 px-5 py-4 transition-colors outline-none hover:border-ring/60 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${next ? "text-right sm:col-start-2" : ""}`}
    >
      <span
        className={`flex items-center gap-1.5 text-xs text-muted-foreground ${next ? "justify-end" : ""}`}
      >
        {next ? null : <ArrowLeft aria-hidden="true" className="size-3.5" />}
        {next ? "Next" : "Previous"}
        {next ? <ArrowRight aria-hidden="true" className="size-3.5" /> : null}
      </span>
      <span className="font-display text-xl font-semibold tracking-wide">
        {link.name}
      </span>
    </Link>
  );
}
