"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlaceGroups } from "@/features/game-data/place-groups";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { WideTile } from "@/features/game-data/wide-tile";
import { TierBadge } from "@/features/cosmetics/cosmetic-details";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import {
  buildHref,
  patternPrefix,
  rateText,
  type AmorphousPattern,
  type ShapeStabilizer,
} from "./amorphous-filters";

/** The rewards' tile color, and a pattern's when its tier has none: rewards have no tier. */
export const patternColor = "var(--primary)";

/**
 * A pattern's details, opened under its card's row (ADR 0041): what it opens into, each
 * with its chance and what it is a part of, and where the pattern drops.
 */
export function AmorphousDetails({
  id,
  pattern,
  tier,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  pattern: AmorphousPattern;
  /** Its tier's rarity name and color. */
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
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border border-primary/40 bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8"
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

      <div className="grid content-start gap-4">
        <div className="flex items-center gap-4 pr-10">
          <WideTile
            imageUrl={pattern.imageUrl}
            color={tier?.hex ?? patternColor}
            size="lg"
          />
          <div className="grid justify-items-start gap-2">
            <h2
              ref={titleRef}
              id={`${ids}-title`}
              tabIndex={-1}
              className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
            >
              <span className="block text-sm font-medium tracking-normal text-muted-foreground">
                {patternPrefix.replace(/: $/, "")}
              </span>{" "}
              {pattern.name}
            </h2>
            {tier === null ? null : <TierBadge tier={tier} size="md" />}
          </div>
        </div>

        <div className="grid gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Where to find it
          </h3>
          {pattern.sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not listed yet</p>
          ) : (
            <PlaceGroups names={pattern.sources} links={pattern.placeLinks} />
          )}
        </div>
      </div>

      <div className="grid content-start gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">
          Opens into
        </h3>
        <ul className="grid gap-2">
          {pattern.rewards.map((reward) => (
            <li
              key={reward.id}
              className="flex items-center gap-3 rounded-xl border bg-card/60 p-2.5"
            >
              <WideTile
                imageUrl={reward.imageUrl}
                color={patternColor}
                size="sm"
              />
              <div className="grid min-w-0 flex-1 gap-0.5">
                {/* A Core Material links its own details (ADR 0047). */}
                {reward.href === null ? (
                  <span className="text-sm leading-snug font-medium">
                    {reward.name}
                  </span>
                ) : (
                  <Link
                    href={reward.href}
                    prefetch={false}
                    className="justify-self-start rounded-sm text-sm leading-snug font-medium underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 outline-none hover:text-primary hover:decoration-current hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {reward.name}
                  </Link>
                )}
                {reward.build === null ? null : (
                  <span className="text-xs text-muted-foreground">
                    For{" "}
                    <Link
                      href={buildHref(reward.build)}
                      prefetch={false}
                      className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {reward.build.name}
                    </Link>
                  </span>
                )}
              </div>
              <span className="font-display text-lg font-semibold tabular-nums">
                {rateText(reward.rate)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * A Shape Stabilizer's details, opened under its card's row (T7SEN, 2026-10-18): its
 * description as the game writes it and where to find it, and what research takes it,
 * each linking that Enhancement Material.
 */
export function StabilizerDetails({
  id,
  stabilizer,
  tier,
  onClose,
}: {
  id: string;
  stabilizer: ShapeStabilizer;
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
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border border-primary/40 bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8"
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

      <div className="grid content-start gap-4">
        <div className="flex items-center gap-4 pr-10">
          <WideTile
            imageUrl={stabilizer.imageUrl}
            color={tier?.hex ?? patternColor}
            size="lg"
          />
          <div className="grid justify-items-start gap-2">
            <h2
              ref={titleRef}
              id={`${ids}-title`}
              tabIndex={-1}
              className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
            >
              {stabilizer.name}
            </h2>
            {tier === null ? null : <TierBadge tier={tier} size="md" />}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {stabilizer.description}
        </p>

        <div className="grid gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Where to find it
          </h3>
          {stabilizer.sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not listed yet</p>
          ) : (
            <PlaceGroups
              names={stabilizer.sources}
              links={stabilizer.placeLinks}
            />
          )}
        </div>
      </div>

      <div className="grid content-start gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">Used for</h3>
        {stabilizer.uses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not listed yet</p>
        ) : (
          <ul className="grid gap-2">
            {stabilizer.uses.map((use) => (
              <li
                key={use.href}
                className="flex items-center gap-3 rounded-xl border bg-card/60 p-2.5"
              >
                <WideTile
                  imageUrl={use.imageUrl}
                  color={patternColor}
                  size="sm"
                />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <Link
                    href={use.href}
                    prefetch={false}
                    className="justify-self-start rounded-sm text-sm leading-snug font-medium underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 outline-none hover:text-primary hover:decoration-current hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {use.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    Enhancement Material research
                  </span>
                </div>
                <span className="font-display text-lg font-semibold tabular-nums">
                  ×{use.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
