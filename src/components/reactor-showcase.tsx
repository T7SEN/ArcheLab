import { ArrowRight, Hexagon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArcheIcon, ElementIcon } from "@/features/descendants/type-icons";
import { reactorArt } from "@/features/reactors/reactor-art";
import { CardCarousel } from "./card-carousel";

/** A reactor on the home page, in its highest tier's art and color. */
export interface ReactorItem {
  readonly slug: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly hex: string;
  readonly attribute: string | null;
  readonly archeType: string | null;
}

/**
 * The home page's Reactors carousel (ADR 0026), A–Z, each card opening the reactor's
 * details on the index, without prefetching: each would load the index. Left out when
 * NEXON sends nothing usable.
 */
export function ReactorShowcase({
  items,
  tiers,
  attributeIcons,
}: {
  items: readonly ReactorItem[];
  /** How many tiers each reactor comes in. */
  tiers: number;
  /** Each attribute's icon, by name. */
  attributeIcons: Readonly<Record<string, string>>;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <CardCarousel
      icon={<Hexagon />}
      title="Reactors"
      description={`${String(items.length)} reactors, each in ${String(tiers)} tiers. Pick one for its Skill Power at every level, and the Descendants whose skills it suits.`}
      seconds={7}
      action={
        <Link
          href="/reactors"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          All reactors
          <ArrowRight aria-hidden="true" />
        </Link>
      }
    >
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/reactors?reactor=${item.slug}`}
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
                width={reactorArt.width}
                height={reactorArt.height}
                loading="lazy"
                decoding="async"
                className="max-h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
              />
            </span>
            <span className="grid gap-0.5 border-t border-border px-4 py-3">
              <span className="truncate font-display text-lg font-semibold tracking-wide">
                {item.name}
              </span>
              {/* Keeps the name and the types apart in the card's text. */}{" "}
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                {item.attribute === null ? null : (
                  <span className="flex items-center gap-1.5">
                    <ElementIcon
                      url={attributeIcons[item.attribute]}
                      className="size-3.5"
                    />
                    {item.attribute}
                  </span>
                )}{" "}
                {item.archeType === null ? null : (
                  <span className="flex items-center gap-1.5">
                    <ArcheIcon
                      archeType={item.archeType}
                      className="size-3.5"
                    />
                    {item.archeType}
                  </span>
                )}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </CardCarousel>
  );
}
