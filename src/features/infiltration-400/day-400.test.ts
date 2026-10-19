import { describe, expect, it } from "vitest";
import {
  cycle400,
  outside400Cycle,
  rotation400,
} from "@/data/infiltration-400";
import {
  dayAt,
  dayKey,
  dayLabel,
  dayMs,
  dayOfKey,
  daySpan,
  dayStart,
  daysOf,
  pairOn,
} from "./day-400";

// The cycle's first day: Tuesday 11 August 2026, 07:00 UTC (src/data).
const anchor = Date.parse("2026-08-11T07:00:00Z");

/** The thirteen operations with a 400% difficulty (NEXON's drop places, 2026-10-18). */
const operations = [
  "Magister Lab",
  "Slumber Valley",
  "The Shelter",
  "The Forgottense",
  "Unknown Laboratory",
  "Seed Vault",
  "The Chapel",
  "The Asylum",
  "Caligo Ossuary",
  "Mystery's End",
  "The Haven",
  "Heart of the Fortress",
  "Quarantine Zone",
];

describe("the cycle", () => {
  it("is 50 days of two different operations, each with a 400% difficulty", () => {
    expect(cycle400).toHaveLength(rotation400.days);
    for (const [first, second] of cycle400) {
      expect(first).not.toBe(second);
      expect(operations).toContain(first);
      expect(operations).toContain(second);
    }
  });

  it("names every operation but the ones outside it", () => {
    const named = new Set(cycle400.flat());
    for (const name of operations) {
      expect(named.has(name)).toBe(!outside400Cycle.includes(name));
    }
  });
});

describe("the days", () => {
  it("start at 07:00 UTC, counted from the cycle's first day", () => {
    expect(dayAt(anchor)).toBe(0);
    expect(dayAt(anchor - 1)).toBe(-1);
    expect(dayAt(anchor + dayMs)).toBe(1);
    expect(dayStart(68)).toBe(Date.parse("2026-10-18T07:00:00Z"));
  });

  it("repeat the pairs every 50 days, before the first day too", () => {
    expect(pairOn(0)).toEqual(["Slumber Valley", "The Haven"]);
    expect(pairOn(50)).toEqual(pairOn(0));
    expect(pairOn(-1)).toEqual(pairOn(49));
    // tfdhub's page on 2026-10-18.
    expect(pairOn(dayAt(Date.parse("2026-10-18T12:00:00Z")))).toEqual([
      "The Shelter",
      "Caligo Ossuary",
    ]);
  });

  it("have keys that read back only from a day's start date", () => {
    expect(dayKey(68)).toBe("2026-10-18");
    expect(dayOfKey("2026-10-18")).toBe(68);
    expect(dayOfKey("2026-02-30")).toBeNull();
    expect(dayOfKey("tomorrow")).toBeNull();
  });

  it("are named today, tomorrow, then by date", () => {
    expect(dayLabel(68, 68)).toBe("Today");
    expect(dayLabel(69, 68)).toBe("Tomorrow");
    expect(dayLabel(70, 68)).toBe("Tue 20 Oct");
    expect(daySpan(70)).toBe("Tuesday 20 October");
  });

  it("find an operation's 400% days through one whole cycle", () => {
    const days = daysOf("Slumber Valley", 0);
    expect(days.slice(0, 2)).toEqual([0, 1]);
    expect(days.every((day) => day < 50)).toBe(true);
    expect(days.every((day) => pairOn(day)?.includes("Slumber Valley"))).toBe(
      true,
    );
    expect(daysOf("Heart of the Fortress", 0)).toEqual([]);
  });
});
