"use client";

import { Search, X } from "lucide-react";
import { useId, type MouseEvent } from "react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  gridClass,
  rowEnd,
  useGridColumns,
} from "@/features/game-data/details-row";
import { FilterRow, filterChipClass } from "@/features/game-data/filter-row";
import {
  urlSearchOf,
  useSearch,
  writeSearch,
} from "@/features/game-data/url-query";
import { WideTile } from "@/features/game-data/wide-tile";
import { ComponentDetails, tiersOf, type SubStats } from "./component-details";
import type { CoreType } from "@/features/game-data/core-types";
import {
  componentFiltersToSearch,
  defaultComponentFilters,
  filterComponents,
  parseComponentFilters,
  type ComponentCard,
  type ComponentFilters,
} from "./component-filters";

const all = "all";

/** The page's address, for a card's link. */
const indexPath = "/external-components";

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `component-card-${slug}`;

function writeFilters(filters: ComponentFilters): void {
  writeSearch(componentFiltersToSearch(filters));
}

interface ComponentIndexProps {
  entries: readonly ComponentCard[];
  /** The tiers the filter offers, highest first, with their colors. */
  tiers: readonly { readonly name: string; readonly hex: string }[];
  /** Each slot's possible sub-stats, for the details. */
  subStats: SubStats;
  /** The core types an Ultimate piece's slots take, for the details. */
  coreSlots: readonly CoreType[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function ComponentIndexFromUrl(props: ComponentIndexProps) {
  return <ComponentIndex {...props} search={useSearch()} />;
}

/**
 * Every external component, one card per set, with a tier filter and a search (ADR
 * 0027). A card opens its details in a row under its own row. The filters and the open
 * card live in the URL query; with `search` "" this is the unfiltered index the static
 * HTML holds.
 */
export function ComponentIndex({
  entries,
  tiers,
  subStats,
  coreSlots,
  search,
}: ComponentIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  const tierNames = tiers.map((tier) => tier.name);
  const filters = parseComponentFilters(search, {
    tiers: tierNames,
    cards: entries.map((entry) => entry.slug),
  });
  const shown = filterComponents(entries, filters, tierNames);
  const set = (change: Partial<ComponentFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(componentFiltersToSearch({ ...filters, open: null })) !== "";

  // The open card's details go in a row under its card's row (`details-row.ts`).
  const columns = useGridColumns();
  const openIndex = shown.findIndex((entry) => entry.slug === filters.open);
  // `at(-1)` would be the last card: nothing open finds no index.
  const openCard = openIndex === -1 ? null : (shown.at(openIndex) ?? null);
  const detailsId = `${ids}-details`;
  const closeDetails = (slug: string) => {
    set({ open: null });
    // The details held focus; it goes back to the card that opened them.
    document.getElementById(cardId(slug))?.focus({ preventScroll: true });
  };
  const items = shown.map((entry) => (
    <li key={entry.slug}>
      <ComponentCardLink
        entry={entry}
        open={entry.slug === openCard?.slug}
        controls={detailsId}
        onToggle={() => {
          set({ open: entry.slug === openCard?.slug ? null : entry.slug });
        }}
      />
    </li>
  ));
  if (openCard !== null) {
    // Keyed by card: moving with the grid's width keeps its state, and another card
    // starts afresh.
    items.splice(
      rowEnd(openIndex, columns, shown.length) + 1,
      0,
      <li key={`details-${openCard.slug}`} className="col-span-full">
        <ComponentDetails
          id={detailsId}
          card={openCard}
          initialTier={
            openCard.pieces.some((piece) => piece.tier === filters.tier)
              ? filters.tier
              : null
          }
          subStats={subStats}
          coreSlots={coreSlots}
          onClose={() => {
            closeDetails(openCard.slug);
          }}
        />
      </li>,
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <label className="relative">
          <span className="sr-only">Search external components</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.query}
            placeholder="Search by set, piece or set effect"
            onChange={(event) => {
              set({ query: event.target.value });
            }}
            className="h-9 bg-background/60 pl-8"
          />
        </label>

        <FilterRow id={`${ids}-tier`} label="Tier">
          <ToggleGroup
            aria-labelledby={`${ids}-tier`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.tier ?? all]}
            onValueChange={(value) => {
              const next = value.at(0);
              set({ tier: next === undefined || next === all ? null : next });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {tiers.map((tier) => (
              <ToggleGroupItem
                key={tier.name}
                value={tier.name}
                className={filterChipClass}
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: tier.hex }}
                />
                {tier.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {shown.length === entries.length
            ? `${String(entries.length)} external components`
            : `${String(shown.length)} of ${String(entries.length)} external components`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters(defaultComponentFilters);
            }}
            className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden="true" className="size-4" />
            Clear filters
          </button>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground">
          No external component matches these filters.
        </p>
      ) : (
        <ul aria-label="External components" className={gridClass}>
          {items}
        </ul>
      )}
    </div>
  );
}

/**
 * A card. It is a real link to the index with the card open, so it can be copied or
 * opened in a new tab; a plain click opens or closes its details in place.
 */
function ComponentCardLink({
  entry,
  open,
  controls,
  onToggle,
}: {
  entry: ComponentCard;
  /** Whether its details are open. */
  open: boolean;
  /** The details' id, while they are open. */
  controls: string;
  onToggle: () => void;
}) {
  const top = entry.pieces.at(0);
  if (top === undefined) {
    return null;
  }
  const tiers = tiersOf(entry);
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
      href={`${indexPath}?component=${entry.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full content-start gap-3 rounded-2xl border bg-card/70 p-3 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      {/* The name comes first in the card's text, for assistive tech; the art and the
          tiers sit above it on screen. */}
      <span className="font-display text-base leading-tight font-semibold tracking-wide">
        {entry.name}
      </span>{" "}
      <span className="order-first flex flex-wrap items-start justify-between gap-2">
        <WideTile imageUrl={top.imageUrl} color={top.hex} size="md" />
        <span className="flex items-center gap-1">
          {tiers.map((tier) => (
            <span
              key={tier.name}
              aria-hidden="true"
              title={tier.name}
              className="size-2.5 rounded-full"
              style={{ backgroundColor: tier.hex }}
            />
          ))}
          <span className="sr-only">
            {tiers.map((tier) => tier.name).join(", ")},{" "}
          </span>
        </span>
      </span>{" "}
      <span className="mt-auto text-xs text-muted-foreground">
        {entry.kind === "set"
          ? `Set of ${String(entry.pieces.length)}`
          : `${String(new Set(entry.pieces.map((piece) => piece.slot)).size)} slots, ${String(tiers.length)} tiers`}
      </span>
    </a>
  );
}
