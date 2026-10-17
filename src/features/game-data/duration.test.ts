import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it("reads Raven's research times as the game shows them (T7SEN, 2026-10-17)", () => {
    expect(formatDuration(57600)).toBe("16 hours");
    expect(formatDuration(28800)).toBe("8 hours");
  });

  it("names every unit it needs, and keeps hours past a day", () => {
    expect(formatDuration(27000)).toBe("7 hours 30 minutes");
    expect(formatDuration(129600)).toBe("36 hours");
    expect(formatDuration(75)).toBe("1 minute 15 seconds");
    expect(formatDuration(3600)).toBe("1 hour");
    expect(formatDuration(6)).toBe("6 seconds");
    expect(formatDuration(0)).toBe("0 seconds");
  });

  it("adds back up to the seconds it was given", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (seconds) => {
        const size = { hour: 3600, minute: 60, second: 1 };
        const total = [
          ...formatDuration(seconds).matchAll(/(\d+) (hour|minute|second)s?/g),
        ].reduce(
          (sum, [, count, unit]) =>
            sum + Number(count) * size[unit as keyof typeof size],
          0,
        );
        expect(total).toBe(seconds);
      }),
    );
  });
});
