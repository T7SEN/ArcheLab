"use client";

import { RotateCw, X } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSlideIn } from "@/components/motion";
import { dataFileHook } from "@/features/game-data/data-file";
import { filterChipClass } from "@/features/game-data/filter-row";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { CategoryIcon, SlotIcon, SocketIcon } from "./fact-icons";
import { ModuleEffect } from "./module-effect";
import {
  shownType,
  type ModuleCard,
  type ModuleVariantCard,
} from "./module-filters";
import {
  moduleDataUrl,
  readLevelsFile,
  type ModuleLevel,
} from "./module-levels";

/** A module group's levels, loaded when its details open. */
const useLevelsFile = dataFileHook(readLevelsFile);

/**
 * A module's details, opened in the index's grid as a row under its card's row (T7SEN,
 * 2026-10-16; ADR 0025): its versions, facts, and capacity and effect at every level.
 * The index opens it from a card or from `?module=` in the URL, and keys it by module,
 * so another module starts on its own first version.
 */
export function ModuleDetails({
  id,
  card,
  initialVariant,
  colorOf,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  card: ModuleCard;
  /** The version to show first: the first one the index's filters let through. */
  initialVariant: string;
  /** A tier's color, by its name. */
  colorOf: (tier: string) => string;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [variantId, setVariantId] = useState(initialVariant);
  const variant =
    card.variants.find((entry) => entry.id === variantId) ??
    card.variants.at(0);
  const levels = useLevelsFile(moduleDataUrl(card.slug));
  // A version switch slides in what changes, from its side (ADR 0030).
  const versionOrder = card.variants.map((entry) => entry.id);
  const factsRef = useSlideIn<HTMLDivElement>(variantId, versionOrder);
  const effectRef = useSlideIn<HTMLElement>(variantId, versionOrder);

  useRevealDetails(sectionRef, titleRef);

  if (variant === undefined) {
    return null;
  }
  const color = colorOf(variant.tier);

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
        borderColor: `color-mix(in srgb, ${color} 45%, var(--border))`,
        backgroundImage: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${color} 12%, transparent), transparent 60%)`,
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
        <div className="flex items-center gap-4 pr-10">
          <ModuleTile imageUrl={variant.imageUrl} color={color} size="lg" />
          <div className="grid min-w-0 gap-1.5">
            <h2
              ref={titleRef}
              id={`${ids}-title`}
              tabIndex={-1}
              className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
            >
              {card.name}
            </h2>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span
                className="rounded-full border px-2 py-0.5 text-xs font-medium"
                style={{
                  color,
                  borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
                }}
              >
                {variant.tier}
              </span>
              {shownType(variant) === null ? null : (
                <span>{shownType(variant)}</span>
              )}
            </p>
          </div>
        </div>

        {card.variants.length > 1 ? (
          <div className="grid gap-2">
            <span
              id={`${ids}-version`}
              className="text-xs font-medium text-muted-foreground"
            >
              {String(card.variants.length)} versions
            </span>
            <ToggleGroup
              aria-labelledby={`${ids}-version`}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap"
              value={[variant.id]}
              onValueChange={(value) => {
                const next = value.at(0);
                if (next !== undefined) {
                  setVariantId(next);
                }
              }}
            >
              {card.variants.map((entry) => (
                <ToggleGroupItem
                  key={entry.id}
                  value={entry.id}
                  className={`${filterChipClass} h-auto min-h-7 py-1 text-left whitespace-normal`}
                >
                  <CategoryIcon category={entry.category} />
                  {entry.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ) : null}

        <div ref={factsRef} className="grid">
          <Facts variant={variant} />
        </div>
      </div>

      <section
        ref={effectRef}
        aria-labelledby={`${ids}-levels`}
        className="grid content-start gap-4"
      >
        <h3
          id={`${ids}-levels`}
          className="font-display text-lg font-semibold tracking-wide"
        >
          Effect
        </h3>
        {levels.status === "loading" ? (
          <p aria-busy="true" className="text-sm text-muted-foreground">
            Loading its levels…
          </p>
        ) : levels.status === "failed" ? (
          <div className="grid justify-items-start gap-3 rounded-xl border border-dashed p-4">
            <p className="text-sm text-muted-foreground">
              The levels couldn&apos;t be loaded.
            </p>
            <Button variant="outline" size="sm" onClick={levels.retry}>
              <RotateCw aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : (
          <LevelView
            key={variant.id}
            name={card.name}
            levels={levels.file.levels[variant.id] ?? []}
          />
        )}
      </section>
    </section>
  );
}

/** The module art: NEXON's white glyph on a tile in the tier's color. */
export function ModuleTile({
  imageUrl,
  color,
  size,
}: {
  imageUrl: string;
  color: string;
  size: "md" | "lg";
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl border ${size === "lg" ? "size-20" : "size-16"}`}
      style={{
        borderColor: `color-mix(in srgb, ${color} 45%, var(--border))`,
        backgroundImage: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${color} 40%, transparent), color-mix(in srgb, ${color} 10%, transparent) 75%)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
      <img
        src={imageUrl}
        alt=""
        width={256}
        height={256}
        loading="lazy"
        decoding="async"
        className={size === "lg" ? "size-14" : "size-11"}
      />
    </span>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right">
        {children}
      </dd>
    </div>
  );
}

