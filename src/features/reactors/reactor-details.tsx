"use client";

import { RotateCw, X } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArcheIcon, ElementIcon } from "@/features/descendants/type-icons";
import { dataFileHook } from "@/features/game-data/data-file";
import { filterChipClass } from "@/features/game-data/filter-row";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { reactorArt } from "./reactor-art";
import type { ReactorCard } from "./reactor-filters";
import {
  reactorDataUrl,
  readReactorLevels,
  type ReactorLevel,
} from "./reactor-levels";

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

/** A reactor's levels, loaded when its details open. */
const useReactorLevels = dataFileHook(readReactorLevels);

/**
 * A reactor's details, opened in the index's grid as a row under its card's row (ADR
 * 0026): its tiers, boosts, the Descendants it suits, and Skill Power, Sub Attack Power
 * and enchant bonuses at every level. Keyed by reactor, so another starts afresh.
 */
export function ReactorDetails({
  id,
  card,
  attributeIcons,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  card: ReactorCard;
  /** Each attribute's icon, by name. */
  attributeIcons: Readonly<Record<string, string>>;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [tierId, setTierId] = useState(card.tiers.at(0)?.id ?? "");
  const tier =
    card.tiers.find((entry) => entry.id === tierId) ?? card.tiers.at(0);
  const levels = useReactorLevels(reactorDataUrl(card.slug));
  useRevealDetails(sectionRef, titleRef);

  if (tier === undefined) {
    return null;
  }

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
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6 lg:grid-cols-2 lg:gap-8"
      style={{
        borderColor: `color-mix(in srgb, ${tier.hex} 45%, var(--border))`,
        backgroundImage: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${tier.hex} 12%, transparent), transparent 60%)`,
      }}
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

      <div className="grid content-start gap-5">
        <div className="flex items-center gap-4 pr-10">
          <ReactorTile imageUrl={tier.imageUrl} color={tier.hex} size="lg" />
          <div className="grid min-w-0 gap-1.5">
            <h2
              ref={titleRef}
              id={`${ids}-title`}
              tabIndex={-1}
              className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
            >
              {card.name}
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span
                className="rounded-full border px-2 py-0.5 text-xs font-medium"
                style={{
                  color: tier.hex,
                  borderColor: `color-mix(in srgb, ${tier.hex} 50%, transparent)`,
                }}
              >
                {tier.name}
              </span>
              <ReactorTypes card={card} attributeIcons={attributeIcons} />
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <span
            id={`${ids}-tier`}
            className="text-xs font-medium text-muted-foreground"
          >
            Tier
          </span>
          <ToggleGroup
            aria-labelledby={`${ids}-tier`}
            variant="outline"
            size="sm"
            spacing={1}
            className="flex-wrap"
            value={[tier.id]}
            onValueChange={(value) => {
              const next = value.at(0);
              if (next !== undefined) {
                setTierId(next);
              }
            }}
          >
            {card.tiers.map((entry) => (
              <ToggleGroupItem
                key={entry.id}
                value={entry.id}
                className={filterChipClass}
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: entry.hex }}
                />
                {entry.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {card.boosts.length === 0 ? null : (
          <dl className="grid gap-2 rounded-xl border bg-card/60 p-4">
            {card.boosts.map((boost) => (
              <div
                key={boost.name}
                className="flex justify-between gap-4 text-sm"
              >
                <dt className="text-muted-foreground">{boost.name}</dt>
                <dd className="tabular-nums">
                  {numberFormat.format(boost.value * 100)}%
                </dd>
              </div>
            ))}
          </dl>
        )}

        {card.descendants.length === 0 ? null : (
          <div className="grid gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Descendants with {card.attribute} {card.archeType} skills
            </h3>
            <ul className="flex flex-wrap gap-2">
              {card.descendants.map((descendant) => (
                <li key={descendant.slug}>
                  <Link
                    href={`/descendants/${descendant.slug}`}
                    className="flex items-center gap-2 rounded-full border bg-background/60 py-1 pr-3 pl-1 text-sm transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
                    <img
                      src={descendant.imageUrl}
                      alt=""
                      width={256}
                      height={256}
                      loading="lazy"
                      decoding="async"
                      className="size-7 rounded-full object-cover"
                    />
                    {descendant.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <section
        aria-labelledby={`${ids}-levels`}
        className="grid content-start gap-4"
      >
        <h3
          id={`${ids}-levels`}
          className="font-display text-lg font-semibold tracking-wide"
        >
          Levels
        </h3>
        {levels.status === "loading" ? (
          <p aria-busy="true" className="text-sm text-muted-foreground">
            Loading its levels…
          </p>
        ) : levels.status === "failed" ? (
          <div className="grid justify-items-start gap-3 rounded-xl border border-dashed p-4">
            <p className="text-sm text-muted-foreground">
              The levels couldn&apos;t be loaded.
            </p>
            <Button variant="outline" size="sm" onClick={levels.retry}>
              <RotateCw aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : (
          <LevelView
            key={tier.id}
            name={`${card.name}, ${tier.name}`}
            levels={levels.file.levels[tier.id] ?? []}
          />
        )}
      </section>
    </section>
  );
}

/** A reactor's attribute and Arche type, each with its icon. */
export function ReactorTypes({
  card,
  attributeIcons,
}: {
  card: ReactorCard;
  attributeIcons: Readonly<Record<string, string>>;
}) {
  return (
    <>
      {card.attribute === null ? null : (
        <span className="flex items-center gap-1.5">
          <ElementIcon url={attributeIcons[card.attribute]} />
          {card.attribute}
        </span>
      )}{" "}
      {card.archeType === null ? null : (
        <span className="flex items-center gap-1.5">
          <ArcheIcon archeType={card.archeType} />
          {card.archeType}
        </span>
      )}
    </>
  );
}

/** The reactor art on a tile in its tier's color, as wide as the art's own shape. */
export function ReactorTile({
  imageUrl,
  color,
  size,
}: {
  imageUrl: string;
  color: string;
  size: "md" | "lg";
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl border px-1.5 ${size === "lg" ? "h-20 w-28" : "h-16 w-24"}`}
      style={{
        borderColor: `color-mix(in srgb, ${color} 45%, var(--border))`,
        backgroundImage: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${color} 35%, transparent), color-mix(in srgb, ${color} 8%, transparent) 75%)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
      <img
        src={imageUrl}
        alt=""
        width={reactorArt.width}
        height={reactorArt.height}
        loading="lazy"
        decoding="async"
        className="h-auto max-h-full w-full object-contain"
      />
    </span>
  );
}

