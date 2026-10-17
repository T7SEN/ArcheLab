"use client";

import { useId, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSlideIn } from "@/components/motion";
import {
  coreOptionLabel,
  formatCoreRange,
  romanGrade,
  type CoreType,
} from "./core-types";
import { filterChipClass } from "./filter-row";

/** The slots a type fits, in words: "Fits the Free and Firepower slots". */
function slotsText(slots: readonly string[]): string {
  const names =
    slots.length <= 1
      ? slots.join("")
      : `${slots.slice(0, -1).join(", ")} and ${slots.at(-1) ?? ""}`;
  return `Fits the ${names} slot${slots.length === 1 ? "" : "s"}`;
}

/**
 * Core types side by side, with a core grade switch from I to X starting at the
 * highest: for each type, the slots it fits (when given), the core items it takes at
 * that grade, and the options they can roll, written as the game writes them (ADR
 * 0024, ADR 0027). Shared by weapon pages and the external components index.
 */
export function CoreTypeGrid({
  types,
  headingLevel,
}: {
  types: readonly CoreType[];
  /** The level of each type's heading, under the page's own headings. */
  headingLevel: 3 | 5;
}) {
  const ids = useId();
  const grades = [
    ...new Set(
      types.flatMap((type) => type.grades.map((entry) => entry.grade)),
    ),
  ].sort((a, b) => a - b);
  const [picked, setPicked] = useState<number | null>(null);
  const grade = picked ?? grades.at(-1) ?? 1;
  const Heading = headingLevel === 3 ? "h3" : "h5";
  // A grade switch slides the cards in from its side (ADR 0030).
  const cardsRef = useSlideIn<HTMLDivElement>(
    String(grade),
    grades.map(String),
  );

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <span id={`${ids}-grade`} className="text-xs text-muted-foreground">
          Core grade
        </span>
        <ToggleGroup
          aria-labelledby={`${ids}-grade`}
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          value={[String(grade)]}
          onValueChange={(value) => {
            const next = value.at(0);
            if (next !== undefined) {
              setPicked(Number(next));
            }
          }}
        >
          {grades.map((entry) => (
            <ToggleGroupItem
              key={entry}
              value={String(entry)}
              aria-label={`Grade ${String(entry)}`}
              className={`${filterChipClass} min-w-9 px-2`}
            >
              {romanGrade(entry)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div
        ref={cardsRef}
        className={`grid gap-3 sm:grid-cols-2 ${types.length > 2 ? "xl:grid-cols-3" : ""}`}
      >
        {types.map((type) => {
          const at = type.grades.find((entry) => entry.grade === grade);
          return (
            <div
              key={type.id}
              className="grid content-start gap-2 rounded-lg border bg-background/40 p-3"
            >
              <div className="grid gap-0.5">
                <Heading className="text-sm font-medium">{type.name}</Heading>
                {type.slots.length === 0 ? null : (
                  <span className="text-xs text-muted-foreground">
                    {slotsText(type.slots)}
                  </span>
                )}
              </div>
              {(at?.cores ?? []).map((core) => (
                <span
                  key={core.name}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
                  <img
                    src={core.imageUrl}
                    alt=""
                    width={24}
                    height={24}
                    loading="lazy"
                    decoding="async"
                    className="size-6 shrink-0 rounded bg-background/60 object-contain ring-1 ring-border"
                  />
                  {core.name}
                </span>
              ))}
              <dl className="grid gap-1.5 text-sm">
                {(at?.options ?? []).map((option) => (
                  <div
                    key={option.name}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <dt className="text-foreground/85">
                      {coreOptionLabel(option)}
                    </dt>
                    <dd className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {formatCoreRange(option)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