function Facts({ variant }: { variant: ModuleVariantCard }) {
  return (
    <dl className="grid gap-2 rounded-xl border bg-card/60 p-4">
      <Fact label="Class">
        <span className="flex items-center gap-1.5">
          <CategoryIcon category={variant.category} />
          {variant.category}
        </span>
      </Fact>
      {variant.category === "Melee Weapon" && variant.rounds !== null ? (
        <Fact label="Rounds">{variant.rounds}</Fact>
      ) : null}
      {variant.weaponTypes.length === 0 ? null : (
        <Fact label="Weapon type">{variant.weaponTypes.join(", ")}</Fact>
      )}
      {variant.socket === null ? null : (
        <Fact label="Socket">
          <span className="flex items-center gap-1.5">
            <SocketIcon socket={variant.socket} />
            {variant.socket}
          </span>
        </Fact>
      )}
      {shownType(variant) === null ? null : (
        <Fact label="Type">{shownType(variant)}</Fact>
      )}
      {variant.slots.length === 0 ? null : (
        <Fact label="Slot">
          {variant.slots.map((slot) => (
            <span key={slot} className="flex items-center gap-1.5">
              <SlotIcon slot={slot} />
              {slot}
            </span>
          ))}
        </Fact>
      )}
      {variant.owners.length === 0 ? null : (
        <Fact label="Equipped by">
          {variant.owners.map((owner) => (
            <Link
              key={owner.slug}
              href={`/descendants/${owner.slug}`}
              className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {owner.name}
            </Link>
          ))}
        </Fact>
      )}
      {variant.capacity === null ? null : (
        <Fact label="Capacity">
          <span className="tabular-nums">
            {variant.capacity.from === variant.capacity.to
              ? variant.capacity.from
              : `${String(variant.capacity.from)} → ${String(variant.capacity.to)}`}
          </span>
        </Fact>
      )}
    </dl>
  );
}

/** Capacity and effect at a level picked with a slider, starting at the highest. */
function LevelView({
  name,
  levels,
}: {
  name: string;
  levels: readonly ModuleLevel[];
}) {
  const sliderId = useId();
  const lastIndex = levels.length - 1;
  const [index, setIndex] = useState(lastIndex);
  const current = levels.at(index);
  if (current === undefined) {
    return (
      <p className="text-sm text-muted-foreground">
        No levels are listed for this module.
      </p>
    );
  }
  const first = levels.at(0)?.level ?? current.level;
  const last = levels.at(-1)?.level ?? current.level;
  // One level and no capacity (Trigger modules): nothing to pick or show but the effect.
  const levelBox = levels.length > 1 || current.capacity !== null;

  return (
    <div className="grid gap-4">
      {levelBox ? (
        <div className="grid gap-3 rounded-xl border bg-card/60 p-4">
          <div className="flex items-baseline justify-between gap-4">
            {/* The slider's name stays "Level" and its value text says the level, so the
              big number is for the eye only, as on Descendant and weapon pages. A
              module with one level has no slider, so its level is plain text. */}
            {levels.length > 1 ? (
              <label htmlFor={sliderId} className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Level</span>
                <span
                  aria-hidden="true"
                  className="min-w-[2ch] font-display text-3xl font-semibold text-primary tabular-nums"
                >
                  {current.level}
                </span>
              </label>
            ) : (
              <span className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Level</span>
                <span className="min-w-[2ch] font-display text-3xl font-semibold text-primary tabular-nums">
                  {current.level}
                </span>
              </span>
            )}
            {current.capacity === null ? null : (
              <span className="text-sm text-muted-foreground">
                Capacity{" "}
                <span className="font-display text-2xl font-semibold text-foreground tabular-nums">
                  {current.capacity}
                </span>
              </span>
            )}
          </div>
          {levels.length > 1 ? (
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
          ) : null}
        </div>
      ) : null}
      <div
        aria-label={`${name} at level ${String(current.level)}`}
        role="group"
        className="rounded-xl border bg-card/40 p-4"
      >
        <ModuleEffect effect={current.effect} />
      </div>
    </div>
  );
}
