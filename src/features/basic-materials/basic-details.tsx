"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { sitePages } from "@/data/site-pages";
import { TierBadge } from "@/features/cosmetics/cosmetic-details";
import { PageChip } from "@/features/game-data/page-chip";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import { PlaceGroups } from "@/features/game-data/place-groups";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { WideTile } from "@/features/game-data/wide-tile";
import { hrefOfUse, useKinds, type BasicMaterial } from "./basic-filters";

/** A material's tile color when its tier has none. */
export const basicColor = "var(--primary)";

/** The navbar's icon for an index, for the kinds a material goes into. */
export function kindIcon(href: string) {
  return sitePages.find((page) => page.href === href)?.icon;
}

/**
 * A basic material's details, opened under its card's row (ADR 0045): what it is, what
 * it goes into, each a link to its page, and where it drops, grouped by place.
 */
export function BasicDetails({
  id,
  item,
  tier,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  item: BasicMaterial;
  tier: CosmeticTier | null;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRevealDetails(sectionRef, titleRef);
  const kinds = useKinds.flatMap((entry) => {
    const uses = item.uses.filter((use) => use.kind === entry.kind);
    return uses.length === 0 ? [] : [{ ...entry, uses }];
  });

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={`${ids}-title`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border border-primary/40 bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6"
    >
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        className="absolute top-3 right-3"
      >
        <X aria-hidden="true" />
        <span className="sr-only">Close details</span>
      </Button>

      <div className="grid gap-5 pr-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <div className="flex items-center gap-4">
          <WideTile
            imageUrl={item.imageUrl}
            color={tier?.hex ?? basicColor}
            size="lg"
          />
          <div className="grid justify-items-start gap-2">
            <h2
              ref={titleRef}
              id={`${ids}-title`}
              tabIndex={-1}
              className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
            >
              {item.name}
            </h2>
            {tier === null ? null : <TierBadge tier={tier} size="md" />}
          </div>
        </div>
        <p className="leading-relaxed">{item.description}</p>
      </div>

      {kinds.length === 0 ? null : (
        <div className="grid gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Used for
          </h3>
          <div className="grid gap-4">
            {kinds.map((entry) => {
              const Icon = kindIcon(entry.href);
              return (
                <div key={entry.kind} className="grid gap-2">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    {Icon === undefined ? null : (
                      <Icon
                        aria-hidden="true"
                        className="size-4 text-primary"
                      />
                    )}
                    {entry.label}
                    <span className="text-muted-foreground tabular-nums">
                      {entry.uses.length}
                    </span>
                  </h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {entry.uses.map((use) => (
                      <li key={use.slug}>
                        <Link
                          href={hrefOfUse(use)}
                          prefetch={false}
                          className="inline-flex rounded-full border bg-background/40 px-2.5 py-1 text-sm transition-colors outline-none hover:border-ring/60 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {use.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Another item that shares its name, a Miscellaneous one with its own tier. */}
      {item.miscTwin === undefined ? null : (
        <div className="grid gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Miscellaneous item of the same name
          </h3>
          <PageChip href={`/miscellaneous?item=${item.miscTwin}`}>
            {item.name}
          </PageChip>
        </div>
      )}

      <div className="grid gap-3">
        <h3 className="text-xs font-medium text-muted-foreground">
          Where to find it
        </h3>
        {item.sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not listed yet</p>
        ) : (
          <PlaceGroups names={item.sources} links={item.placeLinks} />
        )}
      </div>
    </section>
  );
}
