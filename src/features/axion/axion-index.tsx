"use client";

import {
  Bell,
  BellRing,
  CalendarDays,
  ChevronRight,
  Clock,
  Radar,
  Star,
  Swords,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { motionAllowed, useSlideIn } from "@/components/motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  detailsScrollMargin,
  useDetailsFocus,
  useDetailsRequest,
} from "@/features/game-data/details-focus";
import { filterChipClass } from "@/features/game-data/filter-row";
import { LoadFailed } from "@/features/game-data/load-failed";
import { useSearch, writeSearch } from "@/features/game-data/url-query";
import {
  rewardEntries,
  type DropKind,
} from "@/features/infiltration-400/operation-filters";
import { RewardTile } from "@/features/infiltration-400/operation-index";
import { useSecondClock } from "@/features/infiltration-400/use-day-400";
import { slugOf } from "@/lib/slug";
import {
  axionFiltersToSearch,
  localDays,
  parseAxionFilters,
  scheduleDays,
  type AxionFilters,
  type AxionMission,
  type LocalDay,
} from "./mission-filters";
import {
  pairIn,
  rotationStart,
  rotationsBetween,
  rotationsOf,
} from "./rotation";
import {
  askForNotices,
  saveMissions,
  toggled,
  useNoticePermission,
  useSavedMissions,
  type SavedMissions,
} from "./saved-missions";
import { useAxionMoment } from "./use-rotation";

/** The page's address, for its links. */
const indexPath = "/axion-operational-areas";

/** How many rewards the list shows before "Show all": three rows on wide screens. */
const rewardsFirst = 9;

/** How many of a mission's next turns its panel lists. */
const nextTurns = 6;

/** The reward tabs: every drop, then by kind. */
const rewardTabs: readonly {
  readonly kind: DropKind | "all";
  readonly label: string;
}[] = [
  { kind: "all", label: "All" },
  { kind: "material", label: "Materials" },
  { kind: "core", label: "Cores" },
];

// In the browser's time zone: these only run once the browser knows the time.
const clock = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});
const shortDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const longDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const pad = (value: number) => String(value).padStart(2, "0");

/** "10:00–12:00": a rotation's hours, local. */
function hoursOf(rotation: number): string {
  return `${clock.format(rotationStart(rotation))}–${clock.format(rotationStart(rotation + 1))}`;
}

/** "UTC+3", "UTC−4:30": the visitor's offset at a moment. */
function zoneAt(ms: number): string {
  const minutes = -new Date(ms).getTimezoneOffset();
  const sign = minutes < 0 ? "−" : "+";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `UTC${sign}${String(hours)}${rest === 0 ? "" : `:${pad(rest)}`}`;
}

/** A day's name: "Today", "Tomorrow", then "Wed 21 Oct". */
function dayName(day: LocalDay, days: readonly LocalDay[]): string {
  const index = days.findIndex((entry) => entry.key === day.key);
  if (index === 0) {
    return "Today";
  }
  return index === 1 ? "Tomorrow" : shortDay.format(day.start).replace(",", "");
}

/** "Today 18:00", "Wed 21 Oct 02:00": when a rotation starts, by its local day. */
function whenOf(rotation: number, days: readonly LocalDay[]): string {
  const start = rotationStart(rotation);
  const day = days.find((entry) => start >= entry.start && start < entry.end);
  const name =
    day === undefined
      ? shortDay.format(start).replace(",", "")
      : dayName(day, days);
  return `${name} ${clock.format(start)}`;
}

/** "01:56:12" to a moment, from `now`. */
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

interface AxionProps {
  missions: readonly AxionMission[];
}

/** The page filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function AxionOperationalAreasFromUrl(props: AxionProps) {
  return <AxionOperationalAreas {...props} search={useSearch()} />;
}

/**
 * The Axion Operational Areas page (ADR 0052), tfdhub.gg's Axion page and ArcheLab's
 * 400% page in one (T7SEN, 2026-10-19): the two active missions, the time to the next
 * change and the next two; the rotations of a day, today and the six after it, in the
 * visitor's time zone; the seven missions with a favorite and an alert each; and the
 * chosen mission's rewards in tabs. The rotation is worked out in the browser; with
 * `search` "" and no rotation yet, this is what the static HTML holds.
 */
