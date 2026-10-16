"use client";

import { useId, useState } from "react";

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/** A stat with one value per level, as a Descendant's or a weapon's ATK. */
export interface LevelStat {
  readonly name: string;
  /** One value per entry of `levels`. */
  readonly values: readonly number[];
  /** Another's value at the same levels, for the difference, or null. */
  readonly baseValues: readonly number[] | null;
}

/**
 * Stats at any level NEXON lists (ADR 0023, ADR 0024): a level slider, starting at the
 * highest level, and a card per stat with its value and how far it has grown toward its
 * highest-level value. A Descendant's stats and a weapon's ATK use it.
 */
export function StatLevels({
  name,
  levels,
  stats,
  baseName = null,
  what = "stats",
}: {
  name: string;
  levels: readonly number[];
  stats: readonly LevelStat[];
  /** On an Ultimate's page, the base Descendant each stat compares with. */
  baseName?: string | null;
  /** What the list holds, for its accessible name: "Raven's stats at level 40". */
  what?: string;
}) {
  const sliderId = useId();
  const lastIndex = levels.length - 1;
  const [index, setIndex] = useState(lastIndex);
  const level = levels[index] ?? 0;
  const firstLevel = levels[0] ?? 0;
  const lastLevel = levels[lastIndex] ?? 0;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 rounded-2xl border bg-card/60 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-6 sm:px-6">
        {/* The slider's name stays "Level" and its value text says the level, so the
            big number is for the eye only: in the name it was read twice. */}
        <label htmlFor={sliderId} className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Level</span>
          <span
            aria-hidden="true"
            className="min-w-[2ch] font-display text-4xl font-semibold text-primary tabular-nums"
          >
            {level}
          </span>
        </label>
        <div className="grid gap-1.5">
          <input
            id={sliderId}
            type="range"
            min={0}
            max={lastIndex}
            step={1}
            value={index}
            aria-valuetext={String(level)}
            onChange={(event) => {
              setIndex(Number(event.target.value));
            }}
            className="h-2 w-full cursor-pointer accent-primary"
          />
          <div
            aria-hidden="true"
            className="flex justify-between font-mono text-xs text-muted-foreground"
          >
            <span>{firstLevel}</span>
            <span>{lastLevel}</span>
          </div>
        </div>
      </div>

      <ul
        aria-label={`${name}'s ${what} at level ${String(level)}`}
        className="grid grid-cols-2 gap-3 lg:grid-cols-3"
      >
        {stats.map((stat) => {
          const value = stat.values[index] ?? 0;
          const first = stat.values[0] ?? 0;
          const top = stat.values[lastIndex] ?? 0;
          const share = top > 0 ? Math.min(1, value / top) : 0;
          return (
            <li
              key={stat.name}
              className="grid content-start gap-3 rounded-2xl border bg-card/60 p-3 sm:p-4"
            >
              {/* Name above value on phones, where two columns are narrow. */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                <span className="text-sm text-muted-foreground">
                  {stat.name}
                </span>
                <span className="font-display text-2xl font-semibold tabular-nums">
                  {numberFormat.format(value)}
                </span>
              </div>
              <div aria-hidden="true" className="h-1 rounded-full bg-border/70">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none"
                  style={{ width: `${String(share * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {numberFormat.format(first)} at {firstLevel} →{" "}
                {numberFormat.format(top)} at {lastLevel}
              </span>
              {baseName === null || stat.baseValues === null ? null : (
                <Difference
                  value={value - (stat.baseValues[index] ?? value)}
                  baseName={baseName}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** How far an Ultimate's stat is from its base Descendant's at the same level. */
function Difference({ value, baseName }: { value: number; baseName: string }) {
  // Two decimals at most, so float noise such as 0.1 + 0.2 never shows.
  const rounded = Math.round(value * 100) / 100;
  return (
    <span className="text-xs text-muted-foreground">
      {rounded === 0 ? (
        <>Same as {baseName}</>
      ) : (
        <>
          <span
            className={
              rounded > 0
                ? "font-medium text-primary"
                : "font-medium text-warning"
            }
          >
            {rounded > 0 ? "+" : "−"}
            {numberFormat.format(Math.abs(rounded))}
          </span>{" "}
          vs {baseName}
        </>
      )}
    </span>
  );
}
