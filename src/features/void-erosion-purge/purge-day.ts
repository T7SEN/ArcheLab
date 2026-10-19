import { purgeCycle, purgeRotation } from "@/data/void-erosion-purge";

/**
 * The days of Void Erosion Purge's Stage 10 maps (ADR 0053): a day starts at 07:00 UTC,
 * as the 400% Infiltration Operations' does (ADR 0049), and the five maps take turns
 * from `purgeRotation.startsAt`. Days are counted from the cycle's first. Pure, so the
 * browser and the tests agree in any time zone.
 */

export const dayMs = 24 * 60 * 60 * 1000;

const anchorMs = Date.parse(purgeRotation.startsAt);

/** The day that holds `ms`, counted from the cycle's first day. */
export function dayAt(ms: number): number {
  return Math.floor((ms - anchorMs) / dayMs);
}

/** When a day starts, in ms since the epoch. */
export function dayStart(day: number): number {
  return anchorMs + day * dayMs;
}

/** A day's map, by name. */
export function mapOn(day: number): string | null {
  const length = purgeCycle.length;
  return length === 0
    ? null
    : (purgeCycle[((day % length) + length) % length] ?? null);
}

/** The next `count` days from `from` on, `from` included, when a map is Stage 10's. */
export function daysOf(name: string, from: number, count: number): number[] {
  const days: number[] = [];
  for (
    let day = from;
    days.length < count && day < from + purgeCycle.length * count;
    day += 1
  ) {
    if (mapOn(day) === name) {
      days.push(day);
    }
  }
  return days;
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

/** A day's name: "Yesterday", "Today", "Tomorrow", then "Wed 21 Oct". */
export function dayLabel(day: number, today: number): string {
  if (day === today) {
    return "Today";
  }
  if (day === today - 1) {
    return "Yesterday";
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
