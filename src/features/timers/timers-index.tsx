"use client";

import {
  Bell,
  BellRing,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Clock,
  Crosshair,
  Hourglass,
  PartyPopper,
  RefreshCw,
  Repeat,
  Store,
  Swords,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { rotationAnchorStatus } from "@/data/difficulty-rewards";
import {
  bountyTargets,
  gameEvents,
  trials,
  wallCrasher,
  type GameEvent,
  type HqCycle,
} from "@/data/timers";
import { purgeMapArt } from "@/data/void-erosion-purge";
import {
  askForNotices,
  useNoticePermission,
} from "@/features/axion/saved-missions";
import {
  pairIn,
  rotationAt as axionRotationAt,
  rotationStart as axionRotationStart,
} from "@/features/axion/rotation";
import { ElementIcon } from "@/features/descendants/type-icons";
import {
  rotationAt as rewardWeekAt,
  weekStart,
} from "@/features/difficulty-rewards/reward-week";
import {
  detailsScrollMargin,
  useDetailsFocus,
  useDetailsRequest,
} from "@/features/game-data/details-focus";
import { filterChipClass } from "@/features/game-data/filter-row";
import { useSearch } from "@/features/game-data/url-query";
import {
  dayAt as day400At,
  dayStart as day400Start,
  pairOn,
} from "@/features/infiltration-400/day-400";
import { useSecondClock } from "@/features/infiltration-400/use-day-400";
import {
  dayAt as purgeDayAt,
  dayStart as purgeDayStart,
  mapOn,
} from "@/features/void-erosion-purge/purge-day";
import { slugOf } from "@/lib/slug";
import {
  alertMinutes,
  saveAlertSettings,
  useAlertSettings,
  type AlertSettings,
} from "./alert-settings";
import {
  bountyOn,
  countdownText,
  eta0At,
  eventGroupOf,
  eventGroups,
  eventState,
  gameWeekday,
  hourMs,
  hqCyclesFrom,
  minuteMs,
  nextDailyReset,
  nextWeeklyReset,
  wallCrasherAt,
  type EventGroup,
} from "./schedule";

// In the browser's time zone: these only run once the browser knows the time.
const clock = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});
const utcClock = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const dayClock = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const shortDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "Mon 19 Oct, 15:00", in the visitor's time. */
const whenText = (ms: number) => dayClock.format(ms);

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The bounty's week as tfdhub shows it: a target each weekday, then the weekend. */
const bountyWeek: readonly {
  readonly key: string;
  readonly label: string;
  readonly days: readonly number[];
}[] = [
  ...bountyTargets.map((target) => ({
    key: String(target.day),
    label: weekdayNames[target.day] ?? "",
    days: [target.day],
  })),
  { key: "weekend", label: "Sat / Sun", days: [6, 0] },
];

const sectionClass = `grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5 ${detailsScrollMargin}`;
const headingClass =
  "flex items-center gap-2 font-display text-lg font-semibold tracking-wider uppercase";
const labelClass =
  "text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase";

interface TimersProps {
  /** Each attribute's icon, by its name ("Fire"). */
  elementIcons: Readonly<Partial<Record<string, string>>>;
  /** Pages for HQ Special Order rewards, by name without its count ("Ultimate Gley Code"). */
  rewardHrefs: Readonly<Partial<Record<string, string>>>;
}

/** The page reading the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function TimersFromUrl(props: TimersProps) {
  return <Timers {...props} search={useSearch()} />;
}

/**
 * The Timers page (ADR 0054), tfdhub.gg's Timers page with more from the update notes
 * (T7SEN, 2026-10-19): Wall Crasher with an alert, ETA-0, the daily and weekly resets and
 * Trials; Bounty Operations' target each day; the rotation pages' changes; HQ Special
 * Orders by cycle; and the running events. Every time is worked out in the browser from
 * one ticking clock; with no clock yet, this is what the static HTML holds.
 */
