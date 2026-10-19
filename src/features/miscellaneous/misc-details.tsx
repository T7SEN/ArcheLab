"use client";

import { X } from "lucide-react";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/features/cosmetics/cosmetic-details";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import { PageChip } from "@/features/game-data/page-chip";
import { PlaceGroups } from "@/features/game-data/place-groups";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { WideTile } from "@/features/game-data/wide-tile";
import type { MiscItem } from "./misc-filters";

/** An item's tile color when its tier has none. */
export const miscColor = "var(--primary)";

/**
 * A Miscellaneous item's details, opened under its card's row (ADR 0050): its art and
 * tier, what it gives, the Basic Material of the same name, and where it drops, grouped
 * by place, each place with a page of its own linking it.
 */
export function MiscDetails({
  id,
  item,
  tier,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  item: MiscItem;
  tier: CosmeticTier | null;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRevealDetails(sectionRef, titleRef);

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

      <div className="flex items-center gap-4 pr-10">
        <WideTile
          imageUrl={item.imageUrl}
          color={tier?.hex ?? miscColor}
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

      {item.gives === null ? null : (
        <div className="grid gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            What it gives
          </h3>
          <PageChip href={item.gives.href}>{item.gives.name}</PageChip>
        </div>
      )}

      {/* Another item that shares its name, a Basic Material with its own tier. */}
      {item.basicTwin === null ? null : (
        <div className="grid gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Basic Material of the same name
          </h3>
          <PageChip href={`/basic-materials?material=${item.basicTwin}`}>
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
