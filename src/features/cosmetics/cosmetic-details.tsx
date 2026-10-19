"use client";

import { Shirt, X } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cosmeticTypeName } from "@/data/cosmetics";
import { filterChipClass } from "@/features/game-data/filter-row";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { wideArt } from "@/features/game-data/wide-art";
import { cn } from "@/lib/utils";
import {
  shownVersion,
  type CosmeticCard,
  type CosmeticDescendant,
  type CosmeticTier,
  type CosmeticVersion,
} from "./cosmetic-filters";

/** The color of a cosmetic NEXON gives no tier. */
export const untieredColor = "var(--muted-foreground)";

/**
 * A cosmetic's art on a panel in its tier's color, at the art's own wide shape (ADR
 * 0039). Decorative: the name beside it says the same. Art NEXON doesn't list shows a
 * shirt instead.
 */
export function CosmeticArt({
  imageUrl,
  color,
  size,
}: {
  imageUrl: string | null;
  color: string;
  size: "card" | "lg" | "thumb";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden border",
        size === "thumb"
          ? "h-12 w-20 rounded-lg"
          : "aspect-[296/176] w-full rounded-xl",
      )}
      style={{
        borderColor: `color-mix(in srgb, ${color} 40%, var(--border))`,
        backgroundImage: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${color} 30%, transparent), color-mix(in srgb, ${color} 6%, transparent) 75%)`,
      }}
    >
      {imageUrl === null ? (
        <Shirt
          className={cn(
            "text-muted-foreground/60",
            size === "thumb" ? "size-5" : "size-10",
          )}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
        <img
          src={imageUrl}
          alt=""
          width={wideArt.width}
          height={wideArt.height}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
        />
      )}
    </span>
  );
}

/** A tier's rarity name on a pill in its color. */
export function TierBadge({
  tier,
  size = "sm",
}: {
  tier: CosmeticTier;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "rounded-full border font-medium",
        size === "sm" ? "px-1.5 text-[0.6875rem]" : "px-2 py-0.5 text-xs",
      )}
      style={{
        color: tier.hex,
        borderColor: `color-mix(in srgb, ${tier.hex} 45%, transparent)`,
      }}
    >
      {tier.name}
    </span>
  );
}

/**
 * Who a version is for, in a few words: "Bunny, Ultimate Bunny", or "27 Descendants"
 * for a long list.
 */
export function versionLabel(
  version: CosmeticVersion,
  names: ReadonlyMap<string, CosmeticDescendant>,
  index: number,
): string {
  const named = version.descendants.flatMap((slug) => {
    const descendant = names.get(slug);
    return descendant === undefined ? [] : [descendant.name];
  });
  if (named.length === 0) {
    return `Version ${String(index + 1)}`;
  }
  return named.length <= 2
    ? named.join(", ")
    : `${String(named.length)} Descendants`;
}

/**
 * A cosmetic's details, opened under its card's row (ADR 0039): its art, tier, type and
 * description, its evolution stages, and who can use it, version by version. Opens on
 * the version the card showed. Keyed by cosmetic, so another starts afresh.
 */
export function CosmeticDetails({
  id,
  card,
  tier,
  descendants,
  descendant,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  card: CosmeticCard;
  /** Its tier, or null when NEXON gives none. */
  tier: CosmeticTier | null;
  /** Every Descendant the index names, by slug. */
  descendants: ReadonlyMap<string, CosmeticDescendant>;
  /** The Descendant the index is filtered by, whose version opens first. */
  descendant: string | null;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRevealDetails(sectionRef, titleRef);
  const [versionId, setVersionId] = useState(
    () => shownVersion(card, descendant).id,
  );
  // The picked evolution stage's art, or null for the cosmetic's own.
  const [stage, setStage] = useState<number | null>(null);
  const version =
    card.versions.find((entry) => entry.id === versionId) ?? card.versions[0];
  const color = tier?.hex ?? untieredColor;
  const art =
    stage === null ? version.imageUrl : (version.stages.at(stage) ?? null);
  const people = version.descendants.flatMap((slug) => {
    const entry = descendants.get(slug);
    return entry === undefined ? [] : [entry];
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
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border border-primary/40 bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6 lg:grid-cols-2 lg:gap-8"
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

      <div className="grid gap-1.5 pr-10 lg:col-span-2">
        <h2
          ref={titleRef}
          id={`${ids}-title`}
          tabIndex={-1}
          className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
        >
          {card.name}
        </h2>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {tier === null ? null : <TierBadge tier={tier} size="md" />}
          <span>{cosmeticTypeName(card.type)}</span>
        </p>
      </div>

      <div className="grid content-start gap-4">
        <CosmeticArt imageUrl={art} color={color} size="lg" />
        {version.stages.length === 0 ? null : (
          <div className="grid gap-2">
            <span
              id={`${ids}-stages`}
              className="text-xs font-medium text-muted-foreground"
            >
              {`${String(version.stages.length)} ${version.stages.length === 1 ? "stage" : "stages"}`}
            </span>
            <ToggleGroup
              aria-labelledby={`${ids}-stages`}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap"
              value={stage === null ? [] : [String(stage)]}
              onValueChange={(value) => {
                const next = value.at(0);
                setStage(next === undefined ? null : Number(next));
              }}
            >
              {version.stages.map((url, index) => (
                <ToggleGroupItem
                  key={url}
                  value={String(index)}
                  className="h-auto flex-col gap-1 rounded-xl p-1.5 aria-pressed:border-primary/60 aria-pressed:bg-primary/15"
                >
                  <CosmeticArt imageUrl={url} color={color} size="thumb" />
                  <span className="text-xs">{`Stage ${String(index + 1)}`}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
      </div>

      <div className="grid content-start gap-5">
        <p className="leading-relaxed">{card.description}</p>

        {card.versions.length > 1 ? (
          <div className="grid gap-2">
            <span
              id={`${ids}-version`}
              className="text-xs font-medium text-muted-foreground"
            >
              {`${String(card.versions.length)} versions`}
            </span>
            <ToggleGroup
              aria-labelledby={`${ids}-version`}
              variant="outline"
              size="sm"
              spacing={1}
              className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
              value={[version.id]}
              onValueChange={(value) => {
                const next = value.at(0);
                if (next !== undefined) {
                  setVersionId(next);
                  setStage(null);
                }
              }}
            >
              {card.versions.map((entry, index) => (
                <ToggleGroupItem
                  key={entry.id}
                  value={entry.id}
                  className={`${filterChipClass} h-auto min-w-0 flex-col items-stretch gap-1.5 rounded-xl p-1.5 text-left whitespace-normal`}
                >
                  <CosmeticArt
                    imageUrl={entry.imageUrl}
                    color={color}
                    size="thumb"
                  />
                  <span className="text-xs leading-snug">
                    {versionLabel(entry, descendants, index)}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ) : null}

        <div className="grid gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            {card.versions.length > 1
              ? "Who can use this version"
              : "Who can use it"}
          </h3>
          {card.everyone ? (
            <p className="text-sm">Every Descendant</p>
          ) : people.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not listed yet</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {people.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`/descendants/${entry.slug}`}
                    prefetch={false}
                    className="flex items-center gap-2 rounded-full border bg-background/60 py-1 pr-3 pl-1 text-sm transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {entry.imageUrl === "" ? (
                      <span className="size-7 rounded-full bg-muted" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
                      <img
                        src={entry.imageUrl}
                        alt=""
                        width={256}
                        height={256}
                        loading="lazy"
                        decoding="async"
                        className="size-7 rounded-full object-cover"
                      />
                    )}
                    {entry.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
