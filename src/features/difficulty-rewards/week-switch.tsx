"use client";

import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { rotationAnchorStatus } from "@/data/difficulty-rewards";
import {
  FilterRow,
  FilterSelect,
  filterChipClass,
} from "@/features/game-data/filter-row";
import { useMinuteClock } from "./use-reward-week";
import {
  formatCountdown,
  localMoment,
  weekDate,
  weekKey,
  weekLabel,
  weekSpan,
  weekStart,
} from "./reward-week";

/** Weeks past this many go in a dropdown, so the chips stay two rows on a phone. */
const maxChips = 8;

/** The anchor and the change time aren't checked in game yet (ADR 0048). */
function ProvisionalBadge() {
  return rotationAnchorStatus === "provisional" ? (
    <Badge variant="destructive">
      <TriangleAlert aria-hidden="true" />
      Provisional: not verified in game yet
    </Badge>
  ) : null;
}

/**
 * The week the page shows (ADR 0048): this week, next week, then each published week by
 * its UTC start date, with its local start and end and a countdown under the chips.
 * Before the browser knows the week, it says only when the weeks change.
 */
export function WeekSwitch({
  id,
  rotations,
  current,
  week,
  counts,
  onPick,
}: {
  id: string;
  /** The shown weeks, this week first; empty while it isn't known or published. */
  rotations: readonly number[];
  /** This week; null until the browser knows it. */
  current: number | null;
  /** The shown week. */
  week: number | null;
  /** How many battlefields match in each week, while a filter narrows the grid. */
  counts: ReadonlyMap<number, number> | null;
  onPick: (rotation: number) => void;
}) {
  const now = useMinuteClock();
  if (current === null) {
    return (
      <FilterRow id={id} label="Week">
        <p
          role="status"
          aria-busy="true"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          Rewards change every Tuesday at 07:00 UTC.
          <ProvisionalBadge />
        </p>
      </FilterRow>
    );
  }
  const last = rotations.at(-1);
  if (week === null || last === undefined) {
    return (
      <FilterRow id={id} label="Week">
        <p className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          This week&apos;s rewards aren&apos;t published yet.
          <ProvisionalBadge />
        </p>
      </FilterRow>
    );
  }
  const chips = rotations.slice(0, maxChips);
  const later = rotations.slice(maxChips);
  const start = weekStart(week);
  const end = weekStart(week + 1);

  return (
    <div className="grid gap-2">
      <FilterRow id={id} label="Week">
        <ToggleGroup
          aria-labelledby={id}
          variant="outline"
          size="sm"
          spacing={1}
          className="min-w-0 flex-1 flex-wrap"
          value={chips.includes(week) ? [String(week)] : []}
          onValueChange={(value) => {
            const next = value.at(0);
            if (next !== undefined) {
              onPick(Number(next));
            }
          }}
        >
          {chips.map((rotation) => {
            const count = counts?.get(rotation);
            return (
              <ToggleGroupItem
                key={rotation}
                value={String(rotation)}
                className={`${filterChipClass} ${count === 0 ? "text-muted-foreground" : ""}`}
              >
                {weekLabel(rotation, current)}
                <span className="sr-only">, {weekSpan(rotation)}</span>
                {count === undefined ? null : (
                  <>
                    <span
                      aria-hidden="true"
                      className="ml-1 rounded-full bg-secondary px-1.5 text-[0.6875rem] tabular-nums"
                    >
                      {count}
                    </span>
                    <span className="sr-only">
                      , {count}{" "}
                      {count === 1
                        ? "battlefield matches"
                        : "battlefields match"}
                    </span>
                  </>
                )}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </FilterRow>
      {later.length === 0 ? null : (
        <FilterSelect
          id={`${id}-later`}
          label="Later"
          items={[
            { value: "", label: "Pick a week" },
            ...later.map((rotation) => ({
              value: weekKey(rotation),
              label: weekDate(rotation),
            })),
          ]}
          value={later.includes(week) ? weekKey(week) : ""}
          onChange={(value) => {
            const rotation = later.find((entry) => weekKey(entry) === value);
            if (rotation !== undefined) {
              onPick(rotation);
            }
          }}
        />
      )}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:pl-[6.75rem]">
        <span>
          <time dateTime={new Date(start).toISOString()}>
            {localMoment(start)}
          </time>{" "}
          to{" "}
          <time dateTime={new Date(end).toISOString()}>{localMoment(end)}</time>
          {now === null
            ? null
            : week === current
              ? ` · New rewards in ${formatCountdown(end - now)}`
              : ` · Starts in ${formatCountdown(start - now)}`}
        </span>
        <span>Published up to the week of {weekDate(last)}.</span>
        <ProvisionalBadge />
      </p>
    </div>
  );
}
