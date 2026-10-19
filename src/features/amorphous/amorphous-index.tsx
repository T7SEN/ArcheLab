"use client";

import { Search, X } from "lucide-react";
import { useId, type MouseEvent } from "react";
import { useChangedSince, useClosing } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { sitePages } from "@/data/site-pages";
import { TierBadge } from "@/features/cosmetics/cosmetic-details";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import {
  batchesThrough,
  cardBatch,
  drawnCount,
} from "@/features/game-data/card-batches";
import {
  roomyGridClass,
  rowEnd,
  useGridColumns,
} from "@/features/game-data/details-row";
import { CardTags } from "@/features/game-data/card-tags";
import { FilterRow, filterChipClass } from "@/features/game-data/filter-row";
import {
  CardItem,
  DetailsRowItem,
  MoreCards,
  useCardBatches,
} from "@/features/game-data/grid-items";
import {
  urlSearchOf,
  useSearch,
  writeSearch,
} from "@/features/game-data/url-query";
import { WideTile } from "@/features/game-data/wide-tile";
import { LoadFailed } from "@/features/game-data/load-failed";
import {
  AmorphousDetails,
  StabilizerDetails,
  patternColor,
} from "./amorphous-details";
import {
  amorphousFiltersToSearch,
  amorphousTypes,
  buildKinds,
  defaultAmorphousFilters,
  filterAmorphous,
  filterStabilizers,
  parseAmorphousFilters,
  rateText,
  type AmorphousFilters,
  type AmorphousPattern,
  type ShapeStabilizer,
} from "./amorphous-filters";

const all = "all";

/** The page's address with a query, for a card's link. */
const indexPath = "/amorphous-materials";

function writeFilters(filters: AmorphousFilters): void {
  writeSearch(amorphousFiltersToSearch(filters));
}

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `pattern-card-${slug}`;
const stabilizerCardId = (slug: string) => `stabilizer-card-${slug}`;

