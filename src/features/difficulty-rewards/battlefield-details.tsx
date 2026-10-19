"use client";

import { ArrowUpRight, RotateCw, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useId, useRef, useState } from "react";
import { useSlideIn } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { dataFileHook } from "@/features/game-data/data-file";
import { filterChipClass } from "@/features/game-data/filter-row";
import { Box, BoxColumns, isWideBox } from "@/features/game-data/place-groups";
import { useRevealDetails } from "@/features/game-data/reveal-details";
import {
  battlefieldDataUrl,
  difficulties,
  readBattlefieldDrops,
  type Difficulty,
  type PlaceDrops,
} from "./battlefield-drops";
import { rewardIn, type Battlefield } from "./reward-filters";
import { RewardText, RewardTile, type AttributeIcons } from "./reward-tile";
import { weekDate, weekLabel, weekSpan } from "./reward-week";

/** A battlefield's drops, loaded when its details open. */
const useBattlefieldDrops = dataFileHook(readBattlefieldDrops);

const linkClass =
  "group/link inline-flex items-center gap-0.5 rounded-sm text-sm text-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";
const arrowClass =
  "size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary";

/**
 * A battlefield's details, opened in the grid as a row under its card's row (ADR 0048):
 * its reward in the shown week and every published week after this one, and what drops
 * in its missions, Vulgus Strategic Outpost and Void Fusion Reactor on each difficulty.
 * Keyed by battlefield, so another starts afresh.
 */
