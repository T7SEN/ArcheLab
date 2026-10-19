"use client";

import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useSlideIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import {
  CoreGradeSwitch,
  CoreTypeCard,
} from "@/features/game-data/core-type-grid";
import { romanGrade } from "@/features/game-data/core-types";
import {
  Box,
  BoxColumns,
  isWideBox,
  PlaceGroups,
} from "@/features/game-data/place-groups";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import { WideTile } from "@/features/game-data/wide-tile";
import {
  shownVersions,
  shownWeapons,
  componentGroups,
  slotSummary,
  weaponsByType,
  type CoreComponent,
  type CoreKind,
} from "./core-filters";
import { EquipmentBadge } from "./equipment-badge";

/** A core's tile color: cores have no tier. */
export const coreColor = "var(--primary)";

/** The external components index with only Ultimate cards, the ones with core slots. */
const ultimateComponentsHref = "/external-components?tier=Ultimate";

/** A weapon's or external component's link in the boxes, with its arrow. */
const linkClass =
  "group/link inline-flex items-center gap-0.5 rounded-sm text-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";
const arrowClass =
  "size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary";

/**
 * An external component card, open on the index at the pieces' tier: a card with
 * several tiers (HP Support) opens on the one that takes cores.
 */
function componentHref(card: CoreComponent): string {
  const params = new URLSearchParams(
    card.tier === null
      ? { component: card.slug }
      : { tier: card.tier, component: card.slug },
  );
  return `/external-components?${params.toString()}`;
}

/** "Firepower and Free": the slots a kind goes in, in words. */
function slotsText(slots: readonly string[]): string {
  return slots.length <= 1
    ? slots.join("")
    : `${slots.slice(0, -1).join(", ")} and ${slots.at(-1) ?? ""}`;
}

/**
 * A core kind's details, opened under its card's row (ADR 0044): a grade switch from I
 * to X, what each version rolls at that grade (on the weapon types that take it), where
 * that grade's cores drop, and the Ultimate weapons, by type, whose slots take it, or
 * the external component cards, each linking its page or its details. With a weapon
 * type chosen, only that type's version and weapons.
 */
