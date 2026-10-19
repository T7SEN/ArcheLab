import { describe, expect, it } from "vitest";
import {
  axionFiltersToSearch,
  defaultAxionFilters,
  localDays,
  parseAxionFilters,
} from "./mission-filters";

const offered = {
  days: ["2026-10-20", "2026-10-21"],
  missions: ["first-crater", "ax-refinery"],
};

describe("filters in the URL", () => {
  it("read back what they wrote, and leave defaults out", () => {
    const filters = { day: "2026-10-21", open: "first-crater" };
    const search = axionFiltersToSearch(filters);
    expect(search).toBe("?day=2026-10-21&mission=first-crater");
    expect(parseAxionFilters(search, offered)).toEqual(filters);
    expect(axionFiltersToSearch(defaultAxionFilters)).toBe("");
  });

  it("ignore a day the schedule doesn't show and a mission the page doesn't have", () => {
    expect(
      parseAxionFilters("?day=2026-12-25&mission=nowhere", offered),
    ).toEqual(defaultAxionFilters);
    // Today is never in the URL: it is the default.
    expect(parseAxionFilters("?day=2026-10-19", offered).day).toBeNull();
  });
});

describe("localDays", () => {
  it("gives today and the days after it, each from midnight to the next", () => {
    const days = localDays(Date.parse("2026-10-19T12:00:00Z"), 7);
    expect(days).toHaveLength(7);
    for (const [index, day] of days.entries()) {
      expect(day.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(day.end).toBeGreaterThan(day.start);
      expect(new Date(day.start).getHours()).toBe(0);
      if (index > 0) {
        expect(day.start).toBe(days[index - 1]?.end);
      }
    }
    expect(new Set(days.map((day) => day.key)).size).toBe(7);
  });
});
