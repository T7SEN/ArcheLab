"use client";

import { Search, X } from "lucide-react";
import { useId, type MouseEvent } from "react";
import { useChangedSince, useClosing } from "@/components/motion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cosmeticTypeName } from "@/data/cosmetics";
import {
  batchesThrough,
  cardBatch,
  drawnCount,
} from "@/features/game-data/card-batches";
import {
  gridClass,
  rowEnd,
  useGridColumns,
} from "@/features/game-data/details-row";
import {
  FilterRow,
  FilterSelect,
  filterChipClass,
} from "@/features/game-data/filter-row";
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
import { slugOf } from "@/lib/slug";
import {
  CosmeticArt,
  CosmeticDetails,
  TierBadge,
  untieredColor,
} from "./cosmetic-details";
import {
  cardDescendants,
  cosmeticFiltersToSearch,
  defaultCosmeticFilters,
  filterCosmetics,
  parseCosmeticFilters,
  shownVersion,
  type CosmeticCard,
  type CosmeticDescendant,
  type CosmeticFilters,
  type CosmeticSort,
  type CosmeticTier,
  type CosmeticTypeOption,
} from "./cosmetic-filters";

const all = "all";

/** The page's address with a query, for a card's link. */
const indexPath = "/cosmetics";

const sorts: readonly { value: CosmeticSort; label: string }[] = [
  { value: "tier", label: "Highest tier" },
  { value: "az", label: "A–Z" },
];

/** Counts with a thousands separator: "1,293 cosmetics". */
const count = new Intl.NumberFormat("en-US");

function writeFilters(filters: CosmeticFilters): void {
  writeSearch(cosmeticFiltersToSearch(filters));
}

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `cosmetic-card-${slug}`;

