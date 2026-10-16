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
import { RoundsIcon } from "./rounds-icon";
import {
  defaultWeaponFilters,
  filterWeapons,
  parseWeaponFilters,
  weaponFiltersToSearch,
  type WeaponCard,
  type WeaponFilters,
} from "./weapon-filters";

/** A card on the index: what the filters read, plus its art. */
export interface WeaponEntry extends WeaponCard {
  readonly imageUrl: string;
}

/** A tier the filter offers, with its rarity color from the chat registry. */
export interface TierOption {
  readonly name: string;
  readonly hex: string;
}

const sorts = [
  { value: "tier", label: "Highest tier" },
  { value: "az", label: "A–Z" },
];

const all = "all";

function writeFilters(filters: WeaponFilters): void {
  writeSearch(weaponFiltersToSearch(filters));
}

interface WeaponIndexProps {
  entries: readonly WeaponEntry[];
  /** The tiers, types and rounds the filters offer, in display order. */
  tiers: readonly TierOption[];
  types: readonly string[];
  rounds: readonly string[];
}

/** The index filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function WeaponIndexFromUrl(props: WeaponIndexProps) {
  return <WeaponIndex {...props} search={useSearch()} />;
}

/**
 * Every weapon as a card, with filters by tier, type and rounds, a name search and two
 * orders (ADR 0024). The filters live in the URL query; with `search` "" this is the
 * unfiltered index the static HTML holds.
 */
export function WeaponIndex({
  entries,
  tiers,
  types,
  rounds,
  search,
}: WeaponIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  const tierNames = tiers.map((tier) => tier.name);
  const filters = parseWeaponFilters(search, {
    tiers: tierNames,
    types,
    rounds,
  });
  const shown = filterWeapons(entries, filters);
  const colorOf = new Map(tiers.map((tier) => [tier.name, tier.hex]));
  const set = (change: Partial<WeaponFilters>): void => {
    writeFilters({ ...filters, ...change });
  };
  const pick = (value: readonly string[]): string | null => {
    const next = value.at(0);
    return next === undefined || next === all ? null : next;
  };
  // A blank search filters nothing, so it alone offers no "Clear filters".
  const filtered =
    urlSearchOf(weaponFiltersToSearch({ ...filters, sort: "tier" })) !== "";

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Search weapons by name</span>
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

        <FilterRow id={`${ids}-type`} label="Type">
          <ToggleGroup
            aria-labelledby={`${ids}-type`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.type ?? all]}
            onValueChange={(value) => {
              set({ type: pick(value) });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {types.map((type) => (
              <ToggleGroupItem
                key={type}
                value={type}
                className={filterChipClass}
              >
                {type}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>

        <FilterRow id={`${ids}-rounds`} label="Rounds">
          <ToggleGroup
            aria-labelledby={`${ids}-rounds`}
            variant="outline"
            size="sm"
            spacing={1}
            className="min-w-0 flex-1 flex-wrap"
            value={[filters.rounds ?? all]}
            onValueChange={(value) => {
              set({ rounds: pick(value) });
            }}
          >
            <ToggleGroupItem value={all} className={filterChipClass}>
              All
            </ToggleGroupItem>
            {rounds.map((name) => (
              <ToggleGroupItem
                key={name}
                value={name}
                className={filterChipClass}
              >
                <RoundsIcon rounds={name} />
                {name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {shown.length === entries.length
            ? `${String(entries.length)} weapons`
            : `${String(shown.length)} of ${String(entries.length)} weapons`}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              writeFilters({ ...defaultWeaponFilters, sort: filters.sort });
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
          No weapon matches these filters.
        </p>
      ) : (
        <ul
          aria-label="Weapons"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {shown.map((entry) => (
            <li key={entry.slug}>
              <WeaponCardLink
                entry={entry}
                color={colorOf.get(entry.tier) ?? "var(--primary)"}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WeaponCardLink({
  entry,
  color,
}: {
  entry: WeaponEntry;
  /** The tier's rarity color. */
  color: string;
}) {
  return (
    <Link
      href={`/weapons/${entry.slug}`}
      className="group grid h-full overflow-hidden rounded-2xl border bg-card/70 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        className="relative block px-4 py-5"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 55%, color-mix(in srgb, ${color} 28%, transparent), transparent 72%)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
        <img
          src={entry.imageUrl}
          alt=""
          width={1024}
          height={304}
          loading="lazy"
          decoding="async"
          className="aspect-[1024/304] w-full object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
      </span>
      <span className="grid min-w-0 gap-1.5 border-t px-3 py-2.5">
        <span className="flex min-w-0 items-start justify-between gap-2">
          <span className="min-w-0 font-display text-lg leading-tight font-semibold tracking-wide">
            {entry.name}
          </span>
          {/* Keeps the name and the tier apart in the card's text for assistive tech. */}{" "}
          <span
            className="shrink-0 rounded-full border px-1.5 text-[0.6875rem] font-medium"
            style={{
              color,
              borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
            }}
          >
            {entry.tier}
          </span>
        </span>{" "}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{entry.type}</span>
          {entry.rounds === null ? null : (
            <>
              {" "}
              <span className="flex items-center gap-1">
                <RoundsIcon rounds={entry.rounds} className="size-3.5" />
                {entry.rounds}
              </span>
            </>
          )}
        </span>
      </span>
    </Link>
  );
}
