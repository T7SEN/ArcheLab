import { ArrowRight, Cpu } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { buttonVariants } from "@/components/ui/button";

/** A tier on the home page: its color, how many modules it holds, and one's art. */
export interface ModuleTierTile {
  readonly name: string;
  readonly hex: string;
  readonly count: number;
  readonly imageUrl: string;
}

/**
 * The home page's Modules section (ADR 0025): a tile per tier, in tier order and its
 * color, with how many modules it holds, each opening the modules index filtered to
 * that tier. Left out when NEXON sends nothing usable. Links skip prefetching: each
 * would load the whole index.
 */
export function ModuleShowcase({
  tiers,
  total,
}: {
  tiers: readonly ModuleTierTile[];
  total: number;
}) {
  if (tiers.length === 0) {
    return null;
  }
  return (
    <section
      aria-labelledby="modules-heading"
      className="mx-auto max-w-6xl px-4 py-12"
    >
      <SectionHeader
        id="modules-heading"
        icon={<Cpu />}
        title="Modules"
        description={`All ${total.toLocaleString("en-US")} modules, by tier. Open one for its capacity and effect at every level.`}
        action={
          <Link
            href="/modules"
            prefetch={false}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            All modules
            <ArrowRight aria-hidden="true" />
          </Link>
        }
      />
      <ul
        aria-label="Module tiers"
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {tiers.map((tier) => (
          <li key={tier.name}>
            <Link
              href={`/modules?tier=${encodeURIComponent(tier.name)}`}
              prefetch={false}
              className="group grid h-full justify-items-center gap-3 rounded-2xl border bg-card/70 p-4 text-center transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              style={{
                borderColor: `color-mix(in srgb, ${tier.hex} 35%, var(--border))`,
                backgroundImage: `radial-gradient(circle at 50% 25%, color-mix(in srgb, ${tier.hex} 22%, transparent), transparent 70%)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
              <img
                src={tier.imageUrl}
                alt=""
                width={256}
                height={256}
                loading="lazy"
                decoding="async"
                className="size-14 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none"
              />
              <span className="grid gap-0.5">
                <span
                  className="font-display text-lg font-semibold tracking-wide"
                  style={{ color: tier.hex }}
                >
                  {tier.name}
                </span>{" "}
                <span className="text-sm text-muted-foreground">
                  {tier.count.toLocaleString("en-US")} modules
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
