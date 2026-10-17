"use client";

import { Search, X } from "lucide-react";
import { useId, type MouseEvent } from "react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArcheIcon, ElementIcon } from "@/features/descendants/type-icons";
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
import { ReactorDetails, ReactorTypes } from "./reactor-details";
import {
  defaultReactorFilters,
  filterReactors,
  parseReactorFilters,
  reactorFiltersToSearch,
  type ReactorCard,
  type ReactorFilters,
} from "./reactor-filters";

const all = "all";

/** The page's address, for a card's link. */
const indexPath = "/reactors";

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `reactor-card-${slug}`;

function writeFilters(filters: ReactorFilters): void {
  writeSearch(reactorFiltersToSearch(filters));
}

interface ReactorIndexProps {
  entries: readonly ReactorCard[];
  /** The attributes the filter offers, in display order. */
  attributes: readonly string[];
  /** Each attribute's icon, by name. */
  attributeIcons: Readonly<Record<string, string>>;
  archeTypes: readonly string[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function ReactorIndexFromUrl(props: ReactorIndexProps) {
  return <ReactorIndex {...props} search={useSearch()} />;
}

/**
 * Every reactor, one card per name, with filters by attribute and Arche type and a
 * search (ADR 0026). A card opens the reactor's details in a row under its own row.
 * The filters and the open reactor live in the URL query; with `search` "" this is the
 * unfiltered index the static HTML holds.
 */
export function ReactorIndex({
  entries,
  attributes,
  attributeIcons,
  archeTypes,
  search,
}: ReactorIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  const filters = parseReactorFilters(search, {
    attributes,
    archeTypes,
    reactors: entries.map((entry) => entry.slug),
  });
  const shown = filterReactors(entries, filters);
  const set = (change: Partial<ReactorFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  const pick = (value: readonly string[]): string | null => {
    const next = value.at(0);
    return next === undefined || next === all ? null : next;
  };
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(reactorFiltersToSearch({ ...filters, open: null })) !== "";

  // The open reactor's details go in a row under its card's row (`details-row.ts`).
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
      <ReactorCardLink
        entry={entry}
        attributeIcons={attributeIcons}
        open={entry.slug === openCard?.slug}
        controls={detailsId}
        onToggle={() => {
          set({ open: entry.slug === openCard?.slug ? null : entry.slug });
        }}
      />
    </li>
  ));
  if (openCard !== null) {
    // Keyed by reactor: moving with the grid's width keeps its state, and another
    // reactor starts afresh.
    items.splice(
      rowEnd(openIndex, columns, shown.length) + 1,
      0,
      <li key={`details-${openCard.slug}`} className="col-span-full">
        <ReactorDetails
          id={detailsId}
          card={openCard}
          attributeIcons={attributeIcons}
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
          <span className="sr-only">Search reactors</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.query}
            placeholder="Search by name, attribute or Arche type"
            onChange={(event) => {
              set({ query: event.target.value });
            }}
            className="h-9 bg-background/60 pl-8"
          />
        </label>

        <FilterRow id={`${ids}-attribute`} label="Attribute">
          <ToggleGroup
            aria-labelledby={`${ids}-attribute`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.attribute ?? all]}
            onValueChange={(value) => {
              set({ attribute: pick(value) });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {attributes.map((attribute) => (
              <ToggleGroupItem
                key={attribute}
                value={attribute}
                className={filterChipClass}
              >
                <ElementIcon url={attributeIcons[attribute]} />
                {attribute}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>

        <FilterRow id={`${ids}-type`} label="Arche type">
          <ToggleGroup
            aria-labelledby={`${ids}-type`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.archeType ?? all]}
            onValueChange={(value) => {
              set({ archeType: pick(value) });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {archeTypes.map((archeType) => (
              <ToggleGroupItem
                key={archeType}
                value={archeType}
                className={filterChipClass}
              >
                <ArcheIcon archeType={archeType} />
                {archeType}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {shown.length === entries.length
            ? `${String(entries.length)} reactors`
            : `${String(shown.length)} of ${String(entries.length)} reactors`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters(defaultReactorFilters);
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
          No reactor matches these filters.
        </p>
      ) : (
        <ul aria-label="Reactors" className={gridClass}>
          {items}
        </ul>
      )}
    </div>
  );
}

/**
 * A reactor's card. It is a real link to the index with the reactor open, so it can be
 * copied or opened in a new tab; a plain click opens or closes its details in place.
 */
function ReactorCardLink({
  entry,
  attributeIcons,
  open,
  controls,
  onToggle,
}: {
  entry: ReactorCard;
  attributeIcons: Readonly<Record<string, string>>;
  /** Whether its details are open. */
  open: boolean;
  /** The details' id, while they are open. */
  controls: string;
  onToggle: () => void;
}) {
  const top = entry.tiers.at(0);
  if (top === undefined) {
    return null;
  }
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
      href={`${indexPath}?reactor=${entry.slug}`}
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
          {entry.tiers.map((tier) => (
            <span
              key={tier.id}
              aria-hidden="true"
              title={tier.name}
              className="size-2.5 rounded-full"
              style={{ backgroundColor: tier.hex }}
            />
          ))}
          <span className="sr-only">
            {entry.tiers.map((tier) => tier.name).join(", ")},{" "}
          </span>
        </span>
      </span>{" "}
      <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <ReactorTypes card={entry} attributeIcons={attributeIcons} />
      </span>
    </a>
  );
}
