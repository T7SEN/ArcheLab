import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { reactorArt } from "@/features/reactors/reactor-art";
import { ArcheIcon, ElementIcon } from "./type-icons";

/** A reactor as a Descendant's page shows it. */
export interface DescendantReactor {
  readonly slug: string;
  readonly name: string;
  /** Its highest tier's art and color. */
  readonly imageUrl: string;
  readonly hex: string;
  readonly attribute: string;
  readonly archeType: string;
  /**
   * This Descendant's skills of its attribute and Arche type, as NEXON lists them;
   * empty when it suits through an Arche type found in game (`arche-types.ts`).
   */
  readonly skills: readonly string[];
}

/**
 * The reactors that suit a Descendant (ADR 0026): those whose attribute and Arche type
 * match its own, with the skills they match. Each links to its details on
 * the reactors index, without prefetching: each would load the index.
 */
export function ReactorCards({
  reactors,
  attributeIcons,
}: {
  reactors: readonly DescendantReactor[];
  /** Each attribute's icon, by name. */
  attributeIcons: Readonly<Record<string, string>>;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reactors.map((reactor) => (
        <li
          key={reactor.slug}
          className="grid content-start gap-3 rounded-2xl border bg-card/60 p-4"
          style={{
            borderColor: `color-mix(in srgb, ${reactor.hex} 35%, var(--border))`,
          }}
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
            <img
              src={reactor.imageUrl}
              alt=""
              width={reactorArt.width}
              height={reactorArt.height}
              loading="lazy"
              decoding="async"
              className="h-12 w-auto shrink-0 object-contain"
            />
            <div className="grid min-w-0 gap-1">
              <h3 className="font-display text-lg leading-tight font-semibold tracking-wide">
                <Link
                  href={`/reactors?reactor=${reactor.slug}`}
                  prefetch={false}
                  className="group/name rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {reactor.name}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="ml-1 inline size-4 align-baseline text-muted-foreground transition-colors group-hover/name:text-foreground"
                  />
                </Link>
              </h3>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ElementIcon url={attributeIcons[reactor.attribute]} />
                  {reactor.attribute}
                </span>{" "}
                <span className="flex items-center gap-1.5">
                  <ArcheIcon archeType={reactor.archeType} />
                  {reactor.archeType}
                </span>
              </p>
            </div>
          </div>
          {reactor.skills.length === 0 ? null : (
            <p className="text-sm text-muted-foreground">
              Matches{" "}
              <span className="text-foreground">
                {reactor.skills.join(", ")}
              </span>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
