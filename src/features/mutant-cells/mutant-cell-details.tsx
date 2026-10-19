"use client";

import { X } from "lucide-react";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { MutantCellEffect } from "@/data/mutant-cells";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { SocketIcon } from "@/features/modules/fact-icons";
import { cn } from "@/lib/utils";
import type { MutantCellCard } from "./mutant-cell-filters";

/**
 * A cell's icon on a square tile, the art each card leads with (ADR 0038). Decorative:
 * the name beside it says the same. A cell with no icon listed shows its socket's.
 */
export function CellTile({
  card,
  size,
}: {
  card: MutantCellCard;
  size: "md" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-xl border bg-background/60",
        size === "md" ? "size-16" : "size-20",
      )}
    >
      {card.imageUrl === null ? (
        <SocketIcon
          socket={card.socket}
          className={size === "md" ? "size-8" : "size-10"}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
        <img
          src={card.imageUrl}
          alt=""
          width={144}
          height={144}
          loading="lazy"
          decoding="async"
          className="size-full object-contain p-1"
        />
      )}
    </span>
  );
}

/** A cell's socket: the Library's socket icon beside its name. */
export function SocketLabel({
  socket,
  suffix = "",
}: {
  socket: string;
  /** Words after the socket's name: " socket". */
  suffix?: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <SocketIcon socket={socket} className="size-3.5" />
      {socket}
      {suffix}
    </span>
  );
}

/**
 * A Mutant Cell's details, opened under its card's row (ADR 0038): its socket, what
 * sets it off and every effect with its numbers. Keyed by cell, so another starts
 * afresh.
 */
export function MutantCellDetails({
  id,
  card,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  card: MutantCellCard;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRevealDetails(sectionRef, titleRef);

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
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border border-primary/40 bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6 lg:grid-cols-2 lg:gap-8"
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

      <div className="grid content-start gap-4">
        <div className="flex items-center gap-4 pr-10">
          <CellTile card={card} size="lg" />
          <div className="grid gap-1">
            <h2
              ref={titleRef}
              id={`${ids}-title`}
              tabIndex={-1}
              className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
            >
              {card.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              <SocketLabel socket={card.socket} suffix=" socket" />
            </p>
          </div>
        </div>
        {/* NEXON breaks some descriptions into lines, one per trigger. */}
        <p className="leading-relaxed whitespace-pre-line">
          {card.description}
        </p>
      </div>

      {/* Beside the header on wide screens, clear of the close button above it. */}
      <div className="grid content-start gap-3 lg:pr-10">
        {card.effects.map((effect, index) => (
          <EffectBlock
            // No cell has two sections under one heading.
            key={effect.title ?? String(index)}
            effect={effect}
          />
        ))}
      </div>
    </section>
  );
}

/** One effect's numbers, as name and value rows. */
function EffectBlock({ effect }: { effect: MutantCellEffect }) {
  return (
    <div className="grid gap-3 rounded-xl border bg-card/60 p-4">
      <h3 className="text-xs font-medium tracking-wide text-primary uppercase">
        {effect.title ?? "Effect"}
      </h3>
      <dl className="grid gap-2 text-sm">
        {effect.stats.map((stat) => (
          <div
            key={stat.name}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-border/60 pb-2 last:border-b-0 last:pb-0"
          >
            <dt className="text-muted-foreground">{stat.name}</dt>
            <dd className="font-medium tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
