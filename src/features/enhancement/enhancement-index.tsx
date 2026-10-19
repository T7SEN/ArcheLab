"use client";

import { Search, X } from "lucide-react";
import { useId, type MouseEvent } from "react";
import { useChangedSince, useClosing } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TierBadge } from "@/features/cosmetics/cosmetic-details";
import type { CosmeticTier } from "@/features/cosmetics/cosmetic-filters";
import {
  roomyGridClass,
  rowEnd,
  useGridColumns,
} from "@/features/game-data/details-row";
import { CardText } from "@/features/game-data/card-tags";
import { FilterRow, filterChipClass } from "@/features/game-data/filter-row";
import { CardItem, DetailsRowItem } from "@/features/game-data/grid-items";
import {
  urlSearchOf,
  useSearch,
  writeSearch,
} from "@/features/game-data/url-query";
import { WideTile } from "@/features/game-data/wide-tile";
import { LoadFailed } from "@/features/game-data/load-failed";
import { slugOf } from "@/lib/slug";
import { EnhancementDetails, materialColor } from "./enhancement-details";
import {
  defaultEnhancementFilters,
  enhancementFiltersToSearch,
  filterEnhancement,
  parseEnhancementFilters,
  type EnhancementFilters,
  type EnhancementMaterial,
} from "./enhancement-filters";

const all = "all";

/** The page's address with a query, for a card's link. */
const indexPath = "/enhancement-materials";

function writeFilters(filters: EnhancementFilters): void {
  writeSearch(enhancementFiltersToSearch(filters));
}

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `material-card-${slug}`;

interface EnhancementIndexProps {
  entries: readonly EnhancementMaterial[];
  /** Highest first, with their rarity names and colors. */
  tiers: readonly CosmeticTier[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function EnhancementIndexFromUrl(props: EnhancementIndexProps) {
  return <EnhancementIndex {...props} search={useSearch()} />;
}

/**
 * Every enhancement material, with a tier filter and a search (T7SEN, 2026-10-17; ADR
 * 0043). A card opens its description and every way to research it in a row under its
 * own. 23 items, all drawn at once. The filters and the open item live in the URL query;
 * with `search` "" this is the unfiltered index the static HTML holds.
 */
export function EnhancementIndex({
  entries,
  tiers,
  search,
}: EnhancementIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  // Cards a filter brings in fade in; the first render doesn't (ADR 0030).
  const enter = useChangedSince(search);
  const filters = parseEnhancementFilters(search, {
    tiers: tiers.map((tier) => slugOf(tier.name)),
    materials: entries.map((entry) => entry.slug),
  });
  const shown = filterEnhancement(entries, filters, tiers);
  const set = (change: Partial<EnhancementFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  const tierOf = (id: string | null) =>
    tiers.find((tier) => tier.id === id) ?? null;
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(enhancementFiltersToSearch({ ...filters, open: null })) !== "";

  // The open item's details go in a row under its card's row (`details-row.ts`), in
  // the roomier grid: each card carries its description.
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
  const items = shown.map((entry) => (
    <CardItem key={entry.slug} enter={enter}>
      <MaterialCardLink
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
      : shown.findIndex((entry) => entry.slug === detailsCard.slug);
  if (closing && detailsIndex === -1) {
    closed();
  }
  if (detailsCard !== null && detailsIndex !== -1) {
    items.splice(
      rowEnd(detailsIndex, columns, shown.length) + 1,
      0,
      <DetailsRowItem
        key={`details-${detailsCard.slug}`}
        closing={closing}
        onClosed={closed}
      >
        <EnhancementDetails
          id={detailsId}
          item={detailsCard}
          tier={tierOf(detailsCard.tier)}
          onClose={() => {
            closeDetails(detailsCard.slug);
          }}
        />
      </DetailsRowItem>,
    );
  }

  // The data couldn't load: the hero says so, and this says it once more instead of
  // empty filters and "No … matches these filters."
  if (entries.length === 0) {
    return <LoadFailed what="Enhancement Materials" />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <label className="relative">
          <span className="sr-only">Search Enhancement Materials</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.query}
            placeholder="Search by name, use or ingredient"
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
                key={tier.id}
                value={slugOf(tier.name)}
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
            ? `${String(entries.length)} Enhancement Materials`
            : `${String(shown.length)} of ${String(entries.length)} Enhancement Materials`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters(defaultEnhancementFilters);
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
          No Enhancement Material matches these filters.
        </p>
      ) : (
        <ul aria-label="Enhancement Materials" className={roomyGridClass}>
          {items}
        </ul>
      )}
    </div>
  );
}

/**
 * An item's card. It is a real link to the index with the item open, so it can be
 * copied or opened in a new tab; a plain click opens or closes its details in place.
 */
function MaterialCardLink({
  entry,
  tier,
  open,
  controls,
  onToggle,
}: {
  entry: EnhancementMaterial;
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
      href={`${indexPath}?material=${entry.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full grid-cols-[minmax(0,1fr)] content-start gap-3 rounded-2xl border bg-card/70 p-3.5 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      {/* The art in its tier's color, then the name and the tier. */}
      <span className="flex min-w-0 items-center gap-3">
        <WideTile
          imageUrl={entry.imageUrl}
          color={tier?.hex ?? materialColor}
          size="sm"
        />
        <span className="grid min-w-0 justify-items-start gap-1.5">
          <span className="font-display text-base leading-tight font-semibold tracking-wide break-words">
            {entry.name}
          </span>{" "}
          {tier === null ? null : <TierBadge tier={tier} />}
        </span>
      </span>{" "}
      {entry.description === "" ? null : (
        <CardText>{entry.description}</CardText>
      )}{" "}
      {entry.recipes.length > 1 ? (
        <span className="mt-auto text-xs text-muted-foreground">
          {`${String(entry.recipes.length)} ways to research it`}
        </span>
      ) : null}
    </a>
  );
}
