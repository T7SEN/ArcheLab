"use client";

import { X } from "lucide-react";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/features/cosmetics/cosmetic-details";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import { PlaceGroups } from "@/features/game-data/place-groups";
import { ResearchRecipe } from "@/features/game-data/research-recipe";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { WideTile } from "@/features/game-data/wide-tile";
import { wayTitle, type EnhancementMaterial } from "./enhancement-filters";

/** An item's tile color when its tier has none. */
export const materialColor = "var(--primary)";

/** The columns for an item's ways on wide screens: three for three or more, else two. */
const waysGridClass = (count: number) =>
  count >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

/**
 * An enhancement material's details, opened under its card's row (ADR 0043): what it is
 * for, where it also drops, and every way to research it, each with its time, cost and
 * ingredients (a researched part opens to its own recipe; a part from an Amorphous
 * Material Pattern links it).
 */
export function EnhancementDetails({
  id,
  item,
  tier,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  item: EnhancementMaterial;
  tier: CosmeticTier | null;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRevealDetails(sectionRef, titleRef);
  const several = item.recipes.length > 1;

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
            color={tier?.hex ?? materialColor}
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
        <div className="grid content-start gap-4">
          {item.description === "" ? null : (
            <p className="leading-relaxed">{item.description}</p>
          )}
          {item.sources.length === 0 ? null : (
            <div className="grid gap-3">
              <h3 className="text-xs font-medium text-muted-foreground">
                Where to find it
              </h3>
              <PlaceGroups names={item.sources} links={item.placeLinks} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {several ? (
          <h3 className="text-xs font-medium text-muted-foreground">
            {`${String(item.recipes.length)} ways to research it`}
          </h3>
        ) : null}
        {/* Several ways side by side on wide screens, each in one column. */}
        <div
          className={`grid items-start gap-3 ${several ? waysGridClass(item.recipes.length) : ""}`}
        >
          {item.recipes.map((recipe, index) => (
            <ResearchRecipe
              // A way's ingredients don't change while the page is open.
              key={index}
              name={item.name}
              recipe={recipe}
              title={several ? wayTitle(recipe) : undefined}
              compact={several}
              inPanel
            />
          ))}
        </div>
      </div>
    </section>
  );
}
