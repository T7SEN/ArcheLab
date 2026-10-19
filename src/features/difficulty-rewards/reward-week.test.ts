import { describe, expect, it } from "vitest";
import {
  currentRotation,
  formatCountdown,
  localMoment,
  rotationAt,
  rotationOfKey,
  shownRotations,
  weekKey,
  weekLabel,
  weekMs,
  weekSpan,
  weekStart,
} from "./reward-week";

// Rotation 116 started on Tuesday 13 October 2026 at 07:00 UTC (src/data).
const anchor = Date.parse("2026-10-13T07:00:00Z");

describe("the weeks", () => {
  it("start each Tuesday at 07:00 UTC from the anchor", () => {
    expect(weekStart(116)).toBe(anchor);
    expect(new Date(weekStart(117)).toISOString()).toBe(
      "2026-10-20T07:00:00.000Z",
    );
    expect(weekStart(115)).toBe(anchor - weekMs);
  });

  it("change at exactly 07:00:00.000 UTC", () => {
    expect(rotationAt(anchor)).toBe(116);
    expect(rotationAt(anchor - 1)).toBe(115);
    expect(rotationAt(anchor + weekMs - 1)).toBe(116);
    expect(rotationAt(anchor + weekMs)).toBe(117);
  });

  it("never show a week before the first one the build shipped", () => {
    expect(currentRotation(anchor - 3 * weekMs, 116)).toBe(116);
    expect(currentRotation(anchor + weekMs, 116)).toBe(117);
    expect(shownRotations([115, 116, 117, 118], 117)).toEqual([117, 118]);
  });
});

describe("week keys", () => {
  it("are the start's UTC date, and read back only from a week start", () => {
    expect(weekKey(116)).toBe("2026-10-13");
    expect(rotationOfKey("2026-10-13")).toBe(116);
    expect(rotationOfKey("2026-10-27")).toBe(118);
    expect(rotationOfKey("2026-10-14")).toBeNull();
    expect(rotationOfKey("2026-13-40")).toBeNull();
    expect(rotationOfKey("next week")).toBeNull();
  });
});

describe("labels", () => {
  it("name this week, next week, then the start's date", () => {
    expect(weekLabel(116, 116)).toBe("This week");
    expect(weekLabel(117, 116)).toBe("Next week");
    expect(weekLabel(118, 116)).toBe("27 Oct");
  });

  it("span a week for screen readers, across months too", () => {
    expect(weekSpan(116)).toBe("13 to 20 October");
    expect(weekSpan(118)).toBe("27 October to 3 November");
  });

  it("count down in the two largest units", () => {
    const minute = 60 * 1000;
    const hour = 60 * minute;
    expect(formatCountdown(30 * 1000)).toBe("less than a minute");
    expect(formatCountdown(8 * minute)).toBe("8 minutes");
    expect(formatCountdown(hour)).toBe("1 hour");
    expect(formatCountdown(5 * hour + 12 * minute)).toBe("5 hours 12 minutes");
    expect(formatCountdown(46 * hour)).toBe("1 day 22 hours");
    expect(formatCountdown(48 * hour + 5 * minute)).toBe("2 days");
  });

  it("name a moment in a viewer's time zone", () => {
    expect(localMoment(anchor, "Europe/Berlin")).toBe("Tue 13 Oct, 09:00 CEST");
    expect(localMoment(anchor, "UTC")).toBe("Tue 13 Oct, 07:00 UTC");
  });
});