export function Timers({
  elementIcons,
  rewardHrefs,
  search,
}: TimersProps & {
  /** The URL query: `?bounty=` names a target to show, from a drop place's link. */
  search: string;
}) {
  const now = useSecondClock();
  const alert = useAlertSettings();
  const named = new URLSearchParams(search).get("bounty");
  const bounty =
    bountyTargets.find((target) => slugOf(target.name) === named) ?? null;
  const bountyDetails = useDetailsRequest(bounty !== null);
  useWallCrasherAlert(alert);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section
        aria-labelledby="timers-coming-up"
        className="grid grid-cols-[minmax(0,1fr)] gap-4"
      >
        <h2 id="timers-coming-up" className={headingClass}>
          <Clock aria-hidden="true" className="size-4 text-primary" />
          Coming up
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <WallCrasherCard now={now} alert={alert} />
          <Eta0Card now={now} />
          <TimerCard
            id="daily-reset"
            icon={<RefreshCw aria-hidden="true" className="size-4" />}
            label="Daily reset"
            title="Next reset"
            note="Daily missions, the rotation pages' days and daily limits."
            at={now === null ? null : nextDailyReset(now)}
            now={now}
          />
          <TimerCard
            id="weekly-reset"
            icon={<Repeat aria-hidden="true" className="size-4" />}
            label="Weekly reset"
            title="Next reset"
            note="Weekly challenges and weekly content, every Thursday."
            at={now === null ? null : nextWeeklyReset(now)}
            now={now}
          />
          <TrialsCard />
        </div>
      </section>

      <BountySection
        now={now}
        named={bounty?.name ?? null}
        request={bountyDetails.request}
        elementIcons={elementIcons}
      />
      <RotationsSection now={now} />
      <HqOrdersSection now={now} rewardHrefs={rewardHrefs} />
      <EventsSection now={now} />
    </div>
  );
}

/**
 * A notice from the browser a set time before each Wall Crasher spawn, while the page is
 * open (T7SEN, 2026-10-19): one timer at a time, set for the next alert and again after
 * it fires. A hidden tab's timers can run late, so the notice names the spawn's time.
 */
function useWallCrasherAlert(settings: AlertSettings) {
  useEffect(() => {
    if (!settings.on) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      const now = Date.now();
      let spawn = Math.floor(now / hourMs) * hourMs + hourMs;
      if (spawn - settings.minutes * minuteMs <= now) {
        spawn += hourMs;
      }
      timer = setTimeout(
        () => {
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification(`${wallCrasher.name} at ${clock.format(spawn)}`, {
              body: `Axion Plains: ${String(wallCrasher.entryMinutes)} minutes to enter once it appears.`,
              tag: `wall-crasher-${String(spawn)}`,
            });
          }
          arm();
        },
        spawn - settings.minutes * minuteMs - now,
      );
    };
    arm();
    return () => {
      clearTimeout(timer);
    };
  }, [settings.on, settings.minutes]);
}

/** A moment in the visitor's time, with UTC beside it. */
function Moment({ at }: { at: number }) {
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
      <span>{whenText(at)}</span>
      <span>{utcClock.format(at)} UTC</span>
    </p>
  );
}

/** A box with a label, a big countdown to a moment, and the moment. */
function TimerCard({
  id,
  icon,
  label,
  title,
  note,
  at,
  now,
  badge,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  title: string;
  note: string;
  at: number | null;
  now: number | null;
  badge?: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-label`}
      className={`grid content-start gap-2 rounded-2xl border bg-card/60 p-4 ${detailsScrollMargin}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          id={`${id}-label`}
          className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase"
        >
          <span className="text-primary">{icon}</span>
          {label}
        </h3>
        {badge}
      </div>
      <p className={labelClass}>{title}</p>
      <p className="font-display text-3xl font-semibold tracking-wide tabular-nums">
        {at === null || now === null ? "--" : countdownText(at - now)}
      </p>
      {at === null ? null : <Moment at={at} />}
      <p className="text-xs text-muted-foreground">{note}</p>
    </section>
  );
}

/**
 * Wall Crasher, as tfdhub's top card: the time to the next spawn, or to the end of its 5
 * minutes to enter, and the alert.
 */
