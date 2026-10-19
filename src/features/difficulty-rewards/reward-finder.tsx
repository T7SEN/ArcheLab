"use client";

import { ArrowUpRight, CircuitBoard } from "lucide-react";
import Link from "next/link";
import { useId, type MouseEvent } from "react";
import { ArcheIcon, ElementIcon } from "@/features/descendants/type-icons";
import { indexPath } from "./battlefield-card";
import {
  rewardFiltersToSearch,
  rewardIn,
  type Battlefield,
  type RewardFilters,
  type RewardPick,
} from "./reward-filters";
import type { AttributeIcons } from "./reward-tile";
import { rewardName } from "./reward-tile";
import { weekDate, weekLabel, weekSpan } from "./reward-week";

const linkClass =
  "group/link inline-flex items-center gap-0.5 rounded-sm text-sm text-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";
const arrowClass =
  "size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary";

/** "Moonlight Lake, Vespers", "A, and B": battlefields named in a sentence. */
function placesText(matches: readonly Battlefield[]): string {
  const names = matches.map((entry) => `${entry.name}, ${entry.region}`);
  return names.length === 2
    ? `${names[0] ?? ""}, and ${names[1] ?? ""}`
    : names.join("; ");
}

/**
 * Where the picked reward comes in each published week (ADR 0048): a pair of attribute
 * and Arche type, a component slot, or the reactors that suit a Descendant. It keeps to
 * Region and search but spans every week, and each battlefield is a link that shows
 * that week with the battlefield open, the way to it on a phone.
 */
export function RewardFinder({
  pick,
  weeks,
  current,
  week,
  filters,
  attributeIcons,
  onOpen,
}: {
  pick: RewardPick;
  /** Each shown week with the battlefields where the pick is the reward. */
  weeks: readonly {
    readonly rotation: number;
    readonly matches: readonly Battlefield[];
  }[];
  current: number;
  /** The week the grid shows. */
  week: number;
  filters: RewardFilters;
  attributeIcons: AttributeIcons;
  onOpen: (rotation: number, slug: string) => void;
}) {
  const ids = useId();
  const thisWeek = weeks.at(0)?.matches ?? [];
  const next = weeks.find((entry) => entry.matches.length > 0);
  const last = weeks.at(-1)?.rotation;
  const headline =
    pick.kind === "descendant" && pick.descendant.pairs.length === 0
      ? `No reactor reward suits ${pick.descendant.name}'s skills.`
      : thisWeek.length > 0
        ? thisWeek.length > 2
          ? `This week's reward in ${String(thisWeek.length)} battlefields.`
          : `This week's reward in ${placesText(thisWeek)}.`
        : next === undefined
          ? `Not in any published week.${last === undefined ? "" : ` Published up to the week of ${weekDate(last)}.`}`
          : `Not this week. Next in the week of ${weekDate(next.rotation)}: ${placesText(next.matches)}.`;

  return (
    <section
      key={JSON.stringify(pick)}
      aria-labelledby={`${ids}-title`}
      className="grid gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4 duration-300 motion-safe:animate-in motion-safe:fade-in sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id={`${ids}-title`}
          className="flex items-center gap-2 font-display text-xl font-semibold tracking-wide"
        >
          {pick.kind === "pair" ? (
            <>
              <ElementIcon
                url={attributeIcons[pick.attribute]}
                className="size-5"
              />
              <ArcheIcon archeType={pick.archeType} className="size-5" />
              {`${pick.attribute} ${pick.archeType}`}
            </>
          ) : pick.kind === "slot" ? (
            <>
              <CircuitBoard
                aria-hidden="true"
                className="size-5 text-primary"
              />
              {pick.slot}
            </>
          ) : (
            `Reactors that suit ${pick.descendant.name}`
          )}
        </h2>
        {pick.kind === "pair" ? (
          <Link
            href={`/reactors?attribute=${encodeURIComponent(pick.attribute)}&type=${encodeURIComponent(pick.archeType)}`}
            prefetch={false}
            className={linkClass}
          >
            Reactors with this attribute and Arche type
            <ArrowUpRight aria-hidden="true" className={arrowClass} />
          </Link>
        ) : pick.kind === "descendant" ? (
          <Link
            href={`/descendants/${pick.descendant.slug}#reactors`}
            prefetch={false}
            className={linkClass}
          >
            {pick.descendant.name}&apos;s reactors
            <ArrowUpRight aria-hidden="true" className={arrowClass} />
          </Link>
        ) : (
          <Link
            href="/external-components"
            prefetch={false}
            className={linkClass}
          >
            All external components
            <ArrowUpRight aria-hidden="true" className={arrowClass} />
          </Link>
        )}
      </div>
      <p aria-live="polite" className="text-base">
        {headline}
      </p>
      <dl
        aria-label="Published weeks"
        className="grid gap-x-4 gap-y-1 sm:grid-cols-[7rem_minmax(0,1fr)]"
      >
        {weeks.map(({ rotation, matches }) => (
          <div
            key={rotation}
            className={`grid gap-1.5 rounded-lg px-2 py-1.5 sm:col-span-2 sm:grid-cols-subgrid sm:items-center ${rotation === week ? "bg-primary/10" : ""}`}
          >
            <dt className="text-xs font-medium text-muted-foreground">
              {weekLabel(rotation, current)}
              <span className="sr-only">, {weekSpan(rotation)}</span>
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {matches.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No battlefield
                </span>
              ) : (
                matches.map((entry) => (
                  <FinderLink
                    key={entry.slug}
                    battlefield={entry}
                    rotation={rotation}
                    current={current}
                    filters={filters}
                    pick={pick}
                    attributeIcons={attributeIcons}
                    onOpen={onOpen}
                  />
                ))
              )}
            </dd>
          </div>
        ))}
        {last === undefined ? null : (
          <div className="grid gap-1.5 px-2 py-1.5 text-muted-foreground sm:col-span-2 sm:grid-cols-subgrid sm:items-center">
            <dt className="text-xs font-medium">From {weekDate(last + 1)}</dt>
            <dd className="text-sm">Not published yet</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

/**
 * A battlefield in the list: a real link to that week with it open; a plain click shows
 * it in place, and a modified click opens the link as the browser would.
 */
function FinderLink({
  battlefield,
  rotation,
  current,
  filters,
  pick,
  attributeIcons,
  onOpen,
}: {
  battlefield: Battlefield;
  rotation: number;
  current: number;
  filters: RewardFilters;
  pick: RewardPick;
  attributeIcons: AttributeIcons;
  onOpen: (rotation: number, slug: string) => void;
}) {
  const href = `${indexPath}${rewardFiltersToSearch({
    ...filters,
    week: rotation === current ? null : rotation,
    open: battlefield.slug,
  })}`;
  // With a Descendant, each pill says which of its reactors this one is.
  const reward =
    pick.kind === "descendant" ? rewardIn(battlefield, rotation) : null;
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
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
    onOpen(rotation, battlefield.slug);
  };
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-2.5 py-1 text-sm transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {reward?.kind === "reactor" ? (
        <>
          <ElementIcon url={attributeIcons[reward.attribute]} />
          <ArcheIcon archeType={reward.archeType} />
          <span className="sr-only">{rewardName(reward)}, </span>
        </>
      ) : null}
      {battlefield.name}
      <span className="text-muted-foreground">
        <span aria-hidden="true">·</span>
        <span className="sr-only">,</span> {battlefield.region}
      </span>
    </a>
  );
}