interface CosmeticIndexProps {
  entries: readonly CosmeticCard[];
  /** Highest first. */
  tiers: readonly CosmeticTier[];
  types: readonly CosmeticTypeOption[];
  /** By name, each Ultimate after its base. */
  descendants: readonly CosmeticDescendant[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function CosmeticIndexFromUrl(props: CosmeticIndexProps) {
  return <CosmeticIndex {...props} search={useSearch()} />;
}

/**
 * Every cosmetic, one card per cosmetic, with filters by type, tier and Descendant, a
 * search and an order (T7SEN, 2026-10-17; ADR 0039). A card opens its versions and who
 * can use them in a row under its own; cards come in batches as the page nears the last
 * one drawn, as on the modules index (ADR 0031). The filters and the open cosmetic live
 * in the URL query; with `search` "" this is the unfiltered index the static HTML holds.
 */
export function CosmeticIndex({
  entries,
  tiers,
  types,
  descendants,
  search,
}: CosmeticIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  // Cards a filter brings in fade in; the first render doesn't (ADR 0030).
  const enter = useChangedSince(search);
  const filters = parseCosmeticFilters(search, {
    types: types.map((type) => type.slug),
    tiers: tiers.map((tier) => slugOf(tier.name)),
    descendants: descendants.map((descendant) => descendant.slug),
    cosmetics: entries.map((entry) => entry.slug),
  });
  const shown = filterCosmetics(entries, filters, { tiers, descendants });
  const set = (change: Partial<CosmeticFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  const tierOf = (id: string | null) =>
    tiers.find((tier) => tier.id === id) ?? null;
  const names = new Map(
    descendants.map((descendant) => [descendant.slug, descendant]),
  );
  // A blank search filters nothing, so it alone offers no "Clear filters"; neither
  // does the order.
  const filtered =
    urlSearchOf(
      cosmeticFiltersToSearch({ ...filters, sort: "tier", open: null }),
    ) !== "";

  // The open cosmetic's details go in a row under its card's row (`details-row.ts`).
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
  // A batch of cards at first, and more as the page nears the last one drawn (ADR
  // 0031). New filters start again from one batch; the open card is always drawn.
  const [batches, more] = useCardBatches(
    urlSearchOf(cosmeticFiltersToSearch({ ...filters, open: null })),
    batchesThrough(openIndex),
  );
  const drawn = shown.slice(0, drawnCount(batches, shown.length));
  const items = drawn.map((entry, index) => (
    // Cards a later batch draws fade in too.
    <CardItem key={entry.slug} enter={enter || index >= cardBatch}>
      <CosmeticCardLink
        entry={entry}
        tier={tierOf(entry.tier)}
        names={names}
        descendant={filters.descendant}
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
        <CosmeticDetails
          id={detailsId}
          card={detailsCard}
          tier={tierOf(detailsCard.tier)}
          descendants={names}
          descendant={filters.descendant}
          onClose={() => {
            closeDetails(detailsCard.slug);
          }}
        />
      </DetailsRowItem>,
    );
  }

  const descendantItems = [
    { value: all, label: "All Descendants" },
    ...descendants.map((descendant) => ({
      value: descendant.slug,
      label: descendant.name,
    })),
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">Search cosmetics</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={filters.query}
              placeholder="Search by name, type or Descendant"
              onChange={(event) => {
                set({ query: event.target.value });
              }}
              className="h-9 bg-background/60 pl-8"
            />
          </label>
          <span id={`${ids}-sort`} className="sr-only">
            Order
          </span>
          <Select
            items={sorts}
            value={filters.sort}
            onValueChange={(value) => {
              set({ sort: value === "az" ? "az" : "tier" });
            }}
          >
            <SelectTrigger
              aria-labelledby={`${ids}-sort`}
              className="h-9 min-w-36 bg-background/60"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorts.map((sort) => (
                <SelectItem key={sort.value} value={sort.value}>
                  {sort.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FilterRow id={`${ids}-type`} label="Type">
          <ToggleGroup
            aria-labelledby={`${ids}-type`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.type ?? all]}
            onValueChange={(value) => {
              const next = value.at(0);
              set({ type: next === undefined || next === all ? null : next });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {types.map((type) => (
              <ToggleGroupItem
                key={type.slug}
                value={type.slug}
                className={filterChipClass}
              >
                {type.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>

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

        <div className="grid gap-3 sm:grid-cols-2">
          <FilterSelect
            id={`${ids}-descendant`}
            label="Descendant"
            items={descendantItems}
            value={filters.descendant ?? all}
            onChange={(value) => {
              set({ descendant: value === all ? null : value });
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {shown.length === entries.length
            ? `${count.format(entries.length)} cosmetics`
            : `${count.format(shown.length)} of ${count.format(entries.length)} cosmetics`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters({ ...defaultCosmeticFilters, sort: filters.sort });
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
          No cosmetic matches these filters.
        </p>
      ) : (
        <>
          <ul aria-label="Cosmetics" className={gridClass}>
            {items}
          </ul>
          <MoreCards
            drawn={drawn.length}
            total={shown.length}
            noun="cosmetics"
            onMore={more}
          />
        </>
      )}
    </div>
  );
}

/**
 * Who a card is for, in a few words: "Every Descendant", one or two names, or how many
 * Descendants its versions name.
 */
function whoFor(
  card: CosmeticCard,
  names: ReadonlyMap<string, CosmeticDescendant>,
): string {
  if (card.everyone) {
    return "Every Descendant";
  }
  const named = cardDescendants(card).flatMap((slug) => {
    const descendant = names.get(slug);
    return descendant === undefined ? [] : [descendant.name];
  });
  if (named.length === 0) {
    return "";
  }
  return named.length <= 2
    ? named.join(", ")
    : `${String(named.length)} Descendants`;
}

/**
 * A cosmetic's card. It is a real link to the index with the cosmetic open, so it can be
 * copied or opened in a new tab; a plain click opens or closes its details in place.
 * It is not a Next.js Link: hundreds of links to this same page would each be
 * prefetched. With a Descendant filter on, it shows that Descendant's version.
 */
function CosmeticCardLink({
  entry,
  tier,
  names,
  descendant,
  open,
  controls,
  onToggle,
}: {
  entry: CosmeticCard;
  tier: CosmeticTier | null;
  names: ReadonlyMap<string, CosmeticDescendant>;
  /** The Descendant the index is filtered by. */
  descendant: string | null;
  /** Whether its details are open. */
  open: boolean;
  /** The details' id, while they are open. */
  controls: string;
  onToggle: () => void;
}) {
  const version = shownVersion(entry, descendant);
  const who = whoFor(entry, names);
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
      href={`${indexPath}?cosmetic=${entry.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full content-start gap-2 rounded-2xl border bg-card/70 p-2.5 transition-colors outline-none [contain-intrinsic-size:auto_14rem] [content-visibility:auto] hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      {/* The name comes first in the card's text, for assistive tech; the art sits
          above it on screen. */}
      <span className="px-0.5 font-display text-base leading-tight font-semibold tracking-wide">
        {entry.name}
      </span>{" "}
      <span className="order-first">
        <CosmeticArt
          imageUrl={version.imageUrl}
          color={tier?.hex ?? untieredColor}
          size="card"
        />
      </span>{" "}
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5 text-xs text-muted-foreground">
        {tier === null ? null : <TierBadge tier={tier} />}
        <span>{cosmeticTypeName(entry.type)}</span>
      </span>{" "}
      <span className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-0.5 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{who}</span>
        {entry.versions.length > 1 ? (
          <span className="whitespace-nowrap">
            {`${String(entry.versions.length)} versions`}
          </span>
        ) : version.stages.length > 0 ? (
          <span className="whitespace-nowrap">
            {`${String(version.stages.length)} stages`}
          </span>
        ) : null}
      </span>
    </a>
  );
}
