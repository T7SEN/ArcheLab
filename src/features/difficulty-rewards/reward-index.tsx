"use client";

import { CircuitBoard, Search, X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useChangedSince, useClosing } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArcheIcon, ElementIcon } from "@/features/descendants/type-icons";
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
import { CardItem, DetailsRowItem } from "@/features/game-data/grid-items";
import { LoadFailed } from "@/features/game-data/load-failed";
import {
  urlSearchOf,
  useSearch,
  writeSearch,
} from "@/features/game-data/url-query";
import { slugOf } from "@/lib/slug";
import { BattlefieldCard, cardId } from "./battlefield-card";
import { BattlefieldDetails } from "./battlefield-details";
import { RewardFinder } from "./reward-finder";
import {
  clearedFilters,
  filterBattlefields,
  narrows,
  parseRewardFilters,
  rewardFiltersToSearch,
  rewardIn,
  rewardPick,
  weekMatches,
  type Battlefield,
  type RewardDescendant,
  type RewardFilters,
  type RewardRegion,
} from "./reward-filters";
import type { AttributeIcons } from "./reward-tile";
import { shownRotations, weekDate, weekKey, weekLabel } from "./reward-week";
import { useCurrentRotation } from "./use-reward-week";
import { WeekSwitch } from "./week-switch";

const all = "all";

interface RewardIndexProps {
  battlefields: readonly Battlefield[];
  regions: readonly RewardRegion[];
  /** The weeks the build shipped, earliest first. */
  rotations: readonly number[];
  attributes: readonly string[];
  attributeIcons: AttributeIcons;
  archeTypes: readonly string[];
  slots: readonly string[];
  descendants: readonly RewardDescendant[];
}

/** The page filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function RewardIndexFromUrl(props: RewardIndexProps) {
  return <RewardIndex {...props} search={useSearch()} />;
}

/**
 * Every battlefield of the eight regions with its Difficulty Level Reward in the shown
 * week (ADR 0048), filtered by the reward (attribute and Arche type, component slot, or
 * what suits a Descendant), region and search. A full pick lists where it comes in
 * every published week. A card opens the battlefield's details under its row. The week
 * is worked out in the browser; with `search` "" and no week yet, this is what the
 * static HTML holds.
 */
