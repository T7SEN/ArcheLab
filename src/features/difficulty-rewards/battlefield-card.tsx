"use client";

import type { MouseEvent } from "react";
import { useSlideIn } from "@/components/motion";
import type { Battlefield, Reward } from "./reward-filters";
import { RewardText, RewardTile, type AttributeIcons } from "./reward-tile";

/** The page's address, for a card's link. */
export const indexPath = "/difficulty-level-rewards";

/** A card's id, for focus to come back to it when its details close. */
export const cardId = (slug: string) => `battlefield-card-${slug}`;

/** The shown week, as a card needs it. */
export interface ShownWeek {
  /** The week's key, for the slide's direction: "2026-10-27". */
  readonly key: string;
  /** "This week", "Next week", "27 Oct". */
  readonly label: string;
  /** Every shown week's key, earliest first. */
  readonly order: readonly string[];
}

/**
 * A battlefield's card (ADR 0048): its reward in the shown week, its name, and what it
 * holds. A real link to the page with it open, so it can be copied or opened in a new
 * tab; a plain click opens or closes its details in place.
 */
export function BattlefieldCard({
  battlefield,
  reward,
  week,
  attributeIcons,
  open,
  controls,
  onToggle,
}: {
  battlefield: Battlefield;
  /** The shown week's reward; null when it isn't published, undefined before the week is known. */
  reward: Reward | null | undefined;
  /** null before the week is known, or while it isn't published. */
  week: ShownWeek | null;
  attributeIcons: AttributeIcons;
  open: boolean;
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
  const missions = battlefield.missions.length;
  const holds = [
    `${String(missions)} ${missions === 1 ? "mission" : "missions"}`,
    ...(battlefield.outpost === null ? [] : ["Vulgus Strategic Outpost"]),
    ...(battlefield.fusionReactor === null ? [] : ["Void Fusion Reactor"]),
  ];

  return (
    <a
      id={cardId(battlefield.slug)}
      href={`${indexPath}?battlefield=${battlefield.slug}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full content-start gap-3 rounded-2xl border bg-card/70 p-3 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary/70 aria-expanded:bg-primary/10"
    >
      {/* The name comes first in the card's text, for assistive tech; the tile sits
          above it on screen. */}
      <span className="font-display text-base leading-tight font-semibold tracking-wide">
        {battlefield.name}
      </span>
      <span className="sr-only">, </span>
      <span className="order-first">
        <RewardTile reward={reward} attributeIcons={attributeIcons} size="md" />
      </span>
      <span className="grid gap-1.5 border-t border-border/60 pt-3">
        {reward === undefined ? (
          // The week isn't known yet: placeholders of the same height, said nowhere.
          <>
            <span
              aria-hidden="true"
              className="h-3 w-14 rounded bg-secondary"
            />
            <span
              aria-hidden="true"
              className="h-4 w-24 rounded bg-secondary"
            />
          </>
        ) : reward === null || week === null ? (
          <span className="text-xs text-muted-foreground">
            Not published yet
          </span>
        ) : (
          <WeekReward
            reward={reward}
            week={week}
            attributeIcons={attributeIcons}
          />
        )}
      </span>
      <span className="sr-only">, </span>
      <span className="mt-auto text-xs text-muted-foreground">
        {holds.join(" · ")}
      </span>
    </a>
  );
}

/**
 * The shown week's reward on a card. Mounted once the week is known, so the first
 * known week doesn't slide in; a switch slides it from the side of travel (ADR 0030).
 */
function WeekReward({
  reward,
  week,
  attributeIcons,
}: {
  reward: Reward;
  week: ShownWeek;
  attributeIcons: AttributeIcons;
}) {
  const ref = useSlideIn<HTMLSpanElement>(week.key, week.order);
  return (
    <span ref={ref} className="grid gap-1.5">
      <span className="text-[0.6875rem] font-medium text-muted-foreground">
        {week.label}
        <span className="sr-only">, </span>
      </span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <RewardText reward={reward} attributeIcons={attributeIcons} kind />
      </span>
    </span>
  );
}
