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
import { BasicDetails, basicColor, kindIcon } from "./basic-details";
import {
  basicFiltersToSearch,
  defaultBasicFilters,
  filterBasic,
  parseBasicFilters,
  useKinds,
  usesSummary,
  type BasicFilters,
  type BasicMaterial,
} from "./basic-filters";

const all = "all";

/** The page's address with a query, for a card's link. */
const indexPath = "/basic-materials";

function writeFilters(filters: BasicFilters): void {
  writeSearch(basicFiltersToSearch(filters));
}

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `basic-card-${slug}`;

interface BasicIndexProps {
  entries: readonly BasicMaterial[];
  /** Highest first, with their rarity names and colors. */
  tiers: readonly CosmeticTier[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function BasicIndexFromUrl(props: BasicIndexProps) {
  return <BasicIndex {...props} search={useSearch()} />;
}

/**
 * Every basic material, with a tier filter, a filter by what a material goes into (like
 * the Amorphous Materials' For filter) and a search (T7SEN, 2026-10-18; ADR 0045). A card
 * opens its details in a row under its own. 65 materials, all drawn at once. The filters
 * and the open material live in the URL query; with `search` "" this is the unfiltered
 * index the static HTML holds.
 */
export function BasicIndex({
  entries,
  tiers,
  search,
}: BasicIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  // Cards a filter brings in fade in; the first render doesn't (ADR 0030).
  const enter = useChangedSince(search);
  const filters = parseBasicFilters(search, {
    tiers: tiers.map((tier) => slugOf(tier.name)),
    materials: entries.map((entry) => entry.slug),
  });
  const shown = filterBasic(entries, filters, tiers);
  const set = (change: Partial<BasicFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  const tierOf = (id: string) => tiers.find((tier) => tier.id === id) ?? null;
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(basicFiltersToSearch({ ...filters, open: null })) !== "";

  // The open material's details go in a row under its card's row (`details-row.ts`).
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
      <BasicCardLink
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
        <BasicDetails
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
    return <LoadFailed what="Basic Materials" />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <label className="relative">
          <span className="sr-only">Search Basic Materials</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.query}
            placeholder="Search by name, use or place"
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

        <FilterRow id={`${ids}-for`} label="For">
          <ToggleGroup
            aria-labelledby={`${ids}-for`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.kind ?? all]}
            onValueChange={(value) => {
              const next = useKinds.find((entry) => entry.kind === value.at(0));
              set({ kind: next?.kind ?? null });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {useKinds.map((entry) => {
              // Each kind wears its index's icon from the navbar.
              const Icon = kindIcon(entry.href);
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
            ? `${String(entries.length)} Basic Materials`
            : `${String(shown.length)} of ${String(entries.length)} Basic Materials`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters(defaultBasicFilters);
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
          No Basic Material matches these filters.
        </p>
      ) : (
        <ul aria-label="Basic Materials" className={roomyGridClass}>
          {items}
        </ul>
      )}
    </div>
  );
}

/**
 * A material's card. It is a real link to the index with the material open, so it can
 * be copied or opened in a new tab; a plain click opens or closes its details in place.
 */
function BasicCardLink({
  entry,
  tier,
  open,
  controls,
  onToggle,
}: {
  entry: BasicMaterial;
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
  const summary = usesSummary(entry.uses);

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
          color={tier?.hex ?? basicColor}
          size="sm"
        />
        <span className="grid min-w-0 justify-items-start gap-1.5">
          <span className="font-display text-base leading-tight font-semibold tracking-wide break-words">
            {entry.name}
          </span>{" "}
          {tier === null ? null : <TierBadge tier={tier} />}
        </span>
      </span>{" "}
      {/* What it goes into; one that goes into no research says what it is for. */}
      <CardText>
        {summary === "" ? entry.description : `For ${summary}`}
      </CardText>
    </a>
  );
}