export function RewardIndex({
  battlefields,
  regions,
  rotations,
  attributes,
  attributeIcons,
  archeTypes,
  slots,
  descendants,
  search,
}: RewardIndexProps & {
  /** The URL query the filters come from. */
  search: string;
}) {
  const ids = useId();
  // Cards a filter brings in fade in; the first render doesn't (ADR 0030).
  const enter = useChangedSince(search);
  const current = useCurrentRotation(rotations.at(0) ?? null);
  const shown = current === null ? [] : shownRotations(rotations, current);
  // This week is published when the build shipped it; after the last shipped week the
  // page says so and never wraps to an old one.
  const published = current !== null && shown.at(0) === current;
  const parsed = parseRewardFilters(search, {
    rotations: published ? shown : [],
    attributes,
    archeTypes,
    slots,
    descendants: descendants.map((entry) => entry.slug),
    regions: regions.map((entry) => entry.slug),
    battlefields: battlefields.map((entry) => entry.slug),
  });
  // Until this week's rewards are known and published, only Region and search apply.
  const filters: RewardFilters = published
    ? parsed
    : {
        ...parsed,
        week: null,
        attribute: null,
        archeType: null,
        slot: null,
        descendant: null,
      };
  const week = published ? (filters.week ?? current) : null;
  const set = (change: Partial<RewardFilters>): void => {
    writeSearch(rewardFiltersToSearch({ ...filters, ...change }));
  };
  const pickWeek = (rotation: number) => {
    set({ week: rotation === current ? null : rotation });
  };
  const chip = (value: readonly string[]): string | null => {
    const next = value.at(0);
    return next === undefined || next === all ? null : next;
  };

  // A new week that starts while the page is open is said once.
  const [seenWeek, setSeenWeek] = useState(current);
  const [rolledOver, setRolledOver] = useState(false);
  if (current !== seenWeek) {
    setSeenWeek(current);
    setRolledOver(seenWeek !== null && current !== null);
  }

  const shownCards = filterBattlefields(
    battlefields,
    filters,
    week ?? -1,
    descendants,
  );
  const perWeek = published
    ? weekMatches(battlefields, filters, shown, descendants)
    : [];
  const filtered = narrows(filters);
  const counts = filtered
    ? new Map(perWeek.map((entry) => [entry.rotation, entry.matches.length]))
    : null;
  const pick = published ? rewardPick(filters, slots, descendants) : null;
  const order = shown.map(weekKey);
  const shownWeek =
    week === null || current === null
      ? null
      : { key: weekKey(week), label: weekLabel(week, current), order };

  // The open battlefield's details go under its card's row, in its region's grid.
  const columns = useGridColumns();
  const openCard =
    shownCards.find((entry) => entry.slug === filters.open) ?? null;
  const detailsId = `${ids}-details`;
  const [detailsCard, closing, closed] = useClosing(
    openCard,
    (card) => card.slug,
  );
  const detailsShown =
    detailsCard !== null &&
    shownCards.some((entry) => entry.slug === detailsCard.slug);
  if (closing && !detailsShown) {
    // A card a filter hid has nowhere to fold, so its details simply go.
    closed();
  }
  const closeDetails = (slug: string) => {
    set({ open: null });
    // The details held focus; it goes back to the card that opened them.
    document.getElementById(cardId(slug))?.focus({ preventScroll: true });
  };

  // The data couldn't load: the hero says so, and this says it once more.
  if (battlefields.length === 0) {
    return <LoadFailed what="Difficulty Level Rewards" />;
  }

  const total = battlefields.length;
  const status = rolledOver
    ? "A new week has started. This week's rewards are showing."
    : week === null || current === null
      ? `${String(total)} battlefields`
      : `${week === current ? "This week" : `Week of ${weekDate(week)}`}: ${
          shownCards.length === total
            ? `${String(total)} battlefields`
            : `${String(shownCards.length)} of ${String(total)} battlefields`
        }`;
  const laterMatches = perWeek.filter(
    (entry) => entry.rotation !== week && entry.matches.length > 0,
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5">
        <div className="border-b pb-4">
          <WeekSwitch
            id={`${ids}-week`}
            rotations={published ? shown : []}
            current={current}
            week={week}
            counts={counts}
            onPick={pickWeek}
          />
        </div>

        <label className="relative">
          <span className="sr-only">Search battlefields</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.query}
            placeholder="Search by battlefield, mission or drop"
            onChange={(event) => {
              set({ query: event.target.value });
            }}
            className="h-9 bg-background/60 pl-8"
          />
        </label>

        {current !== null && !published ? null : (
          <>
            <ChipRow
              id={`${ids}-attribute`}
              label="Attribute"
              value={filters.attribute}
              options={attributes.map((attribute) => ({
                value: attribute,
                icon: <ElementIcon url={attributeIcons[attribute]} />,
              }))}
              onChange={(value) => {
                set({ attribute: chip(value), slot: null, descendant: null });
              }}
            />
            <ChipRow
              id={`${ids}-type`}
              label="Arche type"
              value={filters.archeType}
              options={archeTypes.map((archeType) => ({
                value: archeType,
                icon: <ArcheIcon archeType={archeType} />,
              }))}
              onChange={(value) => {
                set({ archeType: chip(value), slot: null, descendant: null });
              }}
            />
            <ChipRow
              id={`${ids}-slot`}
              label="Component"
              value={
                slots.find((slot) => slugOf(slot) === filters.slot) ?? null
              }
              options={slots.map((slot) => ({
                value: slot,
                icon: (
                  <CircuitBoard
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                ),
              }))}
              onChange={(value) => {
                const slot = chip(value);
                set({
                  slot: slot === null ? null : slugOf(slot),
                  attribute: null,
                  archeType: null,
                  descendant: null,
                });
              }}
            />
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {current !== null && !published ? null : (
            <FilterSelect
              id={`${ids}-descendant`}
              label="Descendant"
              items={[
                { value: all, label: "All Descendants" },
                ...descendants.map((entry) => ({
                  value: entry.slug,
                  label: entry.name,
                })),
              ]}
              value={filters.descendant ?? all}
              onChange={(value) => {
                set({
                  descendant: value === all ? null : value,
                  attribute: null,
                  archeType: null,
                  slot: null,
                });
              }}
            />
          )}
          <FilterSelect
            id={`${ids}-region`}
            label="Region"
            items={[
              { value: all, label: "All regions" },
              ...regions.map((entry) => ({
                value: entry.slug,
                label: entry.name,
              })),
            ]}
            value={filters.region ?? all}
            onChange={(value) => {
              set({ region: value === all ? null : value });
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {status}
        </p>
        {urlSearchOf(
          rewardFiltersToSearch({ ...filters, week: null, open: null }),
        ) !== "" ? (
          <button
            type="button"
            onClick={() => {
              writeSearch(rewardFiltersToSearch(clearedFilters(filters)));
            }}
            className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden="true" className="size-4" />
            Clear filters
          </button>
        ) : null}
      </div>

      {pick === null || current === null || week === null ? null : (
        <RewardFinder
          pick={pick}
          weeks={perWeek}
          current={current}
          week={week}
          filters={filters}
          attributeIcons={attributeIcons}
          onOpen={(rotation, slug) => {
            set({ week: rotation === current ? null : rotation, open: slug });
          }}
        />
      )}

      {shownCards.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground duration-300 motion-safe:animate-in motion-safe:fade-in">
          <p>
            {!published
              ? "No battlefield matches these filters."
              : laterMatches.length > 0
                ? "No battlefield matches these filters this week."
                : "No battlefield matches these filters in the published weeks."}
          </p>
          {published && laterMatches.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span>It matches in:</span>
              {laterMatches.map((entry) => (
                <button
                  key={entry.rotation}
                  type="button"
                  onClick={() => {
                    pickWeek(entry.rotation);
                  }}
                  className="rounded-full border bg-card/60 px-2.5 py-1 text-foreground transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {weekLabel(entry.rotation, current)} ({entry.matches.length})
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        regions.map((region) => {
          const cards = shownCards.filter(
            (entry) => entry.regionSlug === region.slug,
          );
          if (cards.length === 0) {
            return null;
          }
          const regionTotal = battlefields.filter(
            (entry) => entry.regionSlug === region.slug,
          ).length;
          const items = cards.map((entry) => (
            <CardItem key={entry.slug} enter={enter}>
              <BattlefieldCard
                battlefield={entry}
                reward={
                  current === null
                    ? undefined
                    : week === null
                      ? null
                      : rewardIn(entry, week)
                }
                week={shownWeek}
                attributeIcons={attributeIcons}
                open={entry.slug === openCard?.slug}
                controls={detailsId}
                onToggle={() => {
                  set({
                    open: entry.slug === openCard?.slug ? null : entry.slug,
                  });
                }}
              />
            </CardItem>
          ));
          const detailsIndex =
            detailsCard === null
              ? -1
              : cards.findIndex((entry) => entry.slug === detailsCard.slug);
          if (detailsCard !== null && detailsIndex !== -1) {
            items.splice(
              rowEnd(detailsIndex, columns, cards.length) + 1,
              0,
              <DetailsRowItem
                key={`details-${detailsCard.slug}`}
                closing={closing}
                onClosed={closed}
              >
                <BattlefieldDetails
                  id={detailsId}
                  battlefield={detailsCard}
                  rotations={published ? shown : []}
                  week={week}
                  attributeIcons={attributeIcons}
                  onPickWeek={pickWeek}
                  onClose={() => {
                    closeDetails(detailsCard.slug);
                  }}
                />
              </DetailsRowItem>,
            );
          }
          return (
            <section
              key={region.slug}
              id={region.slug}
              aria-labelledby={`${ids}-${region.slug}`}
              className="grid scroll-mt-[calc(var(--site-header-height)+1rem)] gap-3"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2
                  id={`${ids}-${region.slug}`}
                  className="font-display text-2xl font-semibold tracking-wide"
                >
                  {region.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {cards.length === regionTotal
                    ? `${String(regionTotal)} battlefields`
                    : `${String(cards.length)} of ${String(regionTotal)} battlefields`}
                </p>
              </div>
              <ul
                aria-label={`${region.name} battlefields`}
                className={gridClass}
              >
                {items}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

/** A filter row of chips with "All" first, each with its icon. */
function ChipRow({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  options: readonly { value: string; icon: ReactNode }[];
  onChange: (value: readonly string[]) => void;
}) {
  return (
    <FilterRow id={id} label={label}>
      <ToggleGroup
        aria-labelledby={id}
        variant="outline"
        size="sm"
        spacing={1}
        className="min-w-0 flex-1 flex-wrap"
        value={[value ?? all]}
        onValueChange={onChange}
      >
        <ToggleGroupItem value={all} className={filterChipClass}>
          All
        </ToggleGroupItem>
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={filterChipClass}
          >
            {option.icon}
            {option.value}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FilterRow>
  );
}
