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
import { AmorphousDetails, patternColor } from "./amorphous-details";
import {
  amorphousFiltersToSearch,
  buildKinds,
  defaultAmorphousFilters,
  filterAmorphous,
  parseAmorphousFilters,
  rateText,
  type AmorphousFilters,
  type AmorphousPattern,
} from "./amorphous-filters";

const all = "all";

/** The page's address with a query, for a card's link. */
const indexPath = "/amorphous-materials";

function writeFilters(filters: AmorphousFilters): void {
  writeSearch(amorphousFiltersToSearch(filters));
}

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `pattern-card-${slug}`;

interface AmorphousIndexProps {
  entries: readonly AmorphousPattern[];
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
  });
  const shown = filterAmorphous(entries, filters);
  const set = (change: Partial<AmorphousFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  const tierOf = (id: string) => tiers.find((tier) => tier.id === id) ?? null;
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(amorphousFiltersToSearch({ ...filters, open: null })) !== "";

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
    urlSearchOf(amorphousFiltersToSearch({ ...filters, open: null })),
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
          set({ open: entry.slug === openCard?.slug ? null : entry.slug });
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
            placeholder="Search by pattern, reward or what it builds"
            onChange={(event) => {
              set({ query: event.target.value });
            }}
            className="h-9 bg-background/60 pl-8"
          />
        </label>

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
              set({ kind: next?.kind ?? null });
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
          {shown.length === entries.length
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

      {shown.length === 0 ? (
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
    </div>
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
      {/* Each reward's name, wrapping when it doesn't fit, and its chance. */}
      <span className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5 border-t border-border/60 pt-3 text-xs leading-snug">
        {entry.rewards.map((reward) => (
          <span key={reward.id} className="contents">
            <span className="text-muted-foreground">{reward.name}</span>{" "}
            <span className="text-right text-foreground/80 tabular-nums">
              {rateText(reward.rate)}
            </span>
            <span className="sr-only">, </span>
          </span>
        ))}
      </span>
    </a>
  );
}
