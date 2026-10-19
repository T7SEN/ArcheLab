import { cycle400, rotation400 } from "@/data/infiltration-400";

/**
 * The days of the 400% Infiltration Operations (ADR 0049): a day starts at 07:00 UTC,
 * and the pair repeats every `rotation400.days` days from `rotation400.startsAt`. Days
 * are counted from that first day. Pure, so the browser and the tests agree in any time
 * zone.
 */

export const dayMs = 24 * 60 * 60 * 1000;

const anchorMs = Date.parse(rotation400.startsAt);

/** The day that holds `ms`, counted from the cycle's first day. */
export function dayAt(ms: number): number {
  return Math.floor((ms - anchorMs) / dayMs);
}

/** When a day starts, in ms since the epoch. */
export function dayStart(day: number): number {
  return anchorMs + day * dayMs;
}

/** A day's two 400% operations, by name. */
export function pairOn(day: number): readonly [string, string] | null {
  const length = cycle400.length;
  return length === 0
    ? null
    : (cycle400[((day % length) + length) % length] ?? null);
}

/** A day's key in the URL: its start's UTC date, "2026-10-20". */
export function dayKey(day: number): string {
  return new Date(dayStart(day)).toISOString().slice(0, 10);
}

/** The day a key names, or null unless it is exactly a day's start date. */
export function dayOfKey(key: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return null;
  }
  const ms = Date.parse(`${key}T07:00:00Z`);
  if (Number.isNaN(ms)) {
    return null;
  }
  const day = dayAt(ms);
  return dayKey(day) === key ? day : null;
}

const shortDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** A day's short date, from its UTC start: "Tue 20 Oct". */
export function dayDate(day: number): string {
  return shortDate.format(dayStart(day)).replace(",", "");
}

/** A day's name in the switch and lists: "Today", "Tomorrow", then "Tue 20 Oct". */
export function dayLabel(day: number, today: number): string {
  if (day === today) {
    return "Today";
  }
  return day === today + 1 ? "Tomorrow" : dayDate(day);
}

const longDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** A day's date for screen readers: "Tuesday 20 October". */
export function daySpan(day: number): string {
  return longDate.format(dayStart(day)).replace(",", "");
}

/** The days from `from` on, through one whole cycle, when an operation is 400%. */
export function daysOf(name: string, from: number): number[] {
  const days: number[] = [];
  for (let day = from; day < from + cycle400.length; day += 1) {
    if (pairOn(day)?.includes(name) === true) {
      days.push(day);
    }
  }
  return days;
}
