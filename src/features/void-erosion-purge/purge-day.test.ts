import { describe, expect, it } from "vitest";
import { purgeCycle } from "@/data/void-erosion-purge";
import {
  dayAt,
  dayDate,
  dayLabel,
  daySpan,
  dayStart,
  daysOf,
  mapOn,
} from "./purge-day";

// tfdhub.gg's schedule, read 2026-10-19 (`research_notes/TFD void erosion purge/
// sources.md`): the cycle's first map from 2026-10-18 07:00 UTC, a day each.
const at = (iso: string) => Date.parse(iso);

describe("the cycle", () => {
  it("has the five maps, each once", () => {
    expect(purgeCycle).toHaveLength(5);
    expect(new Set(purgeCycle).size).toBe(5);
  });
});

describe("dayAt and mapOn", () => {
  it("start at the anchor and change every day at 07:00 UTC", () => {
    expect(dayAt(at("2026-10-18T07:00:00Z"))).toBe(0);
    expect(dayAt(at("2026-10-19T06:59:59Z"))).toBe(0);
    expect(dayAt(at("2026-10-19T07:00:00Z"))).toBe(1);
    expect(dayStart(1)).toBe(at("2026-10-19T07:00:00Z"));
  });

  it("give the maps tfdhub showed on 19 October", () => {
    expect(mapOn(dayAt(at("2026-10-17T12:00:00Z")))).toBe(
      "Eroded Vulgus Underground Facilities",
    );
    expect(mapOn(dayAt(at("2026-10-18T12:00:00Z")))).toBe(
      "Eroded Ancestors Ruins",
    );
    expect(mapOn(dayAt(at("2026-10-19T10:29:00Z")))).toBe(
      "Amorphous Contamination Zone",
    );
    expect(mapOn(dayAt(at("2026-10-20T07:00:00Z")))).toBe(
      "Twisted Ancestors' Facility",
    );
    expect(mapOn(dayAt(at("2026-10-21T07:00:00Z")))).toBe(
      "Eroded Vulgus Reactor",
    );
    // Five days on, the cycle again.
    expect(mapOn(dayAt(at("2026-10-23T07:00:00Z")))).toBe(
      "Eroded Ancestors Ruins",
    );
  });

  it("run before the anchor too", () => {
    expect(dayAt(at("2026-10-18T06:59:59Z"))).toBe(-1);
    expect(mapOn(-1)).toBe(purgeCycle[4]);
  });
});

describe("daysOf", () => {
  it("finds a map's next days, from a day on", () => {
    expect(daysOf("Amorphous Contamination Zone", 1, 3)).toEqual([1, 6, 11]);
    expect(daysOf("Eroded Ancestors Ruins", 1, 2)).toEqual([5, 10]);
    expect(daysOf("Nowhere", 0, 2)).toEqual([]);
  });
});

describe("day names", () => {
  it("name the days around today, then the UTC date", () => {
    expect(dayLabel(1, 1)).toBe("Today");
    expect(dayLabel(0, 1)).toBe("Yesterday");
    expect(dayLabel(2, 1)).toBe("Tomorrow");
    expect(dayLabel(3, 1)).toBe("Wed 21 Oct");
    expect(dayDate(1)).toBe("Mon 19 Oct");
    expect(daySpan(2)).toBe("Tuesday 20 October");
  });
});
