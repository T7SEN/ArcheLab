"use client";

import { RotateCw, TriangleAlert, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { dataFileHook } from "@/features/game-data/data-file";
import { filterChipClass } from "@/features/game-data/filter-row";
import { CoreTypeGrid } from "@/features/game-data/core-type-grid";
import type { CoreType } from "@/features/game-data/core-types";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { WideTile } from "@/features/game-data/wide-tile";
import type { ComponentCard, ComponentPieceCard } from "./component-filters";
import {
  componentDataUrl,
  readComponentLevels,
  type ComponentLevelsFile,
} from "./component-levels";

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

/** A card's levels, loaded when its details open. */
const useComponentLevels = dataFileHook(readComponentLevels);

/** A card's tiers, highest first, each once. */
export function tiersOf(
  card: ComponentCard,
): { readonly name: string; readonly hex: string }[] {
  return [
    ...new Map(
      card.pieces.map((piece) => [
        piece.tier,
        { name: piece.tier, hex: piece.hex },
      ]),
    ).values(),
  ];
}

/** Each slot's possible sub-stats, by name, and whether they are still provisional. */
export interface SubStats {
  readonly bySlot: Readonly<Record<string, readonly string[]>>;
  readonly provisional: boolean;
}

/** A piece's base stat value at a level, from the card's data file. */
function statAt(
  file: ComponentLevelsFile,
  piece: ComponentPieceCard,
  level: number,
): number | undefined {
  return file.levels[piece.id]?.find((entry) => entry.level === level)?.value;
}

/**
 * An external component card's details, opened in the index's grid as a row under its
 * card's row (ADR 0027). On the left, its tier switch and its pieces, each with its base
 * stat at the level shown; on the right, the piece picked: its core slots, a level
 * slider, its base stat and its possible sub-stats; under both, a set's effect. Cards
 * without a set switch between tiers. Keyed by card, so another starts afresh.
 */
export function ComponentDetails({
  id,
  card,
  initialTier,
  subStats,
  coreSlots,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  card: ComponentCard;
  /** The tier to show first: the index's tier filter, or the highest. */
  initialTier: string | null;
  subStats: SubStats;
  /** The core types an Ultimate piece's slots take. */
  coreSlots: readonly CoreType[];
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tiers = tiersOf(card);
  const [tierName, setTierName] = useState(
    initialTier ?? tiers.at(0)?.name ?? "",
  );
  // The piece shown, by slot, so a tier switch keeps it.
  const [slot, setSlot] = useState(card.pieces.at(0)?.slot ?? "");
  // The level shown, as an index into the levels; null is the highest. It holds across
  // pieces, and a tier switch goes back to the highest.
  const [levelIndex, setLevelIndex] = useState<number | null>(null);
  const tier = tiers.find((entry) => entry.name === tierName) ?? tiers.at(0);
  const levels = useComponentLevels(componentDataUrl(card.slug));
  useRevealDetails(sectionRef, titleRef);

  if (tier === undefined) {
    return null;
  }
  const pieces = card.pieces.filter((piece) => piece.tier === tier.name);
  const piece = pieces.find((entry) => entry.slot === slot) ?? pieces.at(0);
  const file = levels.status === "ready" ? levels.file : null;
  // Every piece lists the same levels (1 to 100 on 2026-10-16); the first sets them.
  const levelList =
    file === null
      ? []
      : (file.levels[pieces.at(0)?.id ?? ""] ?? []).map((entry) => entry.level);
  const lastIndex = levelList.length - 1;
  const index = levelIndex ?? lastIndex;
  const level = levelList.at(index) ?? null;

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
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8"
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
        <div className="grid gap-1.5 pr-10">
          <h2
            ref={titleRef}
            id={`${ids}-title`}
            tabIndex={-1}
            className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
          >
            {card.name}
          </h2>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span
              className="rounded-full border px-2 py-0.5 text-xs font-medium"
              style={{
                color: tier.hex,
                borderColor: `color-mix(in srgb, ${tier.hex} 50%, transparent)`,
              }}
            >
              {tier.name}
            </span>
            <span>
              {card.kind === "set"
                ? `Set of ${String(card.pieces.length)}`
                : `${String(pieces.length)} slots`}
            </span>
          </p>
        </div>

        {tiers.length > 1 ? (
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
              value={[tier.name]}
              onValueChange={(value) => {
                const next = value.at(0);
                if (next !== undefined) {
                  setTierName(next);
                  setLevelIndex(null);
                }
              }}
            >
              {tiers.map((entry) => (
                <ToggleGroupItem
                  key={entry.name}
                  value={entry.name}
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
        ) : null}

        <section aria-labelledby={`${ids}-pieces`} className="grid gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3
              id={`${ids}-pieces`}
              className="font-display text-lg font-semibold tracking-wide"
            >
              Pieces
            </h3>
            {level === null ? null : (
              <span className="text-xs text-muted-foreground">
                Base stat at level {level}
              </span>
            )}
          </div>
          {/* Picking a piece shows it on the right; the pick is by slot, so it holds
              across tiers. Each row shows its base stat at the level shown. */}
          <ToggleGroup
            aria-labelledby={`${ids}-pieces`}
            orientation="vertical"
            variant="outline"
            spacing={1.5}
            className="w-full flex-col items-stretch"
            value={[piece?.slot ?? ""]}
            onValueChange={(value) => {
              const next = value.at(0);
              if (next !== undefined) {
                setSlot(next);
              }
            }}
          >
            {pieces.map((entry) => {
              const value =
                file === null || level === null
                  ? undefined
                  : statAt(file, entry, level);
              return (
                <ToggleGroupItem
                  key={entry.id}
                  value={entry.slot}
                  className="h-auto w-full justify-start gap-3 rounded-xl bg-card/40 p-2 text-left whitespace-normal aria-pressed:border-primary/70 aria-pressed:bg-primary/15"
                >
                  <WideTile
                    imageUrl={entry.imageUrl}
                    color={entry.hex}
                    size="sm"
                  />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="text-sm leading-tight font-medium">
                      {entry.name}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {entry.slot}
                    </span>
                  </span>
                  {value === undefined ? null : (
                    <span className="grid shrink-0 justify-items-end gap-0.5 pr-1">
                      <span className="font-display text-base font-semibold tabular-nums">
                        {numberFormat.format(value)}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {entry.stat ?? "Base stat"}
                      </span>
                    </span>
                  )}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </section>
      </div>

      <div className="grid content-start">
        {levels.status === "loading" ? (
          <p aria-busy="true" className="text-sm text-muted-foreground">
            Loading their levels…
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
        ) : piece === undefined || level === null ? (
          <p className="text-sm text-muted-foreground">
            No levels are listed for this piece.
          </p>
        ) : (
          <PieceView
            piece={piece}
            levels={levelList}
            index={index}
            onIndex={setLevelIndex}
            value={statAt(levels.file, piece, level)}
            subStats={subStats}
            coreSlots={coreSlots}
          />
        )}
      </div>

      {card.bonuses.length === 0 ? null : (
        <section
          aria-labelledby={`${ids}-bonuses`}
          className="grid gap-3 rounded-xl border bg-card/60 p-4 lg:col-span-2"
        >
          <h3
            id={`${ids}-bonuses`}
            className="text-xs font-medium tracking-wide text-primary uppercase"
          >
            Set effect
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {card.bonuses.map((bonus) => (
              <div key={bonus.count} className="grid content-start gap-1">
                <dt className="text-sm font-medium">{bonus.count} Set</dt>
                <dd className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
                  {bonus.effect}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </section>
  );
}

/**
 * The piece picked: its art, name and core slots, the level slider, its base stat at
 * that level, what its core slots take, and its slot's possible sub-stats, in the order
 * the game's tooltip shows them.
 */
function PieceView({
  piece,
  levels,
  index,
  onIndex,
  value,
  subStats,
  coreSlots,
}: {
  piece: ComponentPieceCard;
  /** Every level, lowest first. */
  levels: readonly number[];
  /** The level shown, as an index into `levels`. */
  index: number;
  onIndex: (index: number) => void;
  /** Its base stat at that level. */
  value: number | undefined;
  subStats: SubStats;
  coreSlots: readonly CoreType[];
}) {
  const ids = useId();
  const level = levels.at(index);
  const possible = subStats.bySlot[piece.slot] ?? [];

  return (
    <section
      aria-labelledby={`${ids}-name`}
      className="grid gap-4 rounded-xl border bg-card/60 p-4"
    >
      <div className="flex items-center gap-3">
        <WideTile imageUrl={piece.imageUrl} color={piece.hex} size="lg" />
        <div className="grid min-w-0 gap-0.5">
          <span className="text-xs text-muted-foreground">{piece.slot}</span>
          <h3
            id={`${ids}-name`}
            className="font-display text-lg leading-tight font-semibold tracking-wide"
          >
            {piece.name}
          </h3>
          {piece.coreSlots === 0 ? null : (
            <span className="text-xs text-muted-foreground">
              {piece.coreSlots === 1
                ? "1 core slot"
                : `${String(piece.coreSlots)} core slots`}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {/* The slider's name stays "Level" and its value text says the level, so the
            big number is for the eye only, as on the other pages. */}
        <label htmlFor={`${ids}-level`} className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Level</span>
          <span
            aria-hidden="true"
            className="min-w-[3ch] font-display text-3xl font-semibold text-primary tabular-nums"
          >
            {level}
          </span>
        </label>
        <div className="grid gap-1.5">
          <input
            id={`${ids}-level`}
            type="range"
            min={0}
            max={levels.length - 1}
            step={1}
            value={index}
            aria-valuetext={String(level)}
            onChange={(event) => {
              onIndex(Number(event.target.value));
            }}
            className="h-2 w-full cursor-pointer accent-primary"
          />
          <div
            aria-hidden="true"
            className="flex justify-between font-mono text-xs text-muted-foreground"
          >
            <span>{levels.at(0)}</span>
            <span>{levels.at(-1)}</span>
          </div>
        </div>
      </div>

      <dl className="flex items-baseline justify-between gap-3 border-t pt-3">
        <dt className="text-sm text-muted-foreground">
          {piece.stat ?? "Base stat"}
        </dt>
        <dd className="font-display text-2xl font-semibold tabular-nums">
          {value === undefined ? "–" : numberFormat.format(value)}
        </dd>
      </dl>

      {piece.coreSlots === 0 || coreSlots.length === 0 ? null : (
        <CoreSlots types={coreSlots} count={piece.coreSlots} />
      )}

      {possible.length === 0 ? null : (
        <section
          aria-labelledby={`${ids}-sub`}
          className="grid gap-2.5 border-t pt-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h4
              id={`${ids}-sub`}
              className="text-xs font-medium tracking-wide text-primary uppercase"
            >
              Possible sub-stats ({possible.length})
            </h4>
            {subStats.provisional ? (
              <Badge variant="destructive">
                <TriangleAlert aria-hidden="true" />
                Provisional: not verified in game yet
              </Badge>
            ) : null}
          </div>
          <ul className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            {possible.map((name) => (
              <li key={name} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-primary/70"
                />
                {name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

/**
 * What a piece's core slots take: each slot's core type, and at the core grade picked,
 * starting at the highest, the core it needs and the options that core can roll.
 */
function CoreSlots({
  types,
  count,
}: {
  types: readonly CoreType[];
  /** How many core slots the piece has. */
  count: number;
}) {
  const ids = useId();
  return (
    <section
      aria-labelledby={`${ids}-cores`}
      className="grid gap-3 border-t pt-3"
    >
      <h4
        id={`${ids}-cores`}
        className="text-xs font-medium tracking-wide text-primary uppercase"
      >
        Core slots ({count})
      </h4>
      <CoreTypeGrid types={types} headingLevel={5} />
    </section>
  );
}