export function AxionOperationalAreas({
  missions,
  search,
}: AxionProps & {
  /** The URL query the choice comes from. */
  search: string;
}) {
  const ids = useId();
  const moment = useAxionMoment();
  const saved = useSavedMissions();
  const days = moment === null ? [] : localDays(moment.today, scheduleDays);
  const filters = parseAxionFilters(search, {
    days: days.slice(1).map((day) => day.key),
    missions: missions.map((mission) => mission.slug),
  });
  const day = days.find((entry) => entry.key === filters.day) ?? days.at(0);
  const current = moment?.rotation ?? null;
  const bySlug = new Map(missions.map((entry) => [entry.slug, entry]));
  const byName = new Map(missions.map((entry) => [entry.name, entry]));
  const active = current === null ? null : pairIn(current);
  const chosen =
    (filters.open === null ? undefined : bySlug.get(filters.open)) ??
    (active === null ? undefined : byName.get(active[0])) ??
    missions.at(0) ??
    null;
  const choose = (change: Partial<AxionFilters>) => {
    writeSearch(axionFiltersToSearch({ ...filters, ...change }));
  };
  // A mission picked here, or named by the link the page opened on, brings its details
  // into view (T7SEN, 2026-10-19).
  const details = useDetailsRequest(filters.open !== null);
  const pick = (mission: AxionMission) => {
    choose({ open: mission.slug });
    details.focus();
  };
  const hrefOf = (mission: AxionMission, dayKey: string | null) =>
    `${indexPath}${axionFiltersToSearch({ ...filters, day: dayKey, open: mission.slug })}`;

  useRotationAlerts(current, saved);

  if (missions.length === 0) {
    return <LoadFailed what="Axion Operational Areas" />;
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {current === null ? (
        <p
          role="status"
          aria-busy="true"
          className="rounded-2xl border bg-card/60 p-5 text-sm text-muted-foreground"
        >
          The missions change every two hours.
        </p>
      ) : (
        <NowBoxes
          current={current}
          byName={byName}
          saved={saved}
          hrefOf={(mission) => hrefOf(mission, filters.day)}
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
              Seven pairs of missions take turns, two hours each, in the same
              order. Pick a mission to open its rewards.
            </p>
          </div>
          {moment === null ? null : (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              <Clock aria-hidden="true" className="size-3.5" />
              Your time, {zoneAt(moment.today)}
            </span>
          )}
        </div>
        {current === null || day === undefined ? null : (
          <>
            <DayTabs
              days={days}
              day={day}
              onDay={(next) => {
                choose({ day: next === days.at(0)?.key ? null : next });
              }}
            />
            <Timeline
              day={day}
              days={days}
              current={current}
              chosen={chosen}
              byName={byName}
              saved={saved}
              hrefOf={hrefOf}
              onChoose={pick}
            />
          </>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <MissionList
          missions={missions}
          current={current}
          days={days}
          chosen={chosen}
          saved={saved}
          hrefOf={(mission) => hrefOf(mission, filters.day)}
          onChoose={pick}
        />
        {chosen === null ? null : (
          <MissionRewards
            key={chosen.slug}
            mission={chosen}
            request={details.request}
            current={current}
            days={days}
            onPickDay={(key) => {
              choose({ day: key === days.at(0)?.key ? null : key });
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * A notice from the browser when a rotation starts with a mission the visitor follows
 * (T7SEN, 2026-10-19): only while the page is open, and only for a change seen here, not
 * for the rotation the page opened on.
 */
function useRotationAlerts(rotation: number | null, saved: SavedMissions) {
  const seen = useRef<number | null>(null);
  useEffect(() => {
    if (rotation === null) {
      return;
    }
    const before = seen.current;
    seen.current = rotation;
    if (
      before === null ||
      before === rotation ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }
    for (const name of pairIn(rotation) ?? []) {
      if (saved.alerts.includes(slugOf(name))) {
        new Notification(`${name} is active`, {
          body: `Axion Operational Areas: until ${clock.format(rotationStart(rotation + 1))}.`,
          tag: `axion-${String(rotation)}-${slugOf(name)}`,
        });
      }
    }
  }, [rotation, saved]);
}

/** An Operational Area's mark: a radar in a diamond, in the primary tint. */
function MissionIcon({ size }: { size: "sm" | "md" | "lg" }) {
  const box = { sm: "size-5", md: "size-9", lg: "size-12" }[size];
  const icon = { sm: "size-3", md: "size-5", lg: "size-6" }[size];
  const room = { sm: "m-0.5", md: "m-1", lg: "m-1" }[size];
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 rotate-45 place-items-center rounded-md border border-primary/50 bg-primary/15 ${room} ${box}`}
    >
      <Radar className={`-rotate-45 text-primary ${icon}`} />
    </span>
  );
}

/** A filled star by a mission the visitor has starred. */
function FavoriteMark({ slug, saved }: { slug: string; saved: SavedMissions }) {
  return saved.favorites.includes(slug) ? (
    <>
      <Star
        aria-hidden="true"
        className="size-3 shrink-0 fill-primary text-primary"
      />
      <span className="sr-only">, a favorite</span>
    </>
  ) : null;
}

/**
 * The top row, as tfdhub's: the two missions active now, the time to the next change,
 * and the two after it.
 */
function NowBoxes({
  current,
  byName,
  saved,
  hrefOf,
  onChoose,
}: {
  current: number;
  byName: ReadonlyMap<string, AxionMission>;
  saved: SavedMissions;
  hrefOf: (mission: AxionMission) => string;
  onChoose: (mission: AxionMission) => void;
}) {
  const box = "grid content-start gap-3 rounded-2xl border bg-card/60 p-4";
  const pairBox = (rotation: number, label: string, live: boolean) => (
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
          {hoursOf(rotation)}
        </span>
      </div>
      <ul className="grid gap-2">
        {(pairIn(rotation) ?? []).map((name) => {
          const mission = byName.get(name);
          return mission === undefined ? null : (
            <li key={name}>
              <a
                href={hrefOf(mission)}
                onClick={(event) => {
                  if (!plainClick(event)) {
                    return;
                  }
                  event.preventDefault();
                  onChoose(mission);
                }}
                className="flex items-center gap-3 rounded-xl border bg-background/40 p-2 transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <MissionIcon size="md" />
                <span className="flex min-w-0 flex-1 items-center gap-1.5 font-display text-base leading-tight font-semibold tracking-wide">
                  {mission.name}
                  <FavoriteMark slug={mission.slug} saved={saved} />
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      {pairBox(current, "Active now", true)}
      <ChangeBox current={current} />
      {pairBox(current + 1, "Next rotation", false)}
    </div>
  );
}

/** The middle box: the time to the next change, ticking each second. */
function ChangeBox({ current }: { current: number }) {
  const now = useSecondClock();
  return (
    <section
      aria-label="Changes in"
      className="grid place-content-center justify-items-center gap-1 rounded-2xl border bg-card/60 p-4 text-center md:min-w-48"
    >
      <Clock aria-hidden="true" className="size-5 text-primary" />
      <h2 className="text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase">
        Changes in
      </h2>
      <p className="font-display text-3xl font-semibold tracking-wider tabular-nums">
        {now === null ? "--:--:--" : countdown(rotationStart(current + 1), now)}
      </p>
      <p className="text-xs text-muted-foreground">Every two hours</p>
    </section>
  );
}

/** Today and the six days after it, as tabs. */
function DayTabs({
  days,
  day,
  onDay,
}: {
  days: readonly LocalDay[];
  day: LocalDay;
  onDay: (key: string) => void;
}) {
  return (
    <div className="relative min-w-0 [scrollbar-width:none] overflow-x-auto">
      <ToggleGroup
        aria-label="Day"
        variant="outline"
        size="sm"
        spacing={1}
        className="flex w-max gap-2"
        value={[day.key]}
        onValueChange={(value) => {
          const next = value.at(0);
          if (next !== undefined) {
            onDay(next);
          }
        }}
      >
        {days.map((entry) => (
          <ToggleGroupItem
            key={entry.key}
            value={entry.key}
            className="h-auto w-28 flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left aria-pressed:border-primary/60 aria-pressed:bg-primary/15"
          >
            <span className="text-[0.6875rem] font-semibold tracking-wider uppercase">
              {dayName(entry, days)}
            </span>
            <span className="text-xs text-muted-foreground">
              {shortDay.format(entry.start).replace(",", "")}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/**
 * A day's rotations as a strip, as tfdhub's: a card per rotation on a line of dots, the
 * active one marked and in view, the ones gone by dimmed.
 */
function Timeline({
  day,
  days,
  current,
  chosen,
  byName,
  saved,
  hrefOf,
  onChoose,
}: {
  day: LocalDay;
  days: readonly LocalDay[];
  current: number;
  chosen: AxionMission | null;
  byName: ReadonlyMap<string, AxionMission>;
  saved: SavedMissions;
  hrefOf: (mission: AxionMission, dayKey: string | null) => string;
  onChoose: (mission: AxionMission) => void;
}) {
  const rotations = rotationsBetween(day.start, day.end);
  const dayKey = day.key === days.at(0)?.key ? null : day.key;
  // The day switch slides the strip in from its side (ADR 0030).
  const listRef = useSlideIn<HTMLOListElement>(
    day.key,
    days.map((entry) => entry.key),
  );
  // The active rotation scrolls into view, and another day's strip starts at its first.
  useEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const card = list.querySelector<HTMLElement>("[data-active]");
    list.scrollTo({
      left:
        card === null
          ? 0
          : card.offsetLeft - list.clientWidth / 2 + card.offsetWidth / 2,
      behavior: motionAllowed() ? "smooth" : "auto",
    });
  }, [listRef, day.key]);
  return (
    <ol
      ref={listRef}
      aria-label={`Rotations on ${longDay.format(day.start).replace(",", "")}`}
      className="relative -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pt-4 pb-2"
    >
      {rotations.map((rotation) => {
        const isActive = rotation === current;
        const past = rotation < current;
        return (
          <li
            key={rotation}
            data-active={isActive ? "" : undefined}
            className={`relative grid w-48 shrink-0 snap-start grid-cols-[minmax(0,1fr)] content-start gap-2 rounded-xl border bg-background/40 p-2.5 ${isActive ? "border-primary/70 bg-primary/10" : ""} ${past ? "opacity-60" : ""}`}
          >
            {/* The strip's line and this rotation's dot on it. */}
            <span
              aria-hidden="true"
              className="absolute -top-2.5 -right-3 left-0 h-px bg-border"
            />
            <span
              aria-hidden="true"
              className={`absolute -top-3.5 left-3 size-2 rounded-full border ${isActive ? "border-primary bg-primary" : "bg-card"}`}
            />
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <span className="text-xs font-semibold tabular-nums">
                {hoursOf(rotation)}
              </span>
              {isActive ? (
                <span className="text-[0.625rem] font-semibold tracking-wider text-primary uppercase">
                  Active now
                </span>
              ) : null}
            </div>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
              {(pairIn(rotation) ?? []).map((name) => {
                const mission = byName.get(name);
                if (mission === undefined) {
                  return null;
                }
                return (
                  <li key={name}>
                    <a
                      href={hrefOf(mission, dayKey)}
                      aria-current={
                        mission.slug === chosen?.slug ? "true" : undefined
                      }
                      onClick={(event) => {
                        if (!plainClick(event)) {
                          return;
                        }
                        event.preventDefault();
                        onChoose(mission);
                      }}
                      className="flex h-11 w-full items-center gap-2 rounded-lg border bg-card/70 px-1.5 text-[0.6875rem] leading-tight font-semibold transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:border-primary/70 aria-[current]:bg-primary/15"
                    >
                      <MissionIcon size="sm" />
                      <span className="line-clamp-2 min-w-0 flex-1">
                        {mission.name}
                        <span className="sr-only">
                          , {whenOf(rotation, days)}
                        </span>
                      </span>
                      <FavoriteMark slug={mission.slug} saved={saved} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The seven missions, as tfdhub lists them for favorites and alerts: each opens its
 * rewards, and has a star and a bell of its own.
 */
function MissionList({
  missions,
  current,
  days,
  chosen,
  saved,
  hrefOf,
  onChoose,
}: {
  missions: readonly AxionMission[];
  current: number | null;
  days: readonly LocalDay[];
  chosen: AxionMission | null;
  saved: SavedMissions;
  hrefOf: (mission: AxionMission) => string;
  onChoose: (mission: AxionMission) => void;
}) {
  const ids = useId();
  const permission = useNoticePermission();
  const anyAlert = saved.alerts.length > 0;
  return (
    <section
      aria-labelledby={`${ids}-missions`}
      className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5"
    >
      <div className="grid gap-1 border-b pb-3">
        <h2
          id={`${ids}-missions`}
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-wider uppercase"
        >
          <Swords aria-hidden="true" className="size-4 text-primary" />
          Missions
        </h2>
        <p className="text-xs text-muted-foreground">
          Star the ones you farm. A bell sends a notice from your browser when
          one becomes active, while this page is open.
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
      <ul className="grid gap-2">
        {missions.map((mission) => {
          const isActive =
            current !== null &&
            pairIn(current)?.includes(mission.name) === true;
          const next =
            current === null ? null : rotationsOf(mission.name, current, 2);
          const upcoming = next?.find((rotation) => rotation !== current);
          const favorite = saved.favorites.includes(mission.slug);
          const alert = saved.alerts.includes(mission.slug);
          return (
            <li
              key={mission.slug}
              className={`grid gap-2 rounded-xl border bg-background/40 p-2 ${mission.slug === chosen?.slug ? "border-primary/70 bg-primary/10" : ""}`}
            >
              <a
                href={hrefOf(mission)}
                aria-current={
                  mission.slug === chosen?.slug ? "true" : undefined
                }
                onClick={(event) => {
                  if (!plainClick(event)) {
                    return;
                  }
                  event.preventDefault();
                  onChoose(mission);
                }}
                className="flex items-center gap-3 rounded-lg p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <MissionIcon size="md" />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="font-display text-base leading-tight font-semibold tracking-wide">
                    {mission.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isActive
                      ? `Active until ${clock.format(rotationStart(current + 1))}`
                      : upcoming === undefined
                        ? ""
                        : `Next ${whenOf(upcoming, days)}`}
                  </span>
                </span>
                {isActive ? (
                  <span className="rounded-full border border-primary/50 bg-primary/15 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wider text-primary uppercase">
                    Active
                  </span>
                ) : (
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                )}
              </a>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={favorite}
                  onClick={() => {
                    saveMissions({
                      ...saved,
                      favorites: toggled(saved.favorites, mission.slug),
                    });
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-card/70 px-2 py-1.5 text-xs transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary/60 aria-pressed:bg-primary/15"
                >
                  <Star
                    aria-hidden="true"
                    className={`size-3.5 ${favorite ? "fill-primary text-primary" : ""}`}
                  />
                  Favorite
                  <span className="sr-only">: {mission.name}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={alert}
                  onClick={() => {
                    saveMissions({
                      ...saved,
                      alerts: toggled(saved.alerts, mission.slug),
                    });
                    if (!alert) {
                      void askForNotices();
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-card/70 px-2 py-1.5 text-xs transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary/60 aria-pressed:bg-primary/15"
                >
                  {alert ? (
                    <BellRing
                      aria-hidden="true"
                      className="size-3.5 text-primary"
                    />
                  ) : (
                    <Bell aria-hidden="true" className="size-3.5" />
                  )}
                  Alert
                  <span className="sr-only">: {mission.name}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The chosen mission's panel, as the 400% page's: its name, reward count and
 * Transcendent weapon chance, the pattern its completion gives, its next turns, and its
 * rewards as tiles in tabs by kind.
 */
function MissionRewards({
  mission,
  request,
  current,
  days,
  onPickDay,
}: {
  mission: AxionMission;
  /** Asks for the panel in view, with focus on its heading, each time it goes up. */
  request: number;
  current: number | null;
  days: readonly LocalDay[];
  onPickDay: (key: string) => void;
}) {
  const ids = useId();
  const { panelRef, headingRef } = useDetailsFocus<
    HTMLElement,
    HTMLHeadingElement
  >(request);
  const [tab, setTab] = useState<DropKind | "all">("all");
  const [showAll, setShowAll] = useState(false);
  // Every grade of a kind of core is one entry, so the list stays short.
  const entries = rewardEntries(mission.drops);
  const shown =
    tab === "all" ? entries : entries.filter((entry) => entry.kind === tab);
  const count = (kind: DropKind | "all") =>
    kind === "all"
      ? entries.length
      : entries.filter((entry) => entry.kind === kind).length;
  const turns =
    current === null ? [] : rotationsOf(mission.name, current, nextTurns);
  // A tab switch slides the tiles in from its side (ADR 0030).
  const tilesRef = useSlideIn<HTMLUListElement>(
    tab,
    rewardTabs.map((entry) => entry.kind),
  );

  return (
    <section
      ref={panelRef}
      aria-labelledby={`${ids}-title`}
      className={`grid gap-5 rounded-2xl border border-t-2 border-primary/40 border-t-primary bg-card/60 p-4 duration-300 motion-safe:animate-in motion-safe:fade-in sm:p-5 ${detailsScrollMargin}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <MissionIcon size="lg" />
          <h2
            ref={headingRef}
            id={`${ids}-title`}
            tabIndex={-1}
            className="grid gap-0.5 font-display text-2xl leading-tight font-semibold tracking-wide outline-none"
          >
            <span className="block text-[0.6875rem] font-semibold tracking-wider text-primary uppercase">
              Axion Plains <span aria-hidden="true">•</span>
              <span className="sr-only">,</span> Operational Area
            </span>
            {mission.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold tracking-wider uppercase">
          <span className="rounded-lg border px-3 py-2">
            {entries.length} rewards
          </span>
          {mission.transcendent === null ? null : (
            <Link
              href="/weapons?tier=Transcendent"
              prefetch={false}
              className="rounded-lg border px-3 py-2 transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Transcendent {mission.transcendent.chance}
              <span className="sr-only">
                {" "}
                on mission completion, Quality {
                  mission.transcendent.min
                } to {mission.transcendent.max}
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3 text-sm">
        {mission.pattern === null ? null : (
          <PatternCard pattern={mission.pattern} />
        )}
        {mission.transcendent === null ? null : (
          <p className="text-muted-foreground">
            Transcendent weapons: {mission.transcendent.chance} on mission
            completion, Quality {String(mission.transcendent.min)}–
            {String(mission.transcendent.max)}.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Next turns
          </span>
          {turns.map((rotation) => {
            const start = rotationStart(rotation);
            const day = days.find(
              (entry) => start >= entry.start && start < entry.end,
            );
            const label =
              rotation === current ? "Active now" : whenOf(rotation, days);
            return day === undefined ? (
              <span
                key={rotation}
                className="rounded-full border bg-background/40 px-2.5 py-1 text-xs"
              >
                {label}
              </span>
            ) : (
              <button
                key={rotation}
                type="button"
                onClick={() => {
                  onPickDay(day.key);
                }}
                className={`rounded-full border bg-background/40 px-2.5 py-1 text-xs transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 ${rotation === current ? "border-primary/60 bg-primary/15 text-primary" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold tracking-wider uppercase">
          <span
            aria-hidden="true"
            className="h-4 w-1 rounded-full bg-primary"
          />
          Rewards
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
    </section>
  );
}

/** The Amorphous Material Pattern a mission's completion gives, linking its page. */
function PatternCard({
  pattern,
}: {
  pattern: NonNullable<AxionMission["pattern"]>;
}) {
  const body = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-primary/40 bg-background/60">
        {pattern.imageUrl === "" ? null : (
          // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
          <img
            src={pattern.imageUrl}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="size-10 object-contain"
          />
        )}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase">
          On completion
        </span>
        <span className="text-sm leading-snug font-semibold">
          {pattern.name}
        </span>
      </span>
    </>
  );
  const cardClass =
    "flex items-center gap-3 rounded-xl border bg-background/40 p-2.5";
  return pattern.href === null ? (
    <div className={cardClass}>{body}</div>
  ) : (
    <Link
      href={pattern.href}
      prefetch={false}
      className={`${cardClass} transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50`}
    >
      {body}
    </Link>
  );
}
