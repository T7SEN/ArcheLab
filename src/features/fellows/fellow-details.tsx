"use client";

import { X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  anyFellowEffect,
  fellowPassives,
  type FellowEffect,
} from "@/data/fellows";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { ResearchRecipe } from "@/features/game-data/research-recipe";
import { TierPill } from "@/features/game-data/showcase";
import { fellowNumbersAt, type FellowCard } from "./fellow-card";
import { PassiveIcon } from "./passive-icon";

/**
 * A Fellow's details, opened under its card's row (ADR 0035): its passive, the
 * Inversion Reinforcement effects it unlocks, its numbers at every level from a slider,
 * and its research. Keyed by Fellow, so another starts afresh.
 */
export function FellowDetails({
  id,
  card,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  card: FellowCard;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRevealDetails(sectionRef, titleRef);
  const passive = card.passive === null ? null : fellowPassives[card.passive];
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
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6 lg:grid-cols-2 lg:gap-8"
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

      <div className="grid content-start gap-5">
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
                Levels {first}–{last}
              </span>
            )}
          </p>
        </div>

        {passive === null || card.passive === null ? null : (
          <div className="grid gap-2 rounded-xl border bg-card/60 p-4">
            <h3 className="text-xs font-medium tracking-wide text-primary uppercase">
              Passive
            </h3>
            <p className="flex items-center gap-2 font-medium">
              <PassiveIcon
                passive={card.passive}
                className="size-4 text-primary"
              />
              {passive.name}
            </p>
          </div>
        )}

        <div className="grid gap-3 rounded-xl border bg-card/60 p-4">
          <h3 className="text-xs font-medium tracking-wide text-primary uppercase">
            Inversion Reinforcement
          </h3>
          <ul className="grid gap-3">
            {[card.effect, anyFellowEffect].map((effect) =>
              effect === null ? null : (
                <EffectItem key={effect.name} effect={effect} />
              ),
            )}
          </ul>
        </div>
      </div>

      <LevelView card={card} />

      {card.research === null ? null : (
        <div className="lg:col-span-2">
          <ResearchRecipe name={card.name} recipe={card.research} inPanel />
        </div>
      )}
    </section>
  );
}

/** An Inversion Reinforcement effect, worded as the notes word it. */
function EffectItem({ effect }: { effect: FellowEffect }) {
  return (
    <li className="grid gap-1 text-sm">
      <span className="font-medium">{effect.name}</span>
      <span className="text-muted-foreground">{effect.condition}.</span>
      <span>{effect.effect}</span>
    </li>
  );
}

/** The Fellow's numbers at a level, from a slider (`fellowNumbersAt`). */
function LevelView({ card }: { card: FellowCard }) {
  const ids = useId();
  const sliderId = `${ids}-level`;
  const lastIndex = card.levels.length - 1;
  const [index, setIndex] = useState(lastIndex);
  const current = card.levels.at(index);
  if (current === undefined) {
    return (
      <p className="text-sm text-muted-foreground">
        No levels are listed for this Fellow.
      </p>
    );
  }
  const first = card.levels.at(0)?.level ?? current.level;
  const last = card.levels.at(-1)?.level ?? current.level;

  return (
    <section
      aria-labelledby={`${ids}-levels`}
      className="grid content-start gap-4"
    >
      <h3
        id={`${ids}-levels`}
        className="font-display text-lg font-semibold tracking-wide"
      >
        Stats
      </h3>
      <div className="grid gap-3 rounded-xl border bg-card/60 p-4">
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
      <dl
        aria-label={`${card.name} at level ${String(current.level)}`}
        className="grid gap-3 sm:grid-cols-2"
      >
        {fellowNumbersAt(card, current.level).map((number) => (
          <div
            key={number.name}
            className="grid content-start gap-1 rounded-xl border bg-card/40 p-3"
          >
            <dt className="text-sm text-muted-foreground">{number.name}</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">
              {number.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
