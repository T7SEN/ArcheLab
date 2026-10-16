"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
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
import {
  defaultFilters,
  filterDescendants,
  filtersToSearch,
  parseFilters,
  type Filters,
  type IndexCard,
  type Kind,
} from "./index-filters";
import { ArcheIcon, ElementIcon } from "./type-icons";

/** A card on the index: what the filters read, plus its portrait. */
export interface IndexEntry extends IndexCard {
  readonly imageUrl: string;
}

function writeFilters(filters: Filters): void {
  writeSearch(filtersToSearch(filters));
}

const kinds: readonly { value: Kind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "base", label: "Base" },
  { value: "ultimate", label: "Ultimate" },
];

const sorts = [
  { value: "newest", label: "Newest first" },
  { value: "az", label: "A–Z" },
];

const all = "all";

interface DescendantIndexProps {
  entries: readonly IndexEntry[];
  /** The attributes and Arche types the filters offer, in display order. */
  attributes: readonly string[];
  archeTypes: readonly string[];
  /** Each attribute's icon URL, from `elementIconUrls`. */
  elementIcons: Readonly<Record<string, string>>;
  ultimateColor: string;
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function DescendantIndexFromUrl(props: DescendantIndexProps) {
  return <DescendantIndex {...props} search={useSearch()} />;
}

/**
 * Every Descendant as a card, with filters by attribute, Arche type and Ultimate, a
 * name search and two orders (ADR 0023). The filters live in the URL query; with
 * `search` "" this is the unfiltered index the static HTML holds.
 */
export function DescendantIndex({
  entries,
  attributes,
  archeTypes,
  elementIcons,
  ultimateColor,
  search,
}: DescendantIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  const filters = parseFilters(search, { attributes, archeTypes });
  const shown = filterDescendants(entries, filters);
  const set = (change: Partial<Filters>): void => {
    writeFilters({ ...filters, ...change });
  };
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(filtersToSearch({ ...filters, sort: "newest" })) !== "";

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Search Descendants by name</span>
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
              set({ sort: value === "az" ? "az" : "newest" });
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

        <FilterRow id={`${ids}-attribute`} label="Attribute">
          <ToggleGroup
            aria-labelledby={`${ids}-attribute`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.attribute ?? all]}
            onValueChange={(value) => {
              const next = value.at(0);
              set({
                attribute: next === undefined || next === all ? null : next,
              });
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
                <ElementIcon url={elementIcons[attribute]} className="size-4" />
                {attribute}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>

        <FilterRow id={`${ids}-arche`} label="Arche type">
          <ToggleGroup
            aria-labelledby={`${ids}-arche`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.archeType ?? all]}
            onValueChange={(value) => {
              const next = value.at(0);
              set({
                archeType: next === undefined || next === all ? null : next,
              });
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
                <ArcheIcon archeType={archeType} className="size-4" />
                {archeType}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>

        <FilterRow id={`${ids}-kind`} label="Ultimate">
          <ToggleGroup
            aria-labelledby={`${ids}-kind`}
            variant="outline"
            size="sm"
            spacing={1}
            value={[filters.kind]}
            onValueChange={(value) => {
              const next = value.at(0);
              set({
                kind: next === "base" || next === "ultimate" ? next : "all",
              });
            }}
          >
            {kinds.map((kind) => (
              <ToggleGroupItem
                key={kind.value}
                value={kind.value}
                className={filterChipClass}
              >
                {kind.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {shown.length === entries.length
            ? `${String(entries.length)} Descendants`
            : `${String(shown.length)} of ${String(entries.length)} Descendants`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters({ ...defaultFilters, sort: filters.sort });
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
          No Descendant matches these filters.
        </p>
      ) : (
        <ul
          aria-label="Descendants"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          {shown.map((entry) => (
            <li key={entry.slug}>
              <DescendantCard
                entry={entry}
                elementIcons={elementIcons}
                ultimateColor={ultimateColor}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DescendantCard({
  entry,
  elementIcons,
  ultimateColor,
}: {
  entry: IndexEntry;
  elementIcons: Readonly<Record<string, string>>;
  ultimateColor: string;
}) {
  const glow = entry.ultimate ? ultimateColor : "var(--primary)";
  return (
    <Link
      href={`/descendants/${entry.slug}`}
      className="group grid h-full overflow-hidden rounded-2xl border bg-card/70 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        className="relative block aspect-square overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${glow} 30%, transparent), transparent 72%)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
        <img
          src={entry.imageUrl}
          alt=""
          width={256}
          height={256}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
      </span>
      <span className="grid gap-1.5 border-t px-3 py-2.5">
        <span className="truncate font-display text-lg leading-tight font-semibold tracking-wide">
          {entry.name}
        </span>
        <span className="flex items-center gap-1.5">
          {entry.elements.map((element) => (
            <ElementIcon
              key={element}
              url={elementIcons[element]}
              className="size-4"
            />
          ))}
          {entry.archeTypes.map((archeType) => (
            <ArcheIcon
              key={archeType}
              archeType={archeType}
              className="size-3.5"
            />
          ))}
          {entry.ultimate ? (
            <span
              className="ml-auto rounded-full border px-1.5 text-[0.6875rem] font-medium"
              style={{
                color: ultimateColor,
                borderColor: `color-mix(in srgb, ${ultimateColor} 45%, transparent)`,
              }}
            >
              Ultimate
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
