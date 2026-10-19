import {
  bountyTargets,
  dayStartHour,
  eta0OpenDays,
  hqOrderCycles,
  wallCrasher,
  weeklyResetDay,
  type GameEvent,
  type HqCycle,
} from "@/data/timers";

/**
 * The Timers page's clock (ADR 0054): when each fixed time comes next, from a moment in
 * ms. Pure, so the browser and the tests agree in any time zone. A game day starts at
 * `dayStartHour` UTC; weekdays are the UTC weekday of a game day's start.
 */

export const minuteMs = 60 * 1000;
export const hourMs = 60 * minuteMs;
export const dayMs = 24 * hourMs;

const shiftMs = dayStartHour * hourMs;

/** The start of the game day that holds `now`. */
export function gameDayStart(now: number): number {
  return Math.floor((now - shiftMs) / dayMs) * dayMs + shiftMs;
}

/** The game day's weekday, 0 Sunday to 6 Saturday. */
export function gameWeekday(now: number): number {
  return new Date(gameDayStart(now)).getUTCDay();
}

/** The next daily reset after `now`. */
export function nextDailyReset(now: number): number {
  return gameDayStart(now) + dayMs;
}

/** The first game day start after `now` whose weekday passes `test`, within two weeks. */
function nextDayWhere(now: number, test: (weekday: number) => boolean): number {
  let at = nextDailyReset(now);
  for (let step = 0; step < 14 && !test(new Date(at).getUTCDay()); step += 1) {
    at += dayMs;
  }
  return at;
}

/** The next weekly reset after `now`. */
export function nextWeeklyReset(now: number): number {
  return nextDayWhere(now, (weekday) => weekday === weeklyResetDay);
}

/**
 * Wall Crasher at `now`: while its 5 minutes to enter run, the spawn that opened them;
 * otherwise the next spawn. Spawns are on the UTC hour.
 */
export function wallCrasherAt(now: number): {
  readonly spawn: number;
  readonly open: boolean;
  readonly closes: number;
} {
  const hour = Math.floor(now / hourMs) * hourMs;
  const window = wallCrasher.entryMinutes * minuteMs;
  return now < hour + window
    ? { spawn: hour, open: true, closes: hour + window }
    : { spawn: hour + hourMs, open: false, closes: hour + hourMs + window };
}

/** ETA-0 at `now`: open or not, and when that changes. */
export function eta0At(now: number): {
  readonly open: boolean;
  readonly changesAt: number;
} {
  const open = eta0OpenDays.includes(gameWeekday(now));
  return {
    open,
    changesAt: nextDayWhere(now, (weekday) =>
      open ? !eta0OpenDays.includes(weekday) : eta0OpenDays.includes(weekday),
    ),
  };
}

/** A weekday's bounty target, or null on a day every target is open. */
export function bountyOn(
  weekday: number,
): (typeof bountyTargets)[number] | null {
  return bountyTargets.find((target) => target.day === weekday) ?? null;
}

/** The HQ Special Orders cycle running at `now`, or null between schedules. */
export function hqCycleAt(now: number): HqCycle | null {
  return (
    hqOrderCycles.find(
      (cycle) =>
        Date.parse(cycle.startsAt) <= now && now < Date.parse(cycle.endsAt),
    ) ?? null
  );
}

/** The cycles from the one running at `now` on, or the coming ones. */
export function hqCyclesFrom(now: number): HqCycle[] {
  return hqOrderCycles.filter((cycle) => Date.parse(cycle.endsAt) > now);
}

/** Where an event stands at `now`. */
export interface EventState {
  /** Not started, running, or over. */
  readonly status: "upcoming" | "running" | "ended";
  /** Running, and on one of its days if it has days. */
  readonly on: boolean;
  /** When `status` or `on` next changes; null when it is over. */
  readonly changesAt: number | null;
}

export function eventState(event: GameEvent, now: number): EventState {
  const starts = Date.parse(event.startsAt);
  const ends = Date.parse(event.endsAt);
  if (now >= ends) {
    return { status: "ended", on: false, changesAt: null };
  }
  if (now < starts) {
    return { status: "upcoming", on: false, changesAt: starts };
  }
  const days = event.days;
  if (days === undefined) {
    return { status: "running", on: true, changesAt: ends };
  }
  const on = days.includes(gameWeekday(now));
  const next = nextDayWhere(now, (weekday) =>
    on ? !days.includes(weekday) : days.includes(weekday),
  );
  return { status: "running", on, changesAt: Math.min(next, ends) };
}

/**
 * The Events tabs, by what an event is for (T7SEN, 2026-10-19), each from the kinds the
 * update notes give.
 */
export const eventGroups = [
  { name: "Boosts", kinds: ["Boost Event", "Accelerate Research"] },
  { name: "Passes and login", kinds: ["Event Pass", "Login Event"] },
  { name: "Challenges", kinds: ["Event Challenge", "Starter-only event"] },
  { name: "Leaderboards and exchanges", kinds: ["Leaderboard", "Exchange"] },
] as const;

export type EventGroup = (typeof eventGroups)[number]["name"] | "Other";

/** An event's tab; a kind no tab names goes under "Other". */
export function eventGroupOf(kind: string): EventGroup {
  return (
    eventGroups.find((group) =>
      (group.kinds as readonly string[]).includes(kind),
    )?.name ?? "Other"
  );
}

/** "54s", "40m 54s", "19h 40m", "2d 19h 40m": the time left to a moment. */
export function countdownText(ms: number): string {
  const left = Math.max(0, ms);
  const days = Math.floor(left / dayMs);
  const hours = Math.floor((left % dayMs) / hourMs);
  const minutes = Math.floor((left % hourMs) / minuteMs);
  const seconds = Math.floor((left % minuteMs) / 1000);
  if (days > 0) {
    return `${String(days)}d ${String(hours)}h ${String(minutes)}m`;
  }
  if (hours > 0) {
    return `${String(hours)}h ${String(minutes)}m`;
  }
  return minutes > 0
    ? `${String(minutes)}m ${String(seconds).padStart(2, "0")}s`
    : `${String(seconds)}s`;
}