/** Skill Power, Sub Attack Power and enchant bonuses at a level, from a slider. */
function LevelView({
  name,
  levels,
}: {
  /** The reactor and tier, for the numbers' accessible name. */
  name: string;
  levels: readonly ReactorLevel[];
}) {
  const sliderId = useId();
  const lastIndex = levels.length - 1;
  const [index, setIndex] = useState(lastIndex);
  const current = levels.at(index);
  if (current === undefined) {
    return (
      <p className="text-sm text-muted-foreground">
        No levels are listed for this reactor.
      </p>
    );
  }
  const first = levels.at(0)?.level ?? current.level;
  const last = levels.at(-1)?.level ?? current.level;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-xl border bg-card/60 p-4">
        {/* The slider's name stays "Level" and its value text says the level, so the
            big number is for the eye only, as on Descendant and weapon pages. */}
        <label htmlFor={sliderId} className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Level</span>
          <span
            aria-hidden="true"
            className="min-w-[3ch] font-display text-3xl font-semibold text-primary tabular-nums"
          >
            {current.level}
          </span>
        </label>
        <div className="grid gap-1.5">
          <input
            id={sliderId}
            type="range"
            min={0}
            max={lastIndex}
            step={1}
            value={index}
            aria-valuetext={String(current.level)}
            onChange={(event) => {
              setIndex(Number(event.target.value));
            }}
            className="h-2 w-full cursor-pointer accent-primary"
          />
          <div
            aria-hidden="true"
            className="flex justify-between font-mono text-xs text-muted-foreground"
          >
            <span>{first}</span>
            <span>{last}</span>
          </div>
        </div>
      </div>
      <dl
        aria-label={`${name} at level ${String(current.level)}`}
        className="grid grid-cols-2 gap-3"
      >
        <div className="grid gap-1 rounded-xl border bg-card/40 p-3">
          <dt className="text-sm text-muted-foreground">Skill Power</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">
            {numberFormat.format(current.skillPower)}
          </dd>
        </div>
        <div className="grid gap-1 rounded-xl border bg-card/40 p-3">
          <dt className="text-sm text-muted-foreground">Sub Attack Power</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">
            {numberFormat.format(current.subAttackPower)}
          </dd>
        </div>
      </dl>
      {current.enchants.length === 0 ? null : (
        <div className="grid gap-2 rounded-xl border bg-card/40 p-4">
          <h4 className="text-xs font-medium tracking-wide text-primary uppercase">
            Enchant bonuses
          </h4>
          <dl className="grid gap-1">
            {current.enchants.map((enchant) => (
              <div
                key={enchant.level}
                className="flex justify-between gap-4 border-b border-border/50 pb-1 text-sm last:border-b-0"
              >
                <dt className="text-muted-foreground">
                  Enchant {enchant.level}
                </dt>
                <dd className="tabular-nums">
                  {enchant.stat ?? "Bonus"} +
                  {numberFormat.format(enchant.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
