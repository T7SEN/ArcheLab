"use client";

import { Search, X } from "lucide-react";
import { useId, useSyncExternalStore, type MouseEvent } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FilterRow, filterChipClass } from "@/features/game-data/filter-row";
import {
  urlSearchOf,
  useSearch,
  writeSearch,
} from "@/features/game-data/url-query";
import { CategoryIcon, SlotIcon, SocketIcon } from "./fact-icons";
import {
  defaultModuleFilters,
  filterModules,
  matchingVariants,
  moduleFiltersToSearch,
  parseModuleFilters,
  shownType,
  type ModuleCard,
  type ModuleFilters,
} from "./module-filters";
import { baseColumns, gridClass, gridColumns, rowEnd } from "./details-row";
import { ModuleDetails, ModuleTile } from "./module-details";

/** A tier the filter offers, with its rarity color from the chat registry. */
export interface TierOption {
  readonly name: string;
  readonly hex: string;
}

/** What the filters offer, in display order. */
export interface ModuleIndexOptions {
  /** Highest tier first. */
  readonly tiers: readonly TierOption[];
  readonly sockets: readonly string[];
  readonly categories: readonly string[];
  readonly types: readonly string[];
  readonly slots: readonly string[];
  /** The Descendants with modules of their own, A–Z. */
  readonly owners: readonly { readonly slug: string; readonly name: string }[];
}

const sorts = [
  { value: "tier", label: "Highest tier" },
  { value: "az", label: "A–Z" },
];

const all = "all";

/** The page's address with a query, for a card's link. */
const indexPath = "/modules";

function writeFilters(filters: ModuleFilters): void {
  writeSearch(moduleFiltersToSearch(filters));
}

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `module-card-${slug}`;

function subscribeColumns(onChange: () => void): () => void {
  const lists = gridColumns.map((entry) => window.matchMedia(entry.query));
  for (const list of lists) {
    list.addEventListener("change", onChange);
  }
  return () => {
    for (const list of lists) {
      list.removeEventListener("change", onChange);
    }
  };
}

function readColumns(): number {
  return (
    gridColumns.find((entry) => window.matchMedia(entry.query).matches)
      ?.columns ?? baseColumns
  );
}

interface ModuleIndexProps {
  entries: readonly ModuleCard[];
  options: ModuleIndexOptions;
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function ModuleIndexFromUrl(props: ModuleIndexProps) {
  return <ModuleIndex {...props} search={useSearch()} />;
}

/**
 * Every module, one card per name, with filters by tier, socket, class, slot, type and
 * the Descendant who can equip it, a name search and two orders (ADR 0025). A card
 * opens the module's details in a side panel. The filters and the open module live in
 * the URL query; with `search` "" this is the unfiltered index the static HTML holds.
 */
export function ModuleIndex({
  entries,
  options,
  search,
}: ModuleIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  const tierNames = options.tiers.map((tier) => tier.name);
  const filters = parseModuleFilters(search, {
    tiers: tierNames,
    sockets: options.sockets,
    categories: options.categories,
    types: options.types,
    slots: options.slots,
    owners: options.owners.map((owner) => owner.slug),
    modules: entries.map((entry) => entry.slug),
  });
  const shown = filterModules(entries, filters, tierNames);
  const colors = new Map(options.tiers.map((tier) => [tier.name, tier.hex]));
  const colorOf = (tier: string) => colors.get(tier) ?? "var(--primary)";
  const set = (change: Partial<ModuleFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  const pick = (value: readonly string[]): string | null => {
    const next = value.at(0);
    return next === undefined || next === all ? null : next;
  };
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(
      moduleFiltersToSearch({ ...filters, sort: "tier", open: null }),
    ) !== "";

  // The open module's details go in a row under its card's row, so the grid needs its
  // column count, which CSS sets by width (`details-row.ts`).
  const columns = useSyncExternalStore(
    subscribeColumns,
    readColumns,
    () => baseColumns,
  );
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
      <ModuleCardLink
        entry={entry}
        tiers={tierNames}
        colorOf={colorOf}
        open={entry.slug === openCard?.slug}
        controls={detailsId}
        onToggle={() => {
          set({ open: entry.slug === openCard?.slug ? null : entry.slug });
        }}
      />
    </li>
  ));
  if (openCard !== null) {
    // Keyed by module: moving with the grid's width keeps its state, and another module
    // starts afresh.
    items.splice(
      rowEnd(openIndex, columns, shown.length) + 1,
      0,
      <li key={`details-${openCard.slug}`} className="col-span-full">
        <ModuleDetails
          id={detailsId}
          card={openCard}
          initialVariant={
            (
              matchingVariants(openCard.variants, filters).at(0) ??
              openCard.variants.at(0)
            )?.id ?? ""
          }
          colorOf={colorOf}
          onClose={() => {
            closeDetails(openCard.slug);
          }}
        />
      </li>,
    );
  }