export function CoreDetails({
  id,
  kind,
  weaponType,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  kind: CoreKind;
  /** The weapon type filter's slug, or null. */
  weaponType: string | null;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRevealDetails(sectionRef, titleRef);

  const versions = shownVersions(kind, weaponType);
  const weapons = shownWeapons(kind, weaponType);
  const grades = kind.drops.map((entry) => entry.grade);
  const [picked, setPicked] = useState<number | null>(null);
  const grade = picked ?? grades.at(-1) ?? 1;
  const drops = kind.drops.find((entry) => entry.grade === grade)?.items ?? [];
  // A grade switch slides the rolls in from its side (ADR 0030).
  const rollsRef = useSlideIn<HTMLDivElement>(
    String(grade),
    grades.map(String),
  );
  const slots = [...new Set(weapons.flatMap((weapon) => weapon.slots))];

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
      className="relative grid scroll-mt-[calc(var(--site-header-height)+1rem)] scroll-mb-4 gap-6 rounded-2xl border border-primary/40 bg-card/80 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:p-6"
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

      <div className="grid gap-5 pr-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
        <div className="flex items-center gap-4">
          <WideTile
            imageUrl={drops.at(0)?.imageUrl ?? kind.imageUrl}
            color={coreColor}
            size="lg"
          />
          <div className="grid justify-items-start gap-2">
            <h2
              ref={titleRef}
              id={`${ids}-title`}
              tabIndex={-1}
              className="font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
            >
              {kind.name}
            </h2>
            <EquipmentBadge equipment={kind.equipment} size="md" />
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {kind.equipment === "weapons" ? (
            <>
              Fits the {slotsText(slots)} slots of{" "}
              <span className="text-foreground">
                {weapons.length === 1
                  ? "1 Ultimate weapon"
                  : `${String(weapons.length)} Ultimate weapons`}
              </span>
              .
              {versions.length > 1
                ? " What it rolls depends on the weapon type."
                : null}
            </>
          ) : (
            <>
              {/* Counted in cards, sets and components with no set, as the
                  external components index counts them, not in pieces. */}
              Fits a core slot of{" "}
              <Link
                href={ultimateComponentsHref}
                className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {kind.componentCards.length === 1
                  ? "1 Ultimate external component"
                  : `${String(kind.componentCards.length)} Ultimate external components`}
              </Link>
              .
            </>
          )}
        </p>
      </div>

      <CoreGradeSwitch grades={grades} grade={grade} onPick={setPicked} />

      <div className="grid gap-3">
        <h3 className="text-xs font-medium text-muted-foreground">
          {`What it rolls at grade ${romanGrade(grade)}`}
        </h3>
        <div
          ref={rollsRef}
          className={`grid items-start gap-3 ${versions.length > 1 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}
        >
          {/* The same card as weapon pages' and external components' cores. */}
          {versions.map((version) => (
            <CoreTypeCard
              key={version.id}
              heading={
                versions.length > 1 || weaponType !== null ? (
                  <h4 className="text-sm leading-snug font-medium">
                    {version.weaponTypes.join(", ")}
                  </h4>
                ) : null
              }
              at={version.grades.find((entry) => entry.grade === grade)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <h3 className="text-xs font-medium text-muted-foreground">
          {`Where to find grade ${romanGrade(grade)}`}
        </h3>
        {/* Each core item's places, one under the other, in the boxes the material
            pages use (ADR 0045): Hit's two items each fill the row's columns. */}
        <div className="grid gap-4">
          {drops.map((item) => (
            <div key={item.name} className="grid content-start gap-2">
              {drops.length > 1 ? (
                <h4 className="text-sm font-medium">{item.name}</h4>
              ) : null}
              {item.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not listed yet</p>
              ) : (
                <PlaceGroups names={item.sources} links={item.placeLinks} />
              )}
            </div>
          ))}
        </div>
      </div>

      {kind.componentCards.length === 0 ? null : (
        <div className="grid gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Applies to
          </h3>
          {/* In the drop places' boxes (ADR 0045): sets apart from the components
              with no set effect, as the external components index tells them. The
              long Sets box spans the row, its lines in columns (`isWideBox`). */}
          <BoxColumns>
            {componentGroups(kind.componentCards).map((group) => (
              <Box
                key={group.title}
                title={group.title}
                wide={isWideBox(group.cards.length, kind.componentCards.length)}
              >
                {group.cards.map((card) => (
                  <li key={card.slug}>
                    <Link
                      href={componentHref(card)}
                      prefetch={false}
                      className={linkClass}
                    >
                      {card.name}
                      <ArrowUpRight aria-hidden="true" className={arrowClass} />
                    </Link>
                  </li>
                ))}
              </Box>
            ))}
          </BoxColumns>
        </div>
      )}

      {weapons.length === 0 ? null : (
        <div className="grid gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">
            Applies to
          </h3>
          {/* A box per weapon type, in the drop places' boxes (ADR 0045); one holding
              most of the weapons would span the row (`isWideBox`). */}
          <BoxColumns>
            {weaponsByType(weapons).map((group) => (
              <Box
                key={group.type}
                title={group.type}
                wide={isWideBox(group.weapons.length, weapons.length)}
              >
                {group.weapons.map((weapon) => (
                  <li
                    key={weapon.slug}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <Link
                      href={`/weapons/${weapon.slug}`}
                      prefetch={false}
                      className={linkClass}
                    >
                      {weapon.name}
                      <ArrowUpRight aria-hidden="true" className={arrowClass} />
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {slotSummary(weapon.slots)}
                    </span>
                  </li>
                ))}
              </Box>
            ))}
          </BoxColumns>
        </div>
      )}
    </section>
  );
}
