"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  Bell,
  BellRing,
  CalendarDays,
  ChevronRight,
  Clock,
  Expand,
  Gift,
  ListOrdered,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { motionAllowed, useSlideIn } from "@/components/motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  askForNotices,
  savedStore,
  toggled,
  useNoticePermission,
  type SavedMissions,
} from "@/features/axion/saved-missions";
import {
  detailsScrollMargin,
  useDetailsFocus,
  useDetailsRequest,
} from "@/features/game-data/details-focus";
import { filterChipClass } from "@/features/game-data/filter-row";
import { useSearch, writeSearch } from "@/features/game-data/url-query";
import {
  rewardEntries,
  type DropKind,
} from "@/features/infiltration-400/operation-filters";
import { RewardTile } from "@/features/infiltration-400/operation-index";
import { useSecondClock } from "@/features/infiltration-400/use-day-400";
import { slugOf } from "@/lib/slug";
import {
  dayDate,
  dayLabel,
  daySpan,
  dayStart,
  daysOf,
  mapOn,
} from "./purge-day";
import {
  defaultStage,
  parsePurgeFilters,
  purgeFiltersToSearch,
  scheduleFrom,
  scheduleTo,
  type PurgeDifficulty,
  type PurgeFilters,
  type PurgeMap,
  type PurgeStage,
} from "./purge-filters";
import { usePurgeDay } from "./use-purge-day";

/** The page's address, for its links. */
const indexPath = "/void-erosion-purge";

/** How many rewards the list shows before "Show all": three rows on wide screens. */
const rewardsFirst = 9;

/** How many of a map's next days its panel lists. */
const nextTurns = 4;

/** The reward tabs: every drop, then by kind. */
const rewardTabs: readonly {
  readonly kind: DropKind | "all";
  readonly label: string;
}[] = [
  { kind: "all", label: "All" },
  { kind: "material", label: "Materials" },
  { kind: "core", label: "Cores" },
];

const difficulties: readonly PurgeDifficulty[] = ["Normal", "Challenge"];

/** The maps a visitor wants a notice for, in this browser only (ADR 0053). */
const purgeStore = savedStore("archelab:purge-maps");

// In the browser's time zone: these only run once the browser knows the time.
const clock = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const pad = (value: number) => String(value).padStart(2, "0");

/** "UTC+3", "UTC−4:30": the visitor's offset at a moment. */
function zoneAt(ms: number): string {
  const minutes = -new Date(ms).getTimezoneOffset();
  const sign = minutes < 0 ? "−" : "+";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `UTC${sign}${String(hours)}${rest === 0 ? "" : `:${pad(rest)}`}`;
}

/** "20:30:12" to a moment, from `now`. */
function countdown(to: number, now: number): string {
  const left = Math.max(0, to - now);
  return `${pad(Math.floor(left / 3_600_000))}:${pad(Math.floor((left % 3_600_000) / 60_000))}:${pad(Math.floor((left % 60_000) / 1000))}`;
}