  const typeItems = [
    { value: all, label: "All types" },
    ...options.types.map((type) => ({ value: type, label: type })),
  ];
  const ownerItems = [
    { value: all, label: "Any Descendant" },
    ...options.owners.map((owner) => ({
      value: owner.slug,
      label: owner.name,
    })),
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Search modules by name</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={filters.query}
              placeholder="Search by name"
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

        <FilterRow id={`${ids}-tier`} label="Tier">
          <ToggleGroup
            aria-labelledby={`${ids}-tier`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.tier ?? all]}
            onValueChange={(value) => {
              set({ tier: pick(value) });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {options.tiers.map((tier) => (
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

        <FilterRow id={`${ids}-class`} label="Class">
          <ToggleGroup
            aria-labelledby={`${ids}-class`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.category ?? all]}
            onValueChange={(value) => {
              set({ category: pick(value) });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {options.categories.map((category) => (
              <ToggleGroupItem
                key={category}
                value={category}
                className={filterChipClass}
              >
                <CategoryIcon category={category} />
                {category}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>

        <FilterRow id={`${ids}-socket`} label="Socket">
          <ToggleGroup
            aria-labelledby={`${ids}-socket`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.socket ?? all]}
            onValueChange={(value) => {
              set({ socket: pick(value) });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {options.sockets.map((socket) => (
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

        <FilterRow id={`${ids}-slot`} label="Slot">
          <ToggleGroup
            aria-labelledby={`${ids}-slot`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.slot ?? all]}
            onValueChange={(value) => {
              set({ slot: pick(value) });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {options.slots.map((slot) => (
              <ToggleGroupItem
                key={slot}
                value={slot}
                className={filterChipClass}
              >
                <SlotIcon slot={slot} />
                {slot}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>

        <div className="grid gap-3 sm:grid-cols-2">
          <FilterSelect
            id={`${ids}-type`}
            label="Type"
            items={typeItems}
            value={filters.type ?? all}
            onChange={(value) => {
              set({ type: value === all ? null : value });
            }}
          />
          <FilterSelect
            id={`${ids}-owner`}
            label="Only for"
            items={ownerItems}
            value={filters.owner ?? all}
            onChange={(value) => {
              set({ owner: value === all ? null : value });
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {shown.length === entries.length
            ? `${String(entries.length)} modules`
            : `${String(shown.length)} of ${String(entries.length)} modules`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters({ ...defaultModuleFilters, sort: filters.sort });
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
          No module matches these filters.
        </p>
      ) : (
        <ul aria-label="Modules" className={gridClass}>
          {items}
        </ul>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  items,
  value,
  onChange,
}: {
  id: string;
  label: string;
  items: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:flex sm:items-center sm:gap-x-3">
      <span
        id={id}
        className="w-24 shrink-0 text-xs font-medium text-muted-foreground"
      >
        {label}
      </span>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string") {
            onChange(next);
          }
        }}
      >
        <SelectTrigger
          aria-labelledby={id}
          className="h-9 w-full min-w-0 bg-background/60 sm:flex-1"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * A module's card. It is a real link to the index with the module open, so it can be
 * copied or opened in a new tab; a plain click opens or closes its details in place.
 * It is not a Next.js Link: 573 links to this same page would each be prefetched.
 */
function ModuleCardLink({
  entry,
  tiers: tierOrder,
  colorOf,
  open,
  controls,
  onToggle,
}: {
  entry: ModuleCard;
  /** Tier names, highest first. */
  tiers: readonly string[];
  /** A tier's color, by its name. */
  colorOf: (tier: string) => string;
  /** Whether its details are open. */
  open: boolean;
  /** The details' id, while they are open. */
  controls: string;
  onToggle: () => void;
}) {
  const first = entry.variants.at(0);
  if (first === undefined) {
    return null;
  }
  const categories = [
    ...new Set(entry.variants.map((variant) => variant.category)),
  ];
  const sockets = [
    ...new Set(
      entry.variants.flatMap((variant) =>
        variant.socket === null ? [] : [variant.socket],
      ),
    ),
  ];
  // Trigger modules take no capacity, so they show none.
  const capacities = entry.variants.flatMap((variant) =>
    variant.capacity === null ? [] : [variant.capacity],
  );
  // Lowest to highest, whichever level each is at.
  const values = capacities.flatMap((capacity) => [capacity.from, capacity.to]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Highest first; the art takes the highest tier's color.
  const tiers = [
    ...new Set(entry.variants.map((variant) => variant.tier)),
  ].sort((a, b) => tierOrder.indexOf(a) - tierOrder.indexOf(b));
  const color = colorOf(tiers[0] ?? "");
  const types = [
    ...new Set(
      entry.variants.flatMap((variant) => {
        const type = shownType(variant);
        return type === null ? [] : [type];
      }),
    ),
  ];
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
      href={`${indexPath}?module=${entry.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full content-start gap-3 rounded-2xl border bg-card/70 p-3 transition-colors outline-none [contain-intrinsic-size:auto_15rem] [content-visibility:auto] hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      {/* The name comes first in the card's text, for assistive tech; the art and the
          tier sit above it on screen. */}
      <span className="grid min-w-0 gap-1">
        <span className="font-display text-base leading-tight font-semibold tracking-wide">
          {entry.name}
        </span>{" "}
        {types.length === 0 ? null : (
          <span className="text-xs text-muted-foreground">
            {types.join(", ")}
          </span>
        )}
      </span>{" "}
      {/* Wraps on a narrow card, so the tier never runs past its edge. */}
      <span className="order-first flex flex-wrap items-start justify-between gap-2">
        <ModuleTile imageUrl={first.imageUrl} color={color} size="md" />
        <span className="flex flex-col items-end gap-1">
          {tiers.map((tier) => (
            <span
              key={tier}
              className="rounded-full border px-1.5 text-[0.6875rem] font-medium"
              style={{
                color: colorOf(tier),
                borderColor: `color-mix(in srgb, ${colorOf(tier)} 45%, transparent)`,
              }}
            >
              {tier}
            </span>
          ))}
        </span>
      </span>{" "}
      <span className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {sockets.map((socket) => (
            <SocketIcon key={socket} socket={socket} className="size-3.5" />
          ))}
          {sockets.length === 0 ? null : (
            <span className="sr-only">{sockets.join(", ")}, </span>
          )}
          {capacities.length === 0 ? null : (
            <>
              <span className="tabular-nums">
                {min === max ? min : `${String(min)}–${String(max)}`}
              </span>
              <span className="sr-only"> capacity,</span>
            </>
          )}
        </span>{" "}
        <span className="flex items-center gap-1">
          {categories.map((category) => (
            <CategoryIcon
              key={category}
              category={category}
              className="size-3.5"
            />
          ))}
          <span className="whitespace-nowrap">
            {entry.variants.length === 1
              ? first.category
              : `${String(entry.variants.length)} versions`}
          </span>
        </span>
      </span>
    </a>
  );
}
