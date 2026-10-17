import { ArrowRight, CircuitBoard } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { wideArt } from "@/features/game-data/wide-art";
import { CardCarousel } from "./card-carousel";

/** An external component card on the home page, in its highest tier's art and color. */
export interface ComponentItem {
  readonly slug: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly hex: string;
  /** "Set of 4, Ultimate", or "4 slots, 3 tiers" for a component with no set. */
  readonly summary: string;
}

/**
 * The home page's External Components carousel (ADR 0027), by highest tier and then
 * A–Z, as the index sorts them. Each card opens its details on the index, without
 * prefetching: each would load the index. Left out when NEXON sends nothing usable.
 */
export function ComponentShowcase({
  items,
  sets,
}: {
  items: readonly ComponentItem[];
  /** How many of the cards are sets. */
  sets: number;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <CardCarousel
      icon={<CircuitBoard />}
      title="External Components"
      description={`${String(sets)} sets and ${String(items.length - sets)} components with no set. Pick one for its set effect, and each piece's base stat at every level and possible sub-stats.`}
      seconds={7}
      action={
        <Link
          href="/external-components"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          All external components
          <ArrowRight aria-hidden="true" />
        </Link>
      }
    >
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/external-components?component=${item.slug}`}
            prefetch={false}
            className="group grid h-full overflow-hidden rounded-2xl border border-border bg-card/70 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <span
              className="grid aspect-[4/3] place-items-center p-6"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${item.hex} 30%, transparent), transparent 70%)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
              <img
                src={item.imageUrl}
                alt=""
                width={wideArt.width}
                height={wideArt.height}
                loading="lazy"
                decoding="async"
                className="max-h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
              />
            </span>
            <span className="grid gap-0.5 border-t border-border px-4 py-3">
              <span className="truncate font-display text-lg font-semibold tracking-wide">
                {item.name}
              </span>
              {/* Keeps the name and the summary apart in the card's text. */}{" "}
              <span className="text-xs text-muted-foreground">
                {item.summary}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </CardCarousel>
  );
}
