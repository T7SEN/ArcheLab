"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSlideIn } from "@/components/motion";
import {
  coreHref,
  coreOptionLabel,
  formatCoreRange,
  romanGrade,
  type CoreGrade,
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
 * 0024, ADR 0027). Shared by weapon pages and the external components index. Each
 * type's name links its card on the Cores index (ADR 0044).
 */
export function CoreTypeGrid({
  types,
  headingLevel,
  weaponType,
}: {
  types: readonly CoreType[];
  /** The level of each type's heading, under the page's own headings. */
  headingLevel: 3 | 5;
  /** A weapon's type ("Launcher"), so the Cores index shows that type's rolls. */
  weaponType?: string;
}) {
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
      <CoreGradeSwitch grades={grades} grade={grade} onPick={setPicked} />
      <div
        ref={cardsRef}
        className={`grid gap-3 sm:grid-cols-2 ${types.length > 2 ? "xl:grid-cols-3" : ""}`}
      >
        {types.map((type) => (
          <CoreTypeCard
            key={type.id}
            heading={
              <Heading className="text-sm font-medium">
                <Link
                  href={coreHref(type.name, weaponType)}
                  prefetch={false}
                  className="group/core inline-flex items-center gap-1 rounded-sm underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {type.name}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/core:text-primary"
                  />
                </Link>
              </Heading>
            }
            note={type.slots.length === 0 ? undefined : slotsText(type.slots)}
            at={type.grades.find((entry) => entry.grade === grade)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The core grade switch, from I to X: its label, then a chip per grade. Shared by
 * `CoreTypeGrid` and the Cores index's details (ADR 0044).
 */
export function CoreGradeSwitch({
  grades,
  grade,
  onPick,
}: {
  grades: readonly number[];
  grade: number;
  onPick: (grade: number) => void;
}) {
  const id = useId();
  return (
    <div className="grid gap-2">
      {/* As every filter's and switch's label (`filter-row.tsx`). */}
      <span id={id} className="text-xs font-medium text-muted-foreground">
        Core grade
      </span>
      <ToggleGroup
        aria-labelledby={id}
        variant="outline"
        size="sm"
        spacing={1}
        className="flex-wrap"
        value={[String(grade)]}
        onValueChange={(value) => {
          const next = value.at(0);
          if (next !== undefined) {
            onPick(Number(next));
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
  );
}

/**
 * One core type at one grade, in a box like the drop places' (ADR 0045): its heading
 * and a note when given, the core items it takes, each with its art in a tile of the
 * art's shape, and the options they can roll. Shared by `CoreTypeGrid` and the Cores
 * index's details, so a core is drawn one way (ADR 0044).
 */
export function CoreTypeCard({
  heading,
  note,
  at,
}: {
  /** The caller's heading element, at the level its page needs; null for none. */
  heading: ReactNode;
  /** Under the heading, muted: "Fits the Free and Firepower slots". */
  note?: string;
  at: CoreGrade | undefined;
}) {
  return (
    <div className="grid content-start gap-2 rounded-xl border bg-background/40 p-3">
      {heading === null && note === undefined ? null : (
        <div className="grid gap-0.5">
          {heading}
          {note === undefined ? null : (
            <span className="text-xs text-muted-foreground">{note}</span>
          )}
        </div>
      )}
      {(at?.cores ?? []).map((core) => (
        <span
          key={core.name}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
          <img
            src={core.imageUrl}
            alt=""
            width={40}
            height={24}
            loading="lazy"
            decoding="async"
            className="h-6 w-10 shrink-0 rounded bg-background/60 object-contain ring-1 ring-border"
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
            <dt className="text-foreground/85">{coreOptionLabel(option)}</dt>
            <dd className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {formatCoreRange(option)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