function WallCrasherCard({
  now,
  alert,
}: {
  now: number | null;
  alert: AlertSettings;
}) {
  const state = now === null ? null : wallCrasherAt(now);
  const permission = useNoticePermission();
  return (
    <section
      id="wall-crasher"
      aria-labelledby="wall-crasher-label"
      className={`grid content-between gap-3 rounded-2xl border border-t-2 border-primary/40 border-t-primary bg-card/60 p-4 sm:p-5 md:col-span-2 lg:row-span-2 ${detailsScrollMargin}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/50 bg-primary/15 text-primary"
          >
            <Crosshair className="size-5" />
          </span>
          <h3 id="wall-crasher-label" className="grid gap-0.5">
            <span className="text-[0.6875rem] font-semibold tracking-wider text-primary uppercase">
              Axion Plains <span aria-hidden="true">•</span>
              <span className="sr-only">,</span> Field Intercept Battle
            </span>
            <span className="font-display text-2xl leading-tight font-semibold tracking-wide">
              {wallCrasher.name}
            </span>
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Every hour on the hour, {wallCrasher.entryMinutes} minutes to enter.
        </p>
      </div>
      <div className="grid gap-1 border-l-2 border-primary/60 pl-4">
        <p className={labelClass}>
          {state?.open === true ? "Open now, closes in" : "Next spawn"}
        </p>
        <p className="font-display text-5xl font-semibold tracking-wide tabular-nums sm:text-6xl">
          {state === null || now === null
            ? "--"
            : countdownText((state.open ? state.closes : state.spawn) - now)}
        </p>
        {state === null ? null : <Moment at={state.spawn} />}
      </div>
      <div className="grid gap-3 rounded-xl border bg-background/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <p className="text-sm font-semibold">Wall Crasher alert</p>
            <p className="text-xs text-muted-foreground">
              A notice from your browser before each spawn, while this page is
              open.
            </p>
          </div>
          <button
            type="button"
            aria-pressed={alert.on}
            onClick={() => {
              saveAlertSettings({ ...alert, on: !alert.on });
              if (!alert.on) {
                void askForNotices();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card/70 px-3 py-1.5 text-sm transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary/60 aria-pressed:bg-primary/15"
          >
            {alert.on ? (
              <BellRing aria-hidden="true" className="size-4 text-primary" />
            ) : (
              <Bell aria-hidden="true" className="size-4" />
            )}
            {alert.on ? "Alert on" : "Alert off"}
          </button>
        </div>
        <ToggleGroup
          aria-label="Minutes before"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          value={[String(alert.minutes)]}
          onValueChange={(value) => {
            const minutes = Number(value.at(0));
            if (alertMinutes.includes(minutes)) {
              saveAlertSettings({ ...alert, minutes });
            }
          }}
        >
          {alertMinutes.map((minutes) => (
            <ToggleGroupItem
              key={minutes}
              value={String(minutes)}
              className={filterChipClass}
            >
              {minutes} min before
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {alert.on && permission === "denied" ? (
          <p role="status" className="text-xs text-destructive">
            Your browser blocks notices from this site. Allow them in its site
            settings to get alerts.
          </p>
        ) : null}
        {alert.on && permission === "unsupported" ? (
          <p role="status" className="text-xs text-destructive">
            This browser can&apos;t show notices.
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** ETA-0's shop: open or closed, and the time to the change. */
function Eta0Card({ now }: { now: number | null }) {
  const state = now === null ? null : eta0At(now);
  return (
    <TimerCard
      id="eta-0"
      icon={<Store aria-hidden="true" className="size-4" />}
      label="ETA-0"
      title={state === null ? "Open" : state.open ? "Closes in" : "Opens in"}
      note="In Albion, from Friday to Monday."
      at={state?.changesAt ?? null}
      now={now}
      badge={
        state === null ? null : (
          <span
            className={`rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold tracking-wider uppercase ${state.open ? "border-primary/50 bg-primary/15 text-primary" : "text-muted-foreground"}`}
          >
            {state.open ? "Open now" : "Closed"}
          </span>
        )
      }
    />
  );
}

/** Trials' dungeon: paused turns, for now. */
function TrialsCard() {
  const showing = trials.dungeons.find(
    (dungeon) => dungeon.name === trials.paused.showing,
  );
  return (
    <section
      id="trials"
      aria-labelledby="trials-label"
      className={`grid content-start gap-2 rounded-2xl border bg-card/60 p-4 lg:col-span-2 ${detailsScrollMargin}`}
    >
      <h3
        id="trials-label"
        className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase"
      >
        <Swords aria-hidden="true" className="size-4 text-primary" />
        Trials
      </h3>
      <p className={labelClass}>Open dungeon</p>
      <p className="font-display text-xl leading-tight font-semibold tracking-wide">
        {trials.paused.showing}
      </p>
      {showing === undefined ? null : (
        <p className="text-sm text-muted-foreground">{showing.legion}</p>
      )}
      <p className="text-xs text-muted-foreground">
        The two dungeons take turns daily, but {trials.paused.by} shows only{" "}
        {trials.paused.showing} until a bug is fixed.
      </p>
    </section>
  );
}

/**
 * Bounty Operations: today's target with its attribute, and the week, today marked. A
 * link that names a target opens here, with it marked.
 */
function BountySection({
  now,
  named,
  request,
  elementIcons,
}: {
  now: number | null;
  named: string | null;
  request: number;
  elementIcons: Readonly<Partial<Record<string, string>>>;
}) {
  const { panelRef, headingRef } = useDetailsFocus<
    HTMLElement,
    HTMLHeadingElement
  >(request);
  const weekday = now === null ? null : gameWeekday(now);
  const today = weekday === null ? null : bountyOn(weekday);
  return (
    <section
      ref={panelRef}
      id="bounty-operations"
      aria-labelledby="bounty-operations-heading"
      className={sectionClass}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2
            ref={headingRef}
            id="bounty-operations-heading"
            tabIndex={-1}
            className={`${headingClass} outline-none`}
          >
            <Crosshair aria-hidden="true" className="size-4 text-primary" />
            Bounty Operations
          </h2>
          <p className="text-sm text-muted-foreground">
            A target each weekday; every target on the weekend.
          </p>
        </div>
        {now === null ? null : (
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/40 px-3 py-1 text-xs text-muted-foreground tabular-nums">
            <Clock aria-hidden="true" className="size-3.5" />
            Next target in {countdownText(nextDailyReset(now) - now)}
          </span>
        )}
      </div>
      {weekday === null ? null : (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/50 bg-primary/10 p-3">
          {today === null ? null : (
            <ElementIcon
              url={elementIcons[today.attribute]}
              className="size-10"
            />
          )}
          <div className="grid gap-0.5">
            <p className="text-[0.6875rem] font-semibold tracking-wider text-primary uppercase">
              Today&apos;s target
            </p>
            <p className="font-display text-xl leading-tight font-semibold tracking-wide">
              {today?.name ?? "Every target"}
            </p>
            <p className="text-xs text-muted-foreground">
              {today === null ? "Weekend" : today.attribute}
            </p>
          </div>
        </div>
      )}
      <ol
        aria-label="Week"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {bountyWeek.map((entry) => {
          const target = bountyTargets.find(
            (candidate) => entry.days[0] === candidate.day,
          );
          const isToday = weekday !== null && entry.days.includes(weekday);
          const marked = named !== null && target?.name === named;
          return (
            <li
              key={entry.key}
              aria-current={isToday ? "date" : undefined}
              className={`grid content-start gap-1 rounded-xl border bg-background/40 p-2.5 ${isToday ? "border-primary/70 bg-primary/10" : ""} ${marked ? "ring-2 ring-ring/60" : ""}`}
            >
              <span
                className={`text-[0.6875rem] font-semibold tracking-wider uppercase ${isToday ? "text-primary" : "text-muted-foreground"}`}
              >
                {entry.label}
                {isToday ? <span className="sr-only">, today</span> : null}
              </span>
              <span className="text-sm leading-snug font-semibold">
                {target?.name ?? "Every target"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {target === undefined ? (
                  "Weekend"
                ) : (
                  <>
                    <ElementIcon
                      url={elementIcons[target.attribute]}
                      className="size-4"
                    />
                    {target.attribute}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** One rotation page's change: what's on now, the countdown, and a link to the page. */
function RotationCard({
  href,
  label,
  now: current,
  at,
  clockNow,
  art,
  badge,
}: {
  href: string;
  label: string;
  now: readonly string[];
  at: number | null;
  clockNow: number | null;
  art?: string;
  badge?: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="group/rotation grid h-full content-start gap-2 rounded-xl border bg-background/40 p-3 transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/rotation:text-primary"
          />
        </span>
        {badge}
        <span className="flex items-center gap-2">
          {art === undefined ? null : (
            // eslint-disable-next-line @next/next/no-img-element -- the site's own files, never through Vercel Image Optimization (SKILL.md landmine 2).
            <img
              src={art}
              alt=""
              width={80}
              height={48}
              loading="lazy"
              decoding="async"
              className="h-10 w-16 shrink-0 rounded-md border bg-background/60 object-contain"
            />
          )}
          <span className="grid gap-0.5 text-xs leading-snug">
            {current.map((name) => (
              <span key={name} className="font-medium">
                {name}
              </span>
            ))}
          </span>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Changes in{" "}
          <span className="font-semibold text-foreground">
            {at === null || clockNow === null
              ? "--"
              : countdownText(at - clockNow)}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** The rotation pages at a glance, each linking its page. */
function RotationsSection({ now }: { now: number | null }) {
  const day400 = now === null ? null : day400At(now);
  const axion = now === null ? null : axionRotationAt(now);
  const purgeDay = now === null ? null : purgeDayAt(now);
  const week = now === null ? null : rewardWeekAt(now);
  const purgeMap = purgeDay === null ? null : mapOn(purgeDay);
  return (
    <section
      id="rotations"
      aria-labelledby="rotations-heading"
      className={sectionClass}
    >
      <h2 id="rotations-heading" className={headingClass}>
        <CalendarClock aria-hidden="true" className="size-4 text-primary" />
        Rotations
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RotationCard
          href="/infiltration-400"
          label="400% Infiltration Operations"
          now={day400 === null ? [] : [...(pairOn(day400) ?? [])]}
          at={day400 === null ? null : day400Start(day400 + 1)}
          clockNow={now}
        />
        <RotationCard
          href="/axion-operational-areas"
          label="Axion Operational Areas"
          now={axion === null ? [] : [...(pairIn(axion) ?? [])]}
          at={axion === null ? null : axionRotationStart(axion + 1)}
          clockNow={now}
        />
        <RotationCard
          href="/void-erosion-purge"
          label="Void Erosion Purge"
          now={purgeMap === null ? [] : [purgeMap]}
          art={purgeMap === null ? undefined : purgeMapArt[purgeMap]}
          at={purgeDay === null ? null : purgeDayStart(purgeDay + 1)}
          clockNow={now}
        />
        <RotationCard
          href="/difficulty-level-rewards"
          label="Difficulty Level Rewards"
          now={week === null ? [] : ["This week's rewards"]}
          at={week === null ? null : weekStart(week + 1)}
          clockNow={now}
          badge={
            rotationAnchorStatus === "provisional" ? (
              <Badge variant="destructive" className="justify-self-start">
                <TriangleAlert aria-hidden="true" />
                Provisional
              </Badge>
            ) : undefined
          }
        />
      </ul>
    </section>
  );
}

/** The reward's name without its count, for its page: "Precision Augmentation Core X". */
const rewardKey = (reward: string) => reward.replace(/^\d+x /, "");

/**
 * HQ Special Orders: a switch over the cycles from the current one on, and the chosen
 * cycle's quests with their rewards, each linking its page when it has one.
 */
function HqOrdersSection({
  now,
  rewardHrefs,
}: {
  now: number | null;
  rewardHrefs: Readonly<Partial<Record<string, string>>>;
}) {
  const cycles = now === null ? [] : hqCyclesFrom(now);
  const [picked, setPicked] = useState<string | null>(null);
  const cycle =
    cycles.find((entry) => entry.startsAt === picked) ?? cycles.at(0) ?? null;
  return (
    <section
      id="hq-special-orders"
      aria-labelledby="hq-special-orders-heading"
      className={sectionClass}
    >
      <div className="grid gap-1">
        <h2 id="hq-special-orders-heading" className={headingClass}>
          <ClipboardList aria-hidden="true" className="size-4 text-primary" />
          HQ Special Orders
        </h2>
        <p className="text-sm text-muted-foreground">
          A new set of orders every three days. Each quest gives one reward of
          your choice.
        </p>
      </div>
      {now === null ? null : cycle === null ? (
        <p className="text-sm text-muted-foreground">
          No HQ Special Orders are listed past this schedule yet. They come with
          the next update&apos;s notes.
        </p>
      ) : (
        <>
          <ToggleGroup
            aria-label="Orders"
            variant="outline"
            size="sm"
            spacing={1}
            className="flex-wrap"
            value={[cycle.startsAt]}
            onValueChange={(value) => {
              const next = value.at(0);
              if (next !== undefined) {
                setPicked(next);
              }
            }}
          >
            {cycles.map((entry) => (
              <ToggleGroupItem
                key={entry.startsAt}
                value={entry.startsAt}
                className={filterChipClass}
              >
                {Date.parse(entry.startsAt) <= now
                  ? "Now"
                  : shortDay
                      .format(Date.parse(entry.startsAt))
                      .replace(",", "")}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <HqCycleView
            key={cycle.startsAt}
            cycle={cycle}
            now={now}
            rewardHrefs={rewardHrefs}
          />
        </>
      )}
    </section>
  );
}

function HqCycleView({
  cycle,
  now,
  rewardHrefs,
}: {
  cycle: HqCycle;
  now: number;
  rewardHrefs: Readonly<Partial<Record<string, string>>>;
}) {
  const starts = Date.parse(cycle.startsAt);
  const ends = Date.parse(cycle.endsAt);
  const running = starts <= now;
  return (
    <div className="grid gap-3 duration-300 motion-safe:animate-in motion-safe:fade-in">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold tabular-nums">
          {running ? "Ends in" : "Starts in"}{" "}
          {countdownText((running ? ends : starts) - now)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {whenText(starts)} – {whenText(ends)}
        </span>
      </p>
      <ol aria-label="Quests" className="grid gap-2 lg:grid-cols-2">
        {cycle.quests.map((quest, index) => (
          <li
            key={`${String(index)}-${quest.objective}`}
            className="grid content-start gap-2 rounded-xl border bg-background/40 p-3"
          >
            <p className="text-sm font-semibold">{quest.objective}</p>
            <ul aria-label="Rewards" className="flex flex-wrap gap-1.5">
              {quest.rewards.map((reward) => {
                const href = rewardHrefs[rewardKey(reward)];
                const chip =
                  "rounded-md border bg-card/70 px-2 py-0.5 text-xs leading-snug";
                return (
                  <li key={reward}>
                    {href === undefined ? (
                      <span className={chip}>{reward}</span>
                    ) : (
                      <Link
                        href={href}
                        prefetch={false}
                        className={`${chip} inline-block transition-colors outline-none hover:border-ring/60 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50`}
                      >
                        {reward}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The Events tabs in order: one per group, then any "Other". */
const groupOrder: readonly EventGroup[] = [
  ...eventGroups.map((group) => group.name),
  "Other",
];

/**
 * The events that haven't ended (T7SEN, 2026-10-19): tabs by what an event is for, one
 * line each, ending soonest first in its group and those still to come after, each
 * opening its details in place.
 */
function EventsSection({ now }: { now: number | null }) {
  const [tab, setTab] = useState<EventGroup | "All">("All");
  const [open, setOpen] = useState<string | null>(null);
  const shown =
    now === null
      ? []
      : gameEvents
          .map((event) => ({
            event,
            state: eventState(event, now),
            group: eventGroupOf(event.kind),
          }))
          .filter(({ state }) => state.status !== "ended")
          .sort(
            (a, b) =>
              groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group) ||
              Number(a.state.status === "upcoming") -
                Number(b.state.status === "upcoming") ||
              Date.parse(a.event.endsAt) - Date.parse(b.event.endsAt),
          );
  const tabs = [
    { name: "All" as const, count: shown.length },
    ...groupOrder
      .map((name) => ({
        name,
        count: shown.filter((entry) => entry.group === name).length,
      }))
      .filter((entry) => entry.count > 0),
  ];
  // A tab whose events have all ended shows them all.
  const current = tabs.some((entry) => entry.name === tab) ? tab : "All";
  const visible =
    current === "All"
      ? shown
      : shown.filter((entry) => entry.group === current);
  return (
    <section
      id="events"
      aria-labelledby="events-heading"
      className={sectionClass}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="events-heading" className={headingClass}>
            <PartyPopper aria-hidden="true" className="size-4 text-primary" />
            Events
          </h2>
          <p className="text-sm text-muted-foreground">
            Every event in the update notes that hasn&apos;t ended. Open one for
            its details.
          </p>
        </div>
        {now === null ? null : (
          <span className="rounded-full border bg-background/40 px-3 py-1 text-xs text-muted-foreground tabular-nums">
            {shown.length} running
          </span>
        )}
      </div>
      {now === null ? null : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No events are listed right now.
        </p>
      ) : (
        <>
          <ToggleGroup
            aria-label="Event type"
            variant="outline"
            size="sm"
            spacing={1}
            className="flex-wrap"
            value={[current]}
            onValueChange={(value) => {
              const next = tabs.find((entry) => entry.name === value.at(0));
              if (next !== undefined) {
                setTab(next.name);
              }
            }}
          >
            {tabs.map((entry) => (
              <ToggleGroupItem
                key={entry.name}
                value={entry.name}
                className={filterChipClass}
              >
                {entry.name}
                <span className="ml-1 text-muted-foreground tabular-nums">
                  {entry.count}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ul className="grid gap-1.5">
            {visible.map(({ event, state }) => (
              <EventRow
                key={event.name}
                event={event}
                state={state}
                now={now}
                open={open === event.name}
                onToggle={() => {
                  setOpen(open === event.name ? null : event.name);
                }}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** An event's time left: to its end, or to its next change if it runs on some days. */
function eventTiming(
  event: GameEvent,
  state: ReturnType<typeof eventState>,
  now: number,
): string {
  const ends = Date.parse(event.endsAt);
  const changesAt = state.changesAt ?? ends;
  if (state.status === "upcoming") {
    return `Starts in ${countdownText(changesAt - now)}`;
  }
  if (event.days !== undefined && state.on) {
    return `On now, for ${countdownText(changesAt - now)}`;
  }
  return event.days !== undefined && changesAt < ends
    ? `Next in ${countdownText(changesAt - now)}`
    : `Ends in ${countdownText(ends - now)}`;
}

/** One event on a line; a click opens its details under it. */
function EventRow({
  event,
  state,
  now,
  open,
  onToggle,
}: {
  event: GameEvent;
  state: ReturnType<typeof eventState>;
  now: number;
  open: boolean;
  onToggle: () => void;
}) {
  const detailsId = `event-${slugOf(event.name)}`;
  const live = event.days !== undefined && state.on;
  return (
    <li
      className={`rounded-xl border bg-background/40 ${live ? "border-primary/60 bg-primary/10" : ""}`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={onToggle}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-left transition-colors outline-none hover:bg-card/70 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_10rem_11.5rem]"
      >
        <span className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
          {live ? (
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-primary motion-safe:animate-pulse"
            />
          ) : null}
          <span className="text-sm leading-snug font-semibold">
            {event.name}
          </span>
        </span>
        <span className="col-start-1 row-start-2 justify-self-start rounded-md bg-secondary px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wider text-muted-foreground uppercase sm:col-start-2 sm:row-start-1 sm:justify-self-end">
          {event.kind}
        </span>
        <span className="col-start-2 row-start-2 flex items-center gap-2 text-xs font-semibold whitespace-nowrap tabular-nums sm:col-start-3 sm:row-start-1">
          <Hourglass aria-hidden="true" className="size-3.5 text-primary" />
          {eventTiming(event, state, now)}
          <ChevronRight
            aria-hidden="true"
            className={`ml-auto size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
          />
        </span>
      </button>
      {open ? (
        <div
          id={detailsId}
          className="grid gap-1 border-t px-3 py-2.5 text-xs duration-200 motion-safe:animate-in motion-safe:fade-in"
        >
          <p className="text-muted-foreground">{event.details}</p>
          <p className="text-muted-foreground tabular-nums">
            Until {whenText(Date.parse(event.endsAt))}
            <span aria-hidden="true"> · </span>
            <span className="sr-only">, </span>
            {event.source}
          </p>
        </div>
      ) : null}
    </li>
  );
}