/** Whether a click is a plain left click, which the page handles in place. */
function plainClick(event: MouseEvent): boolean {
  return !(
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

/** When a map comes next: "Today", "Tomorrow", "Next Wed 21 Oct". */
function nextText(day: number, today: number): string {
  if (day === today) {
    return "Today";
  }
  return day === today + 1 ? "Tomorrow" : `Next ${dayDate(day)}`;
}

interface PurgeProps {
  maps: readonly PurgeMap[];
  stages: readonly PurgeStage[];
}

/** The page filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function VoidErosionPurgeFromUrl(props: PurgeProps) {
  return <VoidErosionPurge {...props} search={useSearch()} />;
}

/**
 * The Void Erosion Purge page (ADR 0053), tfdhub.gg's Void Erosion Purge page and
 * ArcheLab's Axion Operational Areas page in one (T7SEN, 2026-10-19): today's Stage 10
 * map, the time to the reset and tomorrow's map; the maps of yesterday, today and the
 * days ahead; the five-map cycle with an alert each; the chosen map in large; and what
 * each stage gives, in tabs. The day is worked out in the browser; with `search` "" and
 * no day yet, this is what the static HTML holds.
 */
export function VoidErosionPurge({
  maps,
  stages,
  search,
}: PurgeProps & {
  /** The URL query the choice comes from. */
  search: string;
}) {
  const ids = useId();
  const today = usePurgeDay();
  const saved = purgeStore.useSaved();
  const filters = parsePurgeFilters(search, {
    maps: maps.map((map) => map.slug),
    stages: stages.map((stage) => stage.slug),
  });
  const byName = new Map(maps.map((map) => [map.name, map]));
  const bySlug = new Map(maps.map((map) => [map.slug, map]));
  const todays = today === null ? undefined : byName.get(mapOn(today) ?? "");
  const chosen =
    (filters.map === null ? undefined : bySlug.get(filters.map)) ??
    todays ??
    maps.at(0) ??
    null;
  const stage =
    stages.find((entry) => entry.slug === (filters.stage ?? defaultStage)) ??
    stages.at(0) ??
    null;
  const choose = (change: Partial<PurgeFilters>) => {
    writeSearch(purgeFiltersToSearch({ ...filters, ...change }));
  };
  // A map picked here, or named by the link the page opened on, brings it into view;
  // a link that names a stage opens on its rewards (T7SEN, 2026-10-19).
  const mapDetails = useDetailsRequest(filters.map !== null);
  const stageDetails = useDetailsRequest(
    filters.stage !== null && filters.map === null,
  );
  const pick = (map: PurgeMap) => {
    choose({ map: map.slug });
    mapDetails.focus();
  };
  const hrefOf = (map: PurgeMap) =>
    `${indexPath}${purgeFiltersToSearch({ ...filters, map: map.slug })}`;

  useMapAlerts(today, saved);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {today === null ? (
        <p
          role="status"
          aria-busy="true"
          className="rounded-2xl border bg-card/60 p-5 text-sm text-muted-foreground"
        >
          Stage 10&apos;s map changes every day at 07:00 UTC.
        </p>
      ) : (
        <NowBoxes
          today={today}
          byName={byName}
          hrefOf={hrefOf}
          onChoose={pick}
        />
      )}

      <section
        aria-labelledby={`${ids}-schedule`}
        className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <h2
              id={`${ids}-schedule`}
              className="flex items-center gap-2 font-display text-lg font-semibold tracking-wider uppercase"
            >
              <CalendarDays
                aria-hidden="true"
                className="size-4 text-primary"
              />
              Rotation schedule
            </h2>
            <p className="text-sm text-muted-foreground">
              Normal Stage 10 takes one of five maps each day, in the same
              order. Pick a map to see it.
            </p>
          </div>
          {today === null ? null : (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              <Clock aria-hidden="true" className="size-3.5" />
              Changes at {clock.format(dayStart(today + 1))} your time,{" "}
              {zoneAt(dayStart(today + 1))}
            </span>
          )}
        </div>
        {today === null ? null : (
          <DayStrip
            today={today}
            chosen={chosen}
            byName={byName}
            hrefOf={hrefOf}
            onChoose={pick}
          />
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <MapList
          maps={maps}
          today={today}
          chosen={chosen}
          saved={saved}
          hrefOf={hrefOf}
          onChoose={pick}
        />
        {chosen === null ? null : (
          <MapPanel
            key={chosen.slug}
            map={chosen}
            total={maps.length}
            request={mapDetails.request}
            today={today}
            saved={saved}
          />
        )}
      </div>

      {stage === null ? (
        <p className="rounded-2xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground">
          The stages&apos; rewards couldn&apos;t be loaded for this build. They
          come back with the next one.
        </p>
      ) : (
        <StagePanel
          stages={stages}
          stage={stage}
          request={stageDetails.request}
          onStage={(slug) => {
            choose({ stage: slug });
          }}
        />
      )}
    </div>
  );
}

/**
 * A notice from the browser when a day starts with a map the visitor follows (T7SEN,
 * 2026-10-19): only while the page is open, and only for a change seen here, not for
 * the day the page opened on.
 */
function useMapAlerts(today: number | null, saved: SavedMissions) {
  const seen = useRef<number | null>(null);
  useEffect(() => {
    if (today === null) {
      return;
    }
    const before = seen.current;
    seen.current = today;
    if (
      before === null ||
      before === today ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }
    const name = mapOn(today);
    if (name !== null && saved.alerts.includes(slugOf(name))) {
      new Notification(`${name} is Stage 10's map today`, {
        body: `Void Erosion Purge: until ${clock.format(dayStart(today + 1))}.`,
        tag: `purge-${String(today)}`,
      });
    }
  }, [today, saved]);
}

/**
 * A map's picture, whole, on the map screen's own grey: the art is tfdhub.gg's capture
 * of the map in game (ADR 0053). Plain files on the site, so no image optimization.
 */
function MapArt({
  map,
  className,
  eager = false,
}: {
  map: PurgeMap;
  className: string;
  eager?: boolean;
}) {
  return (
    <span
      className={`grid place-items-center overflow-hidden rounded-lg border bg-background/60 ${className}`}
    >
      {map.imageUrl === "" ? null : (
        // eslint-disable-next-line @next/next/no-img-element -- the site's own files, never through Vercel Image Optimization (SKILL.md landmine 2).
        <img
          src={map.imageUrl}
          alt=""
          width={map.width}
          height={map.height}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-contain"
        />
      )}
    </span>
  );
}

/**
 * The top row, as tfdhub's: today's map, the time to the reset, and tomorrow's map.
 */
function NowBoxes({
  today,
  byName,
  hrefOf,
  onChoose,
}: {
  today: number;
  byName: ReadonlyMap<string, PurgeMap>;
  hrefOf: (map: PurgeMap) => string;
  onChoose: (map: PurgeMap) => void;
}) {
  const box = "grid content-start gap-3 rounded-2xl border bg-card/60 p-4";
  const mapBox = (day: number, label: string, live: boolean) => {
    const map = byName.get(mapOn(day) ?? "");
    return (
      <section
        aria-label={label}
        className={`${box} ${live ? "border-t-2 border-primary/50 border-t-primary" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-wider uppercase">
            {live ? (
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-primary motion-safe:animate-pulse"
              />
            ) : null}
            {label}
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {live
              ? `Until ${clock.format(dayStart(day + 1))}`
              : `From ${clock.format(dayStart(day))}`}
          </span>
        </div>
        {map === undefined ? null : (
          <a
            href={hrefOf(map)}
            onClick={(event) => {
              if (!plainClick(event)) {
                return;
              }
              event.preventDefault();
              onChoose(map);
            }}
            className="flex items-center gap-3 rounded-xl border bg-background/40 p-2 transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <MapArt map={map} className="h-12 w-20 shrink-0" eager />
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="font-display text-base leading-tight font-semibold tracking-wide">
                {map.name}
              </span>
              <span className="text-xs text-muted-foreground">
                Normal Stage 10
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </a>
        )}
      </section>
    );
  };
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      {mapBox(today, "Today's map", true)}
      <ResetBox today={today} />
      {mapBox(today + 1, "Tomorrow's map", false)}
    </div>
  );
}

/** The middle box: the time to the next reset, ticking each second. */
function ResetBox({ today }: { today: number }) {
  const now = useSecondClock();
  return (
    <section
      aria-label="Resets in"
      className="grid place-content-center justify-items-center gap-1 rounded-2xl border bg-card/60 p-4 text-center md:min-w-48"
    >
      <Clock aria-hidden="true" className="size-5 text-primary" />
      <h2 className="text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase">
        Resets in
      </h2>
      <p className="font-display text-3xl font-semibold tracking-wider tabular-nums">
        {now === null ? "--:--:--" : countdown(dayStart(today + 1), now)}
      </p>
      <p className="text-xs text-muted-foreground">Daily at 07:00 UTC</p>
    </section>
  );
}

/**
 * The days around today as a strip of cards, as tfdhub's: yesterday dimmed, today
 * marked and in view, then the days ahead, each with its map.
 */
function DayStrip({
  today,
  chosen,
  byName,
  hrefOf,
  onChoose,
}: {
  today: number;
  chosen: PurgeMap | null;
  byName: ReadonlyMap<string, PurgeMap>;
  hrefOf: (map: PurgeMap) => string;
  onChoose: (map: PurgeMap) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const days = Array.from(
    { length: scheduleTo - scheduleFrom + 1 },
    (_, index) => today + scheduleFrom + index,
  );
  // Today's card scrolls into view.
  useEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const card = list.querySelector<HTMLElement>("[data-today]");
    if (card === null) {
      return;
    }
    list.scrollTo({
      left: card.offsetLeft - list.clientWidth / 2 + card.offsetWidth / 2,
      behavior: motionAllowed() ? "smooth" : "auto",
    });
  }, [today]);
  return (
    <ol
      ref={listRef}
      aria-label="Days"
      className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2"
    >
      {days.map((day) => {
        const map = byName.get(mapOn(day) ?? "");
        if (map === undefined) {
          return null;
        }
        const isToday = day === today;
        const past = day < today;
        const named = day >= today - 1 && day <= today + 1;
        return (
          <li
            key={day}
            data-today={isToday ? "" : undefined}
            className={`relative w-52 shrink-0 snap-start ${past ? "opacity-60" : ""}`}
          >
            <a
              href={hrefOf(map)}
              aria-current={map.slug === chosen?.slug ? "true" : undefined}
              onClick={(event) => {
                if (!plainClick(event)) {
                  return;
                }
                event.preventDefault();
                onChoose(map);
              }}
              className={`grid h-full content-start gap-2 rounded-xl border bg-background/40 p-2.5 transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:border-primary/70 ${isToday ? "border-t-2 border-primary/50 border-t-primary bg-primary/10" : ""}`}
            >
              <span className="flex items-center justify-between gap-2 text-[0.6875rem] font-semibold tracking-wider uppercase">
                <span className={isToday ? "text-primary" : ""}>
                  {named ? dayLabel(day, today) : dayDate(day)}
                </span>
                {named ? (
                  <span className="font-normal tracking-normal text-muted-foreground normal-case">
                    {dayDate(day)}
                  </span>
                ) : null}
              </span>
              <MapArt map={map} className="aspect-[16/10] w-full" />
              <span className="line-clamp-2 min-h-10 text-sm leading-snug font-semibold">
                {map.name}
                <span className="sr-only">, {daySpan(day)}</span>
              </span>
              <span
                className={`justify-self-start rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold tracking-wider uppercase ${isToday ? "border-primary/50 bg-primary/15 text-primary" : "text-muted-foreground"}`}
              >
                {isToday ? "Active" : past ? "Ended" : "Upcoming"}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The five-map cycle, as tfdhub lists it, with a bell each: each opens its map, and the
 * bell sends a notice when its day comes.
 */
function MapList({
  maps,
  today,
  chosen,
  saved,
  hrefOf,
  onChoose,
}: {
  maps: readonly PurgeMap[];
  today: number | null;
  chosen: PurgeMap | null;
  saved: SavedMissions;
  hrefOf: (map: PurgeMap) => string;
  onChoose: (map: PurgeMap) => void;
}) {
  const ids = useId();
  const permission = useNoticePermission();
  const anyAlert = saved.alerts.length > 0;
  return (
    <section
      aria-labelledby={`${ids}-cycle`}
      className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5"
    >
      <div className="grid gap-1 border-b pb-3">
        <h2
          id={`${ids}-cycle`}
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-wider uppercase"
        >
          <ListOrdered aria-hidden="true" className="size-4 text-primary" />
          Five-map cycle
        </h2>
        <p className="text-xs text-muted-foreground">
          After the fifth map, the cycle starts again from the first. A bell
          sends a notice from your browser when that map comes up, while this
          page is open.
        </p>
        {anyAlert && permission === "denied" ? (
          <p role="status" className="text-xs text-destructive">
            Your browser blocks notices from this site. Allow them in its site
            settings to get alerts.
          </p>
        ) : null}
        {anyAlert && permission === "unsupported" ? (
          <p role="status" className="text-xs text-destructive">
            This browser can&apos;t show notices.
          </p>
        ) : null}
      </div>
      <ol className="grid gap-2">
        {maps.map((map) => {
          const isToday = today !== null && mapOn(today) === map.name;
          const next =
            today === null ? undefined : daysOf(map.name, today, 1).at(0);
          return (
            <li
              key={map.slug}
              className={`flex items-center gap-2 rounded-xl border bg-background/40 p-2 ${map.slug === chosen?.slug ? "border-primary/70 bg-primary/10" : ""}`}
            >
              <a
                href={hrefOf(map)}
                aria-current={map.slug === chosen?.slug ? "true" : undefined}
                onClick={(event) => {
                  if (!plainClick(event)) {
                    return;
                  }
                  event.preventDefault();
                  onChoose(map);
                }}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-8 shrink-0 place-items-center rounded-lg border font-display text-sm font-semibold tabular-nums ${isToday ? "border-primary/60 bg-primary/15 text-primary" : "bg-card/70"}`}
                >
                  {map.position}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="font-display text-base leading-tight font-semibold tracking-wide">
                    {map.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {today === null || next === undefined
                      ? `Map ${String(map.position)} of ${String(maps.length)}`
                      : nextText(next, today)}
                  </span>
                </span>
                {isToday ? (
                  <span className="rounded-full border border-primary/50 bg-primary/15 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wider text-primary uppercase">
                    Active
                  </span>
                ) : null}
              </a>
              <AlertButton map={map} saved={saved} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** A map's bell: on, the browser sends a notice when its day comes. */
function AlertButton({
  map,
  saved,
  wide = false,
}: {
  map: PurgeMap;
  saved: SavedMissions;
  wide?: boolean;
}) {
  const alert = saved.alerts.includes(map.slug);
  return (
    <button
      type="button"
      aria-pressed={alert}
      onClick={() => {
        purgeStore.save({ ...saved, alerts: toggled(saved.alerts, map.slug) });
        if (!alert) {
          void askForNotices();
        }
      }}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border bg-card/70 px-2.5 py-1.5 text-xs transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary/60 aria-pressed:bg-primary/15 ${wide ? "" : "self-stretch"}`}
    >
      {alert ? (
        <BellRing aria-hidden="true" className="size-3.5 text-primary" />
      ) : (
        <Bell aria-hidden="true" className="size-3.5" />
      )}
      Alert
      <span className="sr-only">: {map.name}</span>
    </button>
  );
}

/**
 * The chosen map's panel: its name, place in the cycle and next days, its bell, and its
 * picture in large, which opens bigger over the page.
 */
function MapPanel({
  map,
  total,
  request,
  today,
  saved,
}: {
  map: PurgeMap;
  /** How many maps the cycle has. */
  total: number;
  /** Asks for the panel in view, with focus on its heading, each time it goes up. */
  request: number;
  today: number | null;
  saved: SavedMissions;
}) {
  const ids = useId();
  const { panelRef, headingRef } = useDetailsFocus<
    HTMLElement,
    HTMLHeadingElement
  >(request);
  const turns = today === null ? [] : daysOf(map.name, today, nextTurns);
  return (
    <section
      ref={panelRef}
      aria-labelledby={`${ids}-title`}
      className={`grid gap-4 rounded-2xl border border-t-2 border-primary/40 border-t-primary bg-card/60 p-4 duration-300 motion-safe:animate-in motion-safe:fade-in sm:p-5 ${detailsScrollMargin}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <h2
          ref={headingRef}
          id={`${ids}-title`}
          tabIndex={-1}
          className="grid gap-0.5 font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
        >
          <span className="block text-[0.6875rem] font-semibold tracking-wider text-primary uppercase">
            Normal <span aria-hidden="true">•</span>
            <span className="sr-only">,</span> Stage 10
          </span>
          {map.name}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border px-3 py-2 text-xs font-semibold tracking-wider uppercase">
            Map {map.position} of {total}
          </span>
          <AlertButton map={map} saved={saved} wide />
        </div>
      </div>

      {map.imageUrl === "" ? null : <MapZoom map={map} />}

      {turns.length === 0 ? null : (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Next days
          </span>
          {turns.map((day) => (
            <span
              key={day}
              className={`rounded-full border bg-background/40 px-2.5 py-1 text-xs ${day === today ? "border-primary/60 bg-primary/15 text-primary" : ""}`}
            >
              {today === null ? dayDate(day) : dayLabel(day, today)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * The chosen map's picture, which opens bigger over the page, in the same tab (T7SEN,
 * 2026-10-19): Base UI's dialog, as the command palette's (ADR 0022), so Esc, the close
 * button or a click outside closes it and focus goes back to the picture.
 */
function MapZoom({ map }: { map: PurgeMap }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="group/art relative block w-full cursor-zoom-in rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <MapArt map={map} className="aspect-[16/10] w-full" eager />
        <span className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md border bg-card/80 px-2 py-1 text-xs text-muted-foreground transition-colors group-hover/art:text-foreground">
          <Expand aria-hidden="true" className="size-3.5" />
          Enlarge
          <span className="sr-only">: {map.name}</span>
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-background/80 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs motion-reduce:transition-none" />
        <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center p-4">
          <Dialog.Popup className="grid w-full max-w-6xl gap-3 rounded-2xl border bg-popover/95 p-3 text-popover-foreground shadow-2xl shadow-primary/15 transition-[scale,opacity] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <Dialog.Title className="grid gap-0.5 font-display text-lg leading-tight font-semibold tracking-wide">
                <span className="text-[0.6875rem] font-semibold tracking-wider text-primary uppercase">
                  Normal <span aria-hidden="true">•</span>
                  <span className="sr-only">,</span> Stage 10
                </span>
                {map.name}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-lg border bg-card/70 text-muted-foreground transition-colors outline-none hover:border-ring/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- the site's own files, never through Vercel Image Optimization (SKILL.md landmine 2). */}
            <img
              src={map.imageUrl}
              alt={`The map of ${map.name}`}
              width={map.width}
              height={map.height}
              decoding="async"
              className="max-h-[calc(100dvh-8rem)] w-full rounded-lg border bg-background/60 object-contain"
            />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * What each stage gives: Normal or Challenge, its stage, and the stage's rewards as the
 * 400% page's tiles, in tabs by kind. Stage 10 gives the same on every map.
 */
function StagePanel({
  stages,
  stage,
  request,
  onStage,
}: {
  stages: readonly PurgeStage[];
  stage: PurgeStage;
  /** Asks for the panel in view when the page opens on a stage's link. */
  request: number;
  onStage: (slug: string) => void;
}) {
  const ids = useId();
  const { panelRef, headingRef } = useDetailsFocus<
    HTMLElement,
    HTMLHeadingElement
  >(request);
  const offered = difficulties.filter((difficulty) =>
    stages.some((entry) => entry.difficulty === difficulty),
  );
  const ofDifficulty = stages.filter(
    (entry) => entry.difficulty === stage.difficulty,
  );
  return (
    <section
      ref={panelRef}
      aria-labelledby={`${ids}-stages`}
      className={`grid gap-5 rounded-2xl border bg-card/60 p-4 sm:p-5 ${detailsScrollMargin}`}
    >
      <div className="grid gap-1 border-b pb-3">
        <h2
          ref={headingRef}
          id={`${ids}-stages`}
          tabIndex={-1}
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-wider uppercase outline-none"
        >
          <Gift aria-hidden="true" className="size-4 text-primary" />
          Stage rewards
        </h2>
        <p className="text-sm text-muted-foreground">
          What each stage gives on completion and from its monsters. Stage 10
          gives the same on every map.
        </p>
      </div>
      <div className="grid gap-3">
        <ToggleGroup
          aria-label="Difficulty"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          value={[stage.difficulty]}
          onValueChange={(value) => {
            const next = offered.find((entry) => entry === value.at(0));
            if (next === undefined) {
              return;
            }
            // The same stage there, or its last.
            const there = stages.filter((entry) => entry.difficulty === next);
            const same =
              there.find((entry) => entry.stage === stage.stage) ??
              there.at(-1);
            if (same !== undefined) {
              onStage(same.slug);
            }
          }}
        >
          {offered.map((difficulty) => (
            <ToggleGroupItem
              key={difficulty}
              value={difficulty}
              className={filterChipClass}
            >
              {difficulty}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Stage"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          value={[stage.slug]}
          onValueChange={(value) => {
            const next = value.at(0);
            if (next !== undefined) {
              onStage(next);
            }
          }}
        >
          {ofDifficulty.map((entry) => (
            <ToggleGroupItem
              key={entry.slug}
              value={entry.slug}
              aria-label={`Stage ${String(entry.stage)}`}
              className={`${filterChipClass} min-w-10 tabular-nums`}
            >
              {entry.stage}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <StageDrops key={stage.slug} stage={stage} />
    </section>
  );
}

/** A stage's rewards: tabs by kind, three rows of tiles, and "Show all". */
function StageDrops({ stage }: { stage: PurgeStage }) {
  const [tab, setTab] = useState<DropKind | "all">("all");
  const [showAll, setShowAll] = useState(false);
  // Every grade of a kind of core is one entry, so the list stays short.
  const entries = rewardEntries(stage.drops);
  const shown =
    tab === "all" ? entries : entries.filter((entry) => entry.kind === tab);
  const count = (kind: DropKind | "all") =>
    kind === "all"
      ? entries.length
      : entries.filter((entry) => entry.kind === kind).length;
  // A tab switch slides the tiles in from its side (ADR 0030).
  const tilesRef = useSlideIn<HTMLUListElement>(
    tab,
    rewardTabs.map((entry) => entry.kind),
  );
  return (
    <div className="grid gap-3 duration-300 motion-safe:animate-in motion-safe:fade-in">
      <h3 className="flex flex-wrap items-center gap-2 font-display text-base font-semibold tracking-wider uppercase">
        <span aria-hidden="true" className="h-4 w-1 rounded-full bg-primary" />
        {stage.difficulty} Stage {stage.stage}
        <span className="text-xs font-normal tracking-normal text-muted-foreground normal-case">
          {entries.length} rewards
        </span>
      </h3>
      <ToggleGroup
        aria-label="Rewards"
        variant="outline"
        size="sm"
        spacing={1}
        className="flex-wrap"
        value={[tab]}
        onValueChange={(value) => {
          const next = rewardTabs.find((entry) => entry.kind === value.at(0));
          if (next !== undefined) {
            setTab(next.kind);
            setShowAll(false);
          }
        }}
      >
        {rewardTabs.map((entry) => (
          <ToggleGroupItem
            key={entry.kind}
            value={entry.kind}
            className={filterChipClass}
          >
            {entry.label}
            <span className="ml-1 text-muted-foreground tabular-nums">
              {count(entry.kind)}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not listed yet</p>
      ) : (
        <>
          <ul
            ref={tilesRef}
            className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
          >
            {(showAll ? shown : shown.slice(0, rewardsFirst)).map((entry) => (
              <li key={entry.name}>
                <RewardTile entry={entry} />
              </li>
            ))}
          </ul>
          {shown.length > rewardsFirst ? (
            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => {
                setShowAll(!showAll);
              }}
              className="justify-self-center rounded-full border bg-background/40 px-4 py-1.5 text-sm transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {showAll
                ? "Show fewer"
                : `Show all ${String(shown.length)} rewards`}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
