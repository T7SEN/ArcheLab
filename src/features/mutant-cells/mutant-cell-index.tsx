"use client";

import { Search, X } from "lucide-react";
import { useId, type MouseEvent } from "react";
import { useChangedSince, useClosing } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { mutantCellSockets } from "@/data/mutant-cells";
import { batchesThrough, drawnCount } from "@/features/game-data/card-batches";
import {
  gridClass,
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
import { SocketIcon } from "@/features/modules/fact-icons";
import {
  CellTile,
  MutantCellDetails,
  SocketLabel,
} from "./mutant-cell-details";
import {
  defaultMutantCellFilters,
  filterMutantCells,
  mutantCellBatch,
  mutantCellFiltersToSearch,
  parseMutantCellFilters,
  type MutantCellCard,
  type MutantCellFilters,
} from "./mutant-cell-filters";

const all = "all";

/** The page's address with a query, for a card's link. */
const indexPath = "/mutant-cells";

function writeFilters(filters: MutantCellFilters): void {
  writeSearch(mutantCellFiltersToSearch(filters));
}

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `mutant-cell-card-${slug}`;

interface MutantCellIndexProps {
  entries: readonly MutantCellCard[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function MutantCellIndexFromUrl(props: MutantCellIndexProps) {
  return <MutantCellIndex {...props} search={useSearch()} />;
}

/**
 * Every Mutant Cell, with a socket filter and a search (T7SEN, 2026-10-17; ADR 0038). A
 * card opens the cell's effects in a row under its own; cards come in batches as the
 * page nears the last one drawn, as on the modules index (ADR 0031). The filters and
 * the open cell live in the URL query; with `search` "" this is the unfiltered index the
 * static HTML holds.
 */
export function MutantCellIndex({
  entries,
  search,
}: MutantCellIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  // Cards a filter brings in fade in; the first render doesn't (ADR 0030).
  const enter = useChangedSince(search);
  const filters = parseMutantCellFilters(
    search,
    entries.map((entry) => entry.slug),
  );
  const shown = filterMutantCells(entries, filters);
  const set = (change: Partial<MutantCellFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(mutantCellFiltersToSearch({ ...filters, open: null })) !== "";

  // The open cell's details go in a row under its card's row (`details-row.ts`).
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
  // A batch of cards at first, and more as the page nears the last one drawn, as on
  // the modules index (T7SEN, 2026-10-17; ADR 0031), in smaller batches
  // (`mutantCellBatch`). New filters start again from one batch; the open card is always
  // drawn.
  const [batches, more] = useCardBatches(
    urlSearchOf(mutantCellFiltersToSearch({ ...filters, open: null })),
    batchesThrough(openIndex, mutantCellBatch),
  );
  const drawn = shown.slice(
    0,
    drawnCount(batches, shown.length, mutantCellBatch),
  );
  const items = drawn.map((entry, index) => (
    // Cards a later batch draws fade in too.
    <CardItem key={entry.slug} enter={enter || index >= mutantCellBatch}>
      <MutantCellCardLink
        entry={entry}
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
        <MutantCellDetails
          id={detailsId}
          card={detailsCard}
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
          <span className="sr-only">Search Mutant Cells</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.query}
            placeholder="Search by name, trigger or effect"
            onChange={(event) => {
              set({ query: event.target.value });
            }}
            className="h-9 bg-background/60 pl-8"
          />
        </label>

        <FilterRow id={`${ids}-socket`} label="Socket">
          <ToggleGroup
            aria-labelledby={`${ids}-socket`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.socket ?? all]}
            onValueChange={(value) => {
              const next = value.at(0);
              set({ socket: next === undefined || next === all ? null : next });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {mutantCellSockets.map((socket) => (
              <ToggleGroupItem
                key={socket}
                value={socket}
                className={filterChipClass}
              >
                <SocketIcon socket={socket} />
                {socket}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {shown.length === entries.length
            ? `${String(entries.length)} Mutant Cells`
            : `${String(shown.length)} of ${String(entries.length)} Mutant Cells`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters(defaultMutantCellFilters);
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
          No Mutant Cell matches these filters.
        </p>
      ) : (
        <>
          <ul aria-label="Mutant Cells" className={gridClass}>
            {items}
          </ul>
          <MoreCards
            drawn={drawn.length}
            total={shown.length}
            noun="Mutant Cells"
            onMore={more}
          />
        </>
      )}
    </div>
  );
}

/**
 * A cell's card. It is a real link to the index with the cell open, so it can be
 * copied or opened in a new tab; a plain click opens or closes its details in place.
 */
function MutantCellCardLink({
  entry,
  open,
  controls,
  onToggle,
}: {
  entry: MutantCellCard;
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
      href={`${indexPath}?cell=${entry.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full content-start gap-3 rounded-2xl border bg-card/70 p-3 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      {/* The name comes first in the card's text, for assistive tech; the icon and the
          socket sit above it on screen. */}
      <span className="font-display text-base leading-tight font-semibold tracking-wide">
        {entry.name}
      </span>{" "}
      <span className="order-first flex items-start justify-between gap-2">
        <CellTile card={entry} size="md" />
        <span className="text-xs text-muted-foreground">
          <SocketLabel socket={entry.socket} />
        </span>
      </span>{" "}
      <span className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
        {entry.description}
      </span>
    </a>
  );
}
