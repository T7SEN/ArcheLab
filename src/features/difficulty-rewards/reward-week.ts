import { rotationAnchor } from "@/data/difficulty-rewards";

/**
 * The weeks of the Difficulty Level Rewards (ADR 0048): the reward list numbers them
 * (its rotations) without dates, and each starts on a Tuesday at 07:00 UTC, a week after
 * the one before. Pure, so the browser and the build agree and the tests can run in any
 * time zone. The page never shows a week before the current one: the list is a schedule
 * NEXON rewrites, not a record.
 */

export const weekMs = 7 * 24 * 60 * 60 * 1000;

const anchorMs = Date.parse(rotationAnchor.startsAt);

/** When a rotation's week starts, in ms since the epoch. */
export function weekStart(rotation: number): number {
  return anchorMs + (rotation - rotationAnchor.rotation) * weekMs;
}

/** The rotation whose week holds `ms`; a week starts at exactly 07:00:00.000 UTC. */
export function rotationAt(ms: number): number {
  return Math.floor((ms - anchorMs) / weekMs) + rotationAnchor.rotation;
}

/**
 * "This week" in the browser: never before the first week the build shipped, so a clock
 * set in the past shows the build's week rather than nothing.
 */
export function currentRotation(ms: number, firstShipped: number): number {
  return Math.max(rotationAt(ms), firstShipped);
}

/** A week's key in the URL and its label's date: its start's UTC date, "2026-10-27". */
export function weekKey(rotation: number): string {
  return new Date(weekStart(rotation)).toISOString().slice(0, 10);
}

/** The rotation a week key names, or null unless it is exactly a week start's date. */
export function rotationOfKey(key: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return null;
  }
  const ms = Date.parse(`${key}T07:00:00Z`);
  if (Number.isNaN(ms)) {
    return null;
  }
  const rotation = rotationAt(ms);
  return weekKey(rotation) === key ? rotation : null;
}

/** The weeks to show: the shipped ones from `current` on, never an earlier one. */
export function shownRotations(
  shipped: readonly number[],
  current: number,
): number[] {
  return shipped.filter((rotation) => rotation >= current);
}

const dayMs = 24 * 60 * 60 * 1000;
const hourMs = 60 * 60 * 1000;
const minuteMs = 60 * 1000;

const unit = (count: number, name: string) =>
  `${String(count)} ${name}${count === 1 ? "" : "s"}`;

/** "1 day 22 hours", "5 hours 12 minutes", "8 minutes": the two largest units. */
export function formatCountdown(ms: number): string {
  if (ms < minuteMs) {
    return "less than a minute";
  }
  const days = Math.floor(ms / dayMs);
  const hours = Math.floor((ms % dayMs) / hourMs);
  const minutes = Math.floor((ms % hourMs) / minuteMs);
  if (days > 0) {
    return hours > 0
      ? `${unit(days, "day")} ${unit(hours, "hour")}`
      : unit(days, "day");
  }
  if (hours > 0) {
    return minutes > 0
      ? `${unit(hours, "hour")} ${unit(minutes, "minute")}`
      : unit(hours, "hour");
  }
  return unit(minutes, "minute");
}

const chipDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** A week's short date, from its UTC start: "27 Oct". */
export function weekDate(rotation: number): string {
  return chipDate.format(weekStart(rotation));
}

/** A week's name in the switch and lists: "This week", "Next week", then "27 Oct". */
export function weekLabel(rotation: number, current: number): string {
  if (rotation === current) {
    return "This week";
  }
  return rotation === current + 1 ? "Next week" : weekDate(rotation);
}

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** A week's dates for screen readers, from its UTC start and end: "13 to 20 October". */
export function weekSpan(rotation: number): string {
  const [startDay = "", startMonth = ""] = longDate
    .format(weekStart(rotation))
    .split(" ");
  const end = longDate.format(weekStart(rotation + 1));
  const [endDay = "", endMonth = ""] = end.split(" ");
  return startMonth === endMonth
    ? `${startDay} to ${endDay} ${endMonth}`
    : `${startDay} ${startMonth} to ${end}`;
}

/** A moment in the viewer's own time zone, named: "Tue 13 Oct, 09:00 CEST". */
export function localMoment(ms: number, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
    ...(timeZone === undefined ? {} : { timeZone }),
  }).formatToParts(ms);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} ${part("month")}, ${part("hour")}:${part("minute")} ${part("timeZoneName")}`;
}
