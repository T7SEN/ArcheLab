"use client";

import { Search, X } from "lucide-react";
import { useId, type MouseEvent } from "react";
import { useChangedSince, useClosing } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { sitePages } from "@/data/site-pages";
import {
  roomyGridClass,
  rowEnd,
  useGridColumns,
} from "@/features/game-data/details-row";
import {
  FilterRow,
  FilterSelect,
  filterChipClass,
} from "@/features/game-data/filter-row";
import { CardTags } from "@/features/game-data/card-tags";
import { CardItem, DetailsRowItem } from "@/features/game-data/grid-items";
import {
  urlSearchOf,
  useSearch,
  writeSearch,
} from "@/features/game-data/url-query";
import { WideTile } from "@/features/game-data/wide-tile";
import { slugOf } from "@/lib/slug";
import { CoreDetails, coreColor } from "./core-details";
import {
  coreEquipment,
  coreFiltersToSearch,
  coreWeaponTypes,
  defaultCoreFilters,
  filterCores,
  parseCoreFilters,
  rollNames,
  shownVersions,
  shownWeapons,
  type CoreFilters,
  type CoreKind,
} from "./core-filters";
import { EquipmentBadge } from "./equipment-badge";

const all = "all";

/** The page's address with a query, for a card's link. */
const indexPath = "/cores";

function writeFilters(filters: CoreFilters): void {
  writeSearch(coreFiltersToSearch(filters));
}

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `core-card-${slug}`;

interface CoreIndexProps {
  entries: readonly CoreKind[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function CoreIndexFromUrl(props: CoreIndexProps) {
  return <CoreIndex {...props} search={useSearch()} />;
}

/**
 * Every kind of core, with what it goes in, a weapon type and a search (T7SEN,
 * 2026-10-18; ADR 0044). A card opens its rolls by grade, where it drops and what takes
 * it in a row under its own. Eight cards, all drawn at once. The filters and the open
 * card live in the URL query; with `search` "" this is the unfiltered index the static
 * HTML holds.
 */
export function CoreIndex({
  entries,
  search,
}: CoreIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  // Cards a filter brings in fade in; the first render doesn't (ADR 0030).
  const enter = useChangedSince(search);
  const weaponTypes = coreWeaponTypes(entries);
  const filters = parseCoreFilters(search, {
    weaponTypes: weaponTypes.map(slugOf),
    kinds: entries.map((entry) => entry.slug),
  });
  const shown = filterCores(entries, filters);
  const set = (change: Partial<CoreFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(coreFiltersToSearch({ ...filters, open: null })) !== "";

  // The open card's details go in a row under its card's row (`details-row.ts`), in
  // the roomier grid: each card lists its rolls.
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
      <CoreCardLink
        entry={entry}
        weaponType={filters.weaponType}
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
        <CoreDetails
          id={detailsId}
          kind={detailsCard}
          weaponType={filters.weaponType}
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
          <span className="sr-only">Search cores</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.query}
            placeholder="Search by name, roll, weapon or place"
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
            value={[filters.equipment ?? all]}
            onValueChange={(value) => {
              const next =
                coreEquipment.find((entry) => entry.equipment === value.at(0))
                  ?.equipment ?? null;
              // External components take no weapon type's cores.
              set(
                next === "components"
                  ? { equipment: next, weaponType: null }
                  : { equipment: next },
              );
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {coreEquipment.map((entry) => {
              // Each choice wears its index's icon from the navbar.
              const Icon = sitePages.find(
                (page) => page.href === entry.href,
              )?.icon;
              return (
                <ToggleGroupItem
                  key={entry.equipment}
                  value={entry.equipment}
                  className={filterChipClass}
                >
                  {Icon === undefined ? null : <Icon aria-hidden="true" />}
                  {entry.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </FilterRow>

        {/* Half the panel's width on wide screens, as the Modules and Cosmetics
            dropdowns sit. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <FilterSelect
            id={`${ids}-type`}
            label="Weapon type"
            items={[
              { value: all, label: "All weapon types" },
              ...weaponTypes.map((type) => ({
                value: slugOf(type),
                label: type,
              })),
            ]}
            value={filters.weaponType ?? all}
            onChange={(value) => {
              const next = value === all ? null : value;
              set(
                next !== null && filters.equipment === "components"
                  ? { weaponType: next, equipment: null }
                  : { weaponType: next },
              );
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {shown.length === entries.length
            ? `${String(entries.length)} cores`
            : `${String(shown.length)} of ${String(entries.length)} cores`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters(defaultCoreFilters);
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
          No core matches these filters.
        </p>
      ) : (
        <ul aria-label="Cores" className={roomyGridClass}>
          {items}
        </ul>
      )}
    </div>
  );
}

/**
 * A core kind's card. It is a real link to the index with the kind open, so it can be
 * copied or opened in a new tab; a plain click opens or closes its details in place.
 */
function CoreCardLink({
  entry,
  weaponType,
  open,
  controls,
  onToggle,
}: {
  entry: CoreKind;
  /** The weapon type filter's slug: the card shows what it rolls on that type. */
  weaponType: string | null;
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
  const rolls = rollNames(shownVersions(entry, weaponType));
  const weapons = shownWeapons(entry, weaponType).length;

  return (
    <a
      id={cardId(entry.slug)}
      href={`${indexPath}?core=${entry.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group flex h-full min-w-0 flex-col gap-3 rounded-2xl border bg-card/70 p-3.5 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      {/* The art, then the name and what it goes in. */}
      <span className="flex min-w-0 items-center gap-3">
        <WideTile imageUrl={entry.imageUrl} color={coreColor} size="sm" />
        <span className="grid min-w-0 justify-items-start gap-1.5">
          <span className="font-display text-base leading-tight font-semibold tracking-wide break-words">
            {entry.name}
          </span>{" "}
          <EquipmentBadge equipment={entry.equipment} />
        </span>
      </span>{" "}
      {/* What it can roll, each name once across its versions. */}
      <CardTags label="Can roll" tags={rolls} />{" "}
      <span className="mt-auto text-xs text-muted-foreground">
        {entry.equipment === "weapons"
          ? `Fits ${String(weapons)} Ultimate weapon${weapons === 1 ? "" : "s"}`
          : `Fits ${String(entry.componentCards.length)} Ultimate external component${entry.componentCards.length === 1 ? "" : "s"}`}
      </span>
    </a>
  );
}
