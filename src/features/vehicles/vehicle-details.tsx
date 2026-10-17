"use client";

import { X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { ResearchRecipe } from "@/features/game-data/research-recipe";
import { TierPill } from "@/features/game-data/showcase";
import {
  formatVehicleStat,
  groupVehicleStats,
  type VehicleCard,
} from "./vehicle-card";

/**
 * A vehicle's details, opened under its card's row (ADR 0037): NEXON's line for it,
 * every stat at a level from a slider, grouped by what it does, and its research.
 * Keyed by vehicle, so another starts afresh.
 */
export function VehicleDetails({
  id,
  card,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  card: VehicleCard;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRevealDetails(sectionRef, titleRef);
  const first = card.levels.at(0)?.level;
  const last = card.levels.at(-1)?.level;

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={`${ids}-title`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6"
      style={{
        borderColor: `color-mix(in srgb, ${card.hex} 45%, var(--border))`,
        backgroundImage: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${card.hex} 12%, transparent), transparent 60%)`,
      }}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        className="absolute top-3 right-3"
      >
        <X aria-hidden="true" />
        <span className="sr-only">Close details</span>
      </Button>

      <div className="grid gap-1.5 pr-10">
        <h2
          ref={titleRef}
          id={`${ids}-title`}
          tabIndex={-1}
          className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
        >
          {card.name}
        </h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <TierPill name={card.tierName} hex={card.hex} />
          {first === undefined || last === undefined ? null : (
            <span>
              Levels {first} to {last}
            </span>
          )}
        </p>
        <p className="text-sm">{card.description}</p>
      </div>

      <LevelView card={card} />

      {card.research === null ? null : (
        <ResearchRecipe name={card.name} recipe={card.research} />
      )}
    </section>
  );
}

/**
 * Every stat at a level, from a slider: the ones that grow with the level and the ones
 * that don't, together in their groups.
 */
function LevelView({ card }: { card: VehicleCard }) {
  const ids = useId();
  const sliderId = `${ids}-level`;
  const lastIndex = card.levels.length - 1;
  const [index, setIndex] = useState(lastIndex);
  const current = card.levels.at(index);
  if (current === undefined) {
    return (
      <p className="text-sm text-muted-foreground">
        No levels are listed for this vehicle.
      </p>
    );
  }
  const groups = groupVehicleStats([...current.stats, ...card.stats]);
  const first = card.levels.at(0)?.level ?? current.level;
  const last = card.levels.at(-1)?.level ?? current.level;

  return (
    <section aria-labelledby={`${ids}-levels`} className="grid gap-4">
      <h3
        id={`${ids}-levels`}
        className="font-display text-lg font-semibold tracking-wide"
      >
        Stats
      </h3>
      <div className="grid gap-3 rounded-xl border bg-card/60 p-4 lg:max-w-md">
        {/* The slider's name stays "Level" and its value text says the level, so the
            big number is for the eye only, as on the other indexes. */}
        <label htmlFor={sliderId} className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Level</span>
          <span
            aria-hidden="true"
            className="min-w-[3ch] font-display text-3xl font-semibold text-primary tabular-nums"
          >
            {current.level}
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
            aria-valuetext={String(current.level)}
            onChange={(event) => {
              setIndex(Number(event.target.value));
            }}
            className="h-2 w-full cursor-pointer accent-primary"
          />
          <div
            aria-hidden="true"
            className="flex justify-between font-mono text-xs text-muted-foreground"
          >
            <span>{first}</span>
            <span>{last}</span>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {groups.map((group) => (
          <section
            key={group.title}
            aria-label={group.title}
            className="grid content-start gap-2 rounded-xl border bg-card/40 p-4"
          >
            <h4 className="text-xs font-medium tracking-wide text-primary uppercase">
              {group.title}
            </h4>
            <dl
              aria-label={`${card.name}, ${group.title}, at level ${String(current.level)}`}
              className="grid gap-1"
            >
              {group.stats.map((stat) => (
                <div
                  key={stat.name}
                  className="flex justify-between gap-4 border-b border-border/50 pb-1 text-sm last:border-b-0"
                >
                  <dt className="text-muted-foreground">{stat.name}</dt>
                  <dd className="tabular-nums">{formatVehicleStat(stat)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}