interface AmorphousIndexProps {
  entries: readonly AmorphousPattern[];
  /** The regular Shape Stabilizers, in their own section after the patterns. */
  stabilizers: readonly ShapeStabilizer[];
  /** The patterns' tiers, with their rarity names and colors. */
  tiers: readonly CosmeticTier[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function AmorphousIndexFromUrl(props: AmorphousIndexProps) {
  return <AmorphousIndex {...props} search={useSearch()} />;
}

/**
 * Every Amorphous Material Pattern in the game, with a filter by what a pattern is for
 * (Descendants, weapons, Fellows, vehicles, like the weapons' Rounds filter) and a
 * search (T7SEN, 2026-10-17; ADR 0041). A card opens its rewards in a row under its
 * own; cards come in batches as the page scrolls (ADR 0031). The filters and the open
 * pattern live in the URL query; with `search` "" this is the unfiltered index the
 * static HTML holds.
 */
export function AmorphousIndex({
  entries,
  stabilizers,
  tiers,
  search,
}: AmorphousIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  // Cards a filter brings in fade in; the first render doesn't (ADR 0030).
  const enter = useChangedSince(search);
  const filters = parseAmorphousFilters(search, {
    patterns: entries.map((entry) => entry.slug),
    stabilizers: stabilizers.map((entry) => entry.slug),
  });
  const shown = filterAmorphous(entries, filters);
  const shownStabilizers = filterStabilizers(stabilizers, filters);
  const set = (change: Partial<AmorphousFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  const tierOf = (id: string) => tiers.find((tier) => tier.id === id) ?? null;
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(
      amorphousFiltersToSearch({ ...filters, open: null, stabilizer: null }),
    ) !== "";

  // The open pattern's details go in a row under its card's row (`details-row.ts`).
  // A roomier grid than the other indexes: each card lists five rewards by name.
  const columns = useGridColumns("roomy");
  const openIndex = shown.findIndex((entry) => entry.slug === filters.open);
  // `at(-1)` would be the last card: nothing open finds no index.
  const openCard = openIndex === -1 ? null : (shown.at(openIndex) ?? null);
  const detailsId = `${ids}-details`;
  const closeDetails = (slug: string) => {
    set({ open: null });
    // The details held focus; it goes back to the card that opened them.
    document.getElementById(cardId(slug))?.focus({ preventScroll: true });
  };
  // A batch of cards at first, and more as the page nears the last one drawn (ADR
  // 0031). New filters start again from one batch; the open card is always drawn.
  const [batches, more] = useCardBatches(
    urlSearchOf(
      amorphousFiltersToSearch({ ...filters, open: null, stabilizer: null }),
    ),
    batchesThrough(openIndex),
  );
  const drawn = shown.slice(0, drawnCount(batches, shown.length));
  const items = drawn.map((entry, index) => (
    // Cards a later batch draws fade in too.
    <CardItem key={entry.slug} enter={enter || index >= cardBatch}>
      <PatternCardLink
        entry={entry}
        tier={tierOf(entry.tier)}
        open={entry.slug === openCard?.slug}
        controls={detailsId}
        onToggle={() => {
          set({
            open: entry.slug === openCard?.slug ? null : entry.slug,
            stabilizer: null,
          });
        }}
      />
    </CardItem>
  ));
  // Closed, the details fold away before they leave (ADR 0030). A card a filter hid
  // has nowhere to fold, so its details simply go.
  const [detailsCard, closing, closed] = useClosing(
    openCard,
    (card) => card.slug,
  );
  const detailsIndex =
    detailsCard === null
      ? -1
      : drawn.findIndex((entry) => entry.slug === detailsCard.slug);
  if (closing && detailsIndex === -1) {
    closed();
  }
  if (detailsCard !== null && detailsIndex !== -1) {
    items.splice(
      rowEnd(detailsIndex, columns, drawn.length) + 1,
      0,
      <DetailsRowItem
        key={`details-${detailsCard.slug}`}
        closing={closing}
        onClosed={closed}
      >
        <AmorphousDetails
          id={detailsId}
          pattern={detailsCard}
          tier={tierOf(detailsCard.tier)}
          onClose={() => {
            closeDetails(detailsCard.slug);
          }}
        />
      </DetailsRowItem>,
    );
  }

  // The Shape Stabilizers' section works the same way, its details under its own row.
  const openStabilizer =
    shownStabilizers.find((entry) => entry.slug === filters.stabilizer) ?? null;
  const stabilizerItems = shownStabilizers.map((entry) => (
    <CardItem key={entry.slug} enter={enter}>
      <StabilizerCardLink
        entry={entry}
        tier={tierOf(entry.tier)}
        open={entry.slug === openStabilizer?.slug}
        controls={detailsId}
        onToggle={() => {
          set({
            stabilizer: entry.slug === openStabilizer?.slug ? null : entry.slug,
            open: null,
          });
        }}
      />
    </CardItem>
  ));
  const [detailsStabilizer, closingStabilizer, closedStabilizer] = useClosing(
    openStabilizer,
    (card) => card.slug,
  );
  const stabilizerIndex =
    detailsStabilizer === null
      ? -1
      : shownStabilizers.findIndex(
          (entry) => entry.slug === detailsStabilizer.slug,
        );
  if (closingStabilizer && stabilizerIndex === -1) {
    closedStabilizer();
  }
  if (detailsStabilizer !== null && stabilizerIndex !== -1) {
    stabilizerItems.splice(
      rowEnd(stabilizerIndex, columns, shownStabilizers.length) + 1,
      0,
      <DetailsRowItem
        key={`details-${detailsStabilizer.slug}`}
        closing={closingStabilizer}
        onClosed={closedStabilizer}
      >
        <StabilizerDetails
          id={detailsId}
          stabilizer={detailsStabilizer}
          tier={tierOf(detailsStabilizer.tier)}
          onClose={() => {
            set({ stabilizer: null });
            document
              .getElementById(stabilizerCardId(detailsStabilizer.slug))
              ?.focus({ preventScroll: true });
          }}
        />
      </DetailsRowItem>,
    );
  }

  // The data couldn't load: the hero says so, and this says it once more instead of
  // empty filters and "No … matches these filters."
  if (entries.length === 0) {
    return <LoadFailed what="Amorphous Materials" />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <label className="relative">
          <span className="sr-only">Search Amorphous Material Patterns</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.query}
            placeholder="Search by name, reward or use"
            onChange={(event) => {
              set({ query: event.target.value });
            }}
            className="h-9 bg-background/60 pl-8"
          />
        </label>

        <FilterRow id={`${ids}-type`} label="Type">
          <ToggleGroup
            aria-labelledby={`${ids}-type`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.type ?? all]}
            onValueChange={(value) => {
              const next =
                amorphousTypes.find((entry) => entry.type === value.at(0))
                  ?.type ?? null;
              // Shape Stabilizers are for no build: they clear For.
              set({
                type: next,
                kind: next === "stabilizers" ? null : filters.kind,
              });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {amorphousTypes.map((entry) => (
              <ToggleGroupItem
                key={entry.type}
                value={entry.type}
                className={filterChipClass}
              >
                {entry.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>

        <FilterRow id={`${ids}-for`} label="For">
          <ToggleGroup
            aria-labelledby={`${ids}-for`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.kind ?? all]}
            onValueChange={(value) => {
              const next = buildKinds.find(
                (entry) => entry.kind === value.at(0),
              );
              // A For pick is about patterns: it clears Shape Stabilizers.
              set({
                kind: next?.kind ?? null,
                type:
                  next !== undefined && filters.type === "stabilizers"
                    ? null
                    : filters.type,
              });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {buildKinds.map((entry) => {
              // Each kind wears its index's icon from the navbar.
              const Icon = sitePages.find(
                (page) => page.href === entry.href,
              )?.icon;
              return (
                <ToggleGroupItem
                  key={entry.kind}
                  value={entry.kind}
                  className={filterChipClass}
                >
                  {Icon === undefined ? null : <Icon aria-hidden="true" />}
                  {entry.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </FilterRow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {filters.type === "stabilizers"
            ? shownStabilizers.length === stabilizers.length
              ? `${String(stabilizers.length)} Shape Stabilizers`
              : `${String(shownStabilizers.length)} of ${String(stabilizers.length)} Shape Stabilizers`
            : shown.length === entries.length
              ? `${String(entries.length)} patterns`
              : `${String(shown.length)} of ${String(entries.length)} patterns`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters(defaultAmorphousFilters);
            }}
            className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden="true" className="size-4" />
            Clear filters
          </button>
        ) : null}
      </div>

      {filters.type === "stabilizers" ? (
        shownStabilizers.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground duration-300 motion-safe:animate-in motion-safe:fade-in">
            No Shape Stabilizer matches these filters.
          </p>
        ) : null
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground duration-300 motion-safe:animate-in motion-safe:fade-in">
          No pattern matches these filters.
        </p>
      ) : (
        <>
          <ul
            aria-label="Amorphous Material Patterns"
            className={roomyGridClass}
          >
            {items}
          </ul>
          <MoreCards
            drawn={drawn.length}
            total={shown.length}
            noun="patterns"
            onMore={more}
          />
        </>
      )}

      {shownStabilizers.length === 0 ? null : (
        <section aria-labelledby={`${ids}-stabilizers`} className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id={`${ids}-stabilizers`}
              className="font-display text-2xl font-semibold tracking-wide"
            >
              Shape Stabilizers
            </h2>
            {/* With Type on Shape Stabilizers, the status line counts them. */}
            {filters.type === "stabilizers" ? null : (
              <p className="text-sm text-muted-foreground">
                {shownStabilizers.length === stabilizers.length
                  ? `${String(stabilizers.length)} Shape Stabilizers`
                  : `${String(shownStabilizers.length)} of ${String(stabilizers.length)} Shape Stabilizers`}
              </p>
            )}
          </div>
          <ul aria-label="Shape Stabilizers" className={roomyGridClass}>
            {stabilizerItems}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * A Shape Stabilizer's card: its art, name and tier, and what it goes into. A real link
 * to the index with it open; a plain click opens or closes its details in place.
 */
function StabilizerCardLink({
  entry,
  tier,
  open,
  controls,
  onToggle,
}: {
  entry: ShapeStabilizer;
  tier: CosmeticTier | null;
  open: boolean;
  controls: string;
  onToggle: () => void;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // A modified or middle click opens the link as the browser would.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onToggle();
  };

  return (
    <a
      id={stabilizerCardId(entry.slug)}
      href={`${indexPath}?stabilizer=${entry.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full grid-cols-[minmax(0,1fr)] content-start gap-3 rounded-2xl border bg-card/70 p-3.5 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      <span className="flex min-w-0 items-center gap-3">
        <WideTile
          imageUrl={entry.imageUrl}
          color={tier?.hex ?? patternColor}
          size="sm"
        />
        <span className="grid min-w-0 justify-items-start gap-1.5">
          <span className="font-display text-base leading-tight font-semibold tracking-wide break-words">
            {entry.name}
          </span>{" "}
          {tier === null ? null : <TierBadge tier={tier} />}
        </span>
      </span>{" "}
      <CardTags
        label="Used for"
        tags={entry.uses.map((use) => ({
          text: use.name,
          note: `×${String(use.count)}`,
        }))}
      />
    </a>
  );
}

/**
 * A pattern's card. It is a real link to the index with the pattern open, so it can be
 * copied or opened in a new tab; a plain click opens or closes its details in place.
 */
function PatternCardLink({
  entry,
  tier,
  open,
  controls,
  onToggle,
}: {
  entry: AmorphousPattern;
  /** Its tier's rarity name and color. */
  tier: CosmeticTier | null;
  /** Whether its details are open. */
  open: boolean;
  /** The details' id, while they are open. */
  controls: string;
  onToggle: () => void;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // A modified or middle click opens the link as the browser would.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onToggle();
  };

  return (
    <a
      id={cardId(entry.slug)}
      href={`${indexPath}?pattern=${entry.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full grid-cols-[minmax(0,1fr)] content-start gap-3 rounded-2xl border bg-card/70 p-3.5 transition-colors outline-none [contain-intrinsic-size:auto_13rem] [content-visibility:auto] hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      {/* The art in its tier's color, then the name and the tier. */}
      <span className="flex min-w-0 items-center gap-3">
        <WideTile
          imageUrl={entry.imageUrl}
          color={tier?.hex ?? patternColor}
          size="sm"
        />
        <span className="grid min-w-0 justify-items-start gap-1.5">
          <span className="font-display text-base leading-tight font-semibold tracking-wide break-words">
            {entry.name}
          </span>{" "}
          {tier === null ? null : <TierBadge tier={tier} />}
        </span>
      </span>{" "}
      {/* Each reward with its chance. */}
      <CardTags
        label="Opens into"
        tags={entry.rewards.map((reward) => ({
          text: reward.name,
          note: rateText(reward.rate),
        }))}
      />
    </a>
  );
}