export function BattlefieldDetails({
  id,
  battlefield,
  rotations,
  week,
  attributeIcons,
  onPickWeek,
  onClose,
}: {
  /** The section's id, for its card's `aria-controls`. */
  id: string;
  battlefield: Battlefield;
  /** The shown weeks, from this week on; empty while this week isn't published. */
  rotations: readonly number[];
  /** The week the page shows, or null. */
  week: number | null;
  attributeIcons: AttributeIcons;
  onPickWeek: (rotation: number) => void;
  onClose: () => void;
}) {
  const ids = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("Hard");
  const drops = useBattlefieldDrops(battlefieldDataUrl(battlefield.slug));
  const boxesRef = useSlideIn<HTMLDivElement>(difficulty, difficulties);
  useRevealDetails(sectionRef, titleRef);

  const current = rotations.at(0);
  const last = rotations.at(-1);
  const reward = week === null ? null : rewardIn(battlefield, week);

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

      <div className="grid content-start gap-5">
        <div className="flex items-center gap-4 pr-10">
          <RewardTile
            reward={reward}
            attributeIcons={attributeIcons}
            size="lg"
          />
          <h3
            ref={titleRef}
            id={`${ids}-title`}
            tabIndex={-1}
            className="min-w-0 font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
          >
            <span className="block text-sm font-medium tracking-normal text-muted-foreground">
              {battlefield.region}
            </span>{" "}
            {battlefield.name}
          </h3>
        </div>

        {week === null || current === undefined ? (
          <p className="text-sm text-muted-foreground">
            This week&apos;s rewards aren&apos;t published yet.
          </p>
        ) : reward === null ? null : (
          <div className="grid justify-items-start gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {weekLabel(week, current)}
            </span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
              <RewardText reward={reward} attributeIcons={attributeIcons} />
            </span>
            <span className="text-sm text-muted-foreground">
              {reward.kind === "reactor" ? "Reactor" : "External component"}
            </span>
            {reward.kind === "reactor" ? (
              <Link
                href={`/reactors?attribute=${encodeURIComponent(reward.attribute)}&type=${encodeURIComponent(reward.archeType)}`}
                prefetch={false}
                className={`${linkClass} mt-1`}
              >
                Reactors with this attribute and Arche type
                <ArrowUpRight aria-hidden="true" className={arrowClass} />
              </Link>
            ) : (
              <Link
                href="/external-components"
                prefetch={false}
                className={`${linkClass} mt-1`}
              >
                All external components
                <ArrowUpRight aria-hidden="true" className={arrowClass} />
              </Link>
            )}
          </div>
        )}
      </div>

      <section
        aria-labelledby={`${ids}-weeks`}
        className="grid content-start gap-2"
      >
        <h4
          id={`${ids}-weeks`}
          className="text-xs font-medium text-muted-foreground"
        >
          Rewards by week
        </h4>
        {current === undefined || last === undefined ? (
          <p className="text-sm text-muted-foreground">Not published yet</p>
        ) : (
          <ol className="grid gap-1">
            {rotations.map((rotation) => {
              const weekReward = rewardIn(battlefield, rotation);
              const label = weekLabel(rotation, current);
              return (
                <li key={rotation}>
                  <button
                    type="button"
                    aria-pressed={rotation === week}
                    onClick={() => {
                      onPickWeek(rotation);
                    }}
                    className="grid w-full grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-primary/10 aria-pressed:ring-1 aria-pressed:ring-primary/60"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {label}
                      <span className="sr-only">, {weekSpan(rotation)}: </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {weekReward === null ? (
                        "Not published yet"
                      ) : (
                        <RewardText
                          reward={weekReward}
                          attributeIcons={attributeIcons}
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
            <li className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 px-2 py-1.5 text-sm text-muted-foreground">
              <span className="text-xs font-medium">
                From {weekDate(last + 1)}
              </span>
              <span>Not published yet</span>
            </li>
          </ol>
        )}
      </section>

      <section
        aria-labelledby={`${ids}-drops`}
        className="grid content-start gap-4 lg:col-span-2"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h4
            id={`${ids}-drops`}
            className="font-display text-lg font-semibold tracking-wide"
          >
            What drops here
          </h4>
          <ToggleGroup
            aria-label="Difficulty"
            variant="outline"
            size="sm"
            spacing={1}
            className="flex-wrap"
            value={[difficulty]}
            onValueChange={(value) => {
              const next = value.at(0);
              if (next === "Normal" || next === "Hard") {
                setDifficulty(next);
              }
            }}
          >
            {difficulties.map((entry) => (
              <ToggleGroupItem
                key={entry}
                value={entry}
                className={filterChipClass}
              >
                {entry}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {/* Hard missions sit in their battlefields by Update 1.4.0's table; Normal
              ones only by the same names, which the game hasn't been checked for. */}
          {difficulty === "Normal" ? (
            <Badge variant="destructive">
              <TriangleAlert aria-hidden="true" />
              Provisional: not verified in game yet
            </Badge>
          ) : null}
        </div>
        <div ref={boxesRef}>
          {drops.status === "loading" ? (
            <p aria-busy="true" className="text-sm text-muted-foreground">
              Loading what drops here…
            </p>
          ) : drops.status === "failed" ? (
            <div className="grid justify-items-start gap-3 rounded-xl border border-dashed p-4">
              <p className="text-sm text-muted-foreground">
                What drops here couldn&apos;t be loaded.
              </p>
              <Button variant="outline" size="sm" onClick={drops.retry}>
                <RotateCw aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : (
            <DropBoxes places={drops.file[difficulty]} />
          )}
        </div>
      </section>
    </section>
  );
}

/** Each place in its own box: its items A–Z, each with its ways as tags. */
function DropBoxes({ places }: { places: readonly PlaceDrops[] }) {
  if (places.length === 0) {
    return <p className="text-sm text-muted-foreground">Not listed yet</p>;
  }
  const total = places.reduce((sum, place) => sum + place.items.length, 0);
  return (
    <BoxColumns>
      {places.map((place) => (
        <Box
          key={place.place}
          title={place.place}
          wide={isWideBox(place.items.length, total)}
        >
          {place.items.length === 0 ? (
            <li className="text-muted-foreground">No drops listed</li>
          ) : (
            place.items.map((item) => (
              // A wrapped line hangs under the name, as in "Where to find it".
              <li key={item.name} className="pl-3 -indent-3">
                {item.href === null ? (
                  item.name
                ) : (
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="rounded-sm underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 outline-none hover:text-primary hover:decoration-current hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {item.name}
                  </Link>
                )}
                {item.ways.map((way) => (
                  <Fragment key={way}>
                    {" "}
                    <span className="ml-1 inline-block rounded-md bg-secondary px-1.5 py-0.5 indent-0 align-[0.0625rem] text-[0.6875rem] leading-snug text-muted-foreground">
                      {way}
                    </span>
                  </Fragment>
                ))}
              </li>
            ))
          )}
        </Box>
      ))}
    </BoxColumns>
  );
}
