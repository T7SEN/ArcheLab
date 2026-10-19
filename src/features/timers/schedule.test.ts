import { describe, expect, it } from "vitest";
import { gameEvents, type GameEvent } from "@/data/timers";
import {
  bountyOn,
  countdownText,
  eta0At,
  eventGroupOf,
  eventState,
  gameDayStart,
  gameWeekday,
  hqCycleAt,
  hqCyclesFrom,
  nextDailyReset,
  nextWeeklyReset,
  wallCrasherAt,
} from "./schedule";

const at = (iso: string) => Date.parse(iso);

describe("the game day", () => {
  it("starts at 07:00 UTC, the day before until then", () => {
    expect(gameDayStart(at("2026-10-19T06:59:59Z"))).toBe(
      at("2026-10-18T07:00:00Z"),
    );
    expect(gameDayStart(at("2026-10-19T07:00:00Z"))).toBe(
      at("2026-10-19T07:00:00Z"),
    );
    // Monday 19 October, from 07:00 UTC; Sunday before it.
    expect(gameWeekday(at("2026-10-19T12:00:00Z"))).toBe(1);
    expect(gameWeekday(at("2026-10-19T06:00:00Z"))).toBe(0);
  });

  it("resets daily at 07:00 UTC and weekly on Thursday", () => {
    expect(nextDailyReset(at("2026-10-19T12:00:00Z"))).toBe(
      at("2026-10-20T07:00:00Z"),
    );
    expect(nextWeeklyReset(at("2026-10-19T12:00:00Z"))).toBe(
      at("2026-10-22T07:00:00Z"),
    );
    // On Thursday's reset, the next is a week on.
    expect(nextWeeklyReset(at("2026-10-22T07:00:00Z"))).toBe(
      at("2026-10-29T07:00:00Z"),
    );
  });
});

describe("wallCrasherAt", () => {
  it("counts to the next hour, or to the end of its 5 minutes to enter", () => {
    expect(wallCrasherAt(at("2026-10-19T12:37:00Z"))).toEqual({
      spawn: at("2026-10-19T13:00:00Z"),
      open: false,
      closes: at("2026-10-19T13:05:00Z"),
    });
    expect(wallCrasherAt(at("2026-10-19T13:03:00Z"))).toEqual({
      spawn: at("2026-10-19T13:00:00Z"),
      open: true,
      closes: at("2026-10-19T13:05:00Z"),
    });
  });
});

describe("eta0At", () => {
  it("is open from Friday to Monday, closing on Tuesday at 07:00 UTC", () => {
    // tfdhub.gg's Timers page on Monday 19 October: open, closes Tuesday 07:00 UTC.
    expect(eta0At(at("2026-10-19T12:00:00Z"))).toEqual({
      open: true,
      changesAt: at("2026-10-20T07:00:00Z"),
    });
    expect(eta0At(at("2026-10-21T12:00:00Z"))).toEqual({
      open: false,
      changesAt: at("2026-10-23T07:00:00Z"),
    });
  });
});

describe("bountyOn", () => {
  it("gives each weekday its target, and none on the weekend", () => {
    expect(bountyOn(1)?.name).toBe("Resurrected Immortality Obliviant");
    expect(bountyOn(5)).toMatchObject({
      name: "Hungry Abyss Scarab",
      attribute: "Non-Attribute",
    });
    expect(bountyOn(6)).toBeNull();
    expect(bountyOn(0)).toBeNull();
  });
});

describe("HQ Special Orders", () => {
  it("finds the cycle running, and the ones after it", () => {
    expect(hqCycleAt(at("2026-10-19T12:00:00Z"))?.startsAt).toBe(
      "2026-10-18T07:00:00Z",
    );
    expect(hqCycleAt(at("2026-10-21T07:00:00Z"))?.startsAt).toBe(
      "2026-10-21T07:00:00Z",
    );
    expect(hqCyclesFrom(at("2026-10-19T12:00:00Z"))).toHaveLength(12);
    expect(hqCycleAt(at("2026-11-23T07:00:00Z"))).toBeNull();
    expect(hqCyclesFrom(at("2026-11-23T07:00:00Z"))).toEqual([]);
  });
});

describe("eventState", () => {
  const event = (overrides: Partial<GameEvent>): GameEvent => ({
    name: "Test",
    kind: "Boost Event",
    startsAt: "2026-10-16T07:00:00Z",
    endsAt: "2026-11-16T07:00:00Z",
    details: "",
    source: "Update 1.4.5",
    ...overrides,
  });

  it("runs from its start to its end", () => {
    expect(eventState(event({}), at("2026-10-01T00:00:00Z"))).toEqual({
      status: "upcoming",
      on: false,
      changesAt: at("2026-10-16T07:00:00Z"),
    });
    expect(eventState(event({}), at("2026-10-19T12:00:00Z"))).toEqual({
      status: "running",
      on: true,
      changesAt: at("2026-11-16T07:00:00Z"),
    });
    expect(eventState(event({}), at("2026-11-16T07:00:00Z")).status).toBe(
      "ended",
    );
  });

  it("is on only on its days: Descendant's Weekend, Friday to Sunday", () => {
    const weekend = event({ days: [5, 6, 0] });
    // Monday: next on Friday at 07:00 UTC.
    expect(eventState(weekend, at("2026-10-19T12:00:00Z"))).toEqual({
      status: "running",
      on: false,
      changesAt: at("2026-10-23T07:00:00Z"),
    });
    // Saturday: on until Monday at 07:00 UTC.
    expect(eventState(weekend, at("2026-10-24T12:00:00Z"))).toEqual({
      status: "running",
      on: true,
      changesAt: at("2026-10-26T07:00:00Z"),
    });
  });
});

describe("eventGroupOf", () => {
  it("puts every listed event under a tab", () => {
    for (const { name, kind } of gameEvents) {
      expect(eventGroupOf(kind), name).not.toBe("Other");
    }
    expect(eventGroupOf("Boost Event")).toBe("Boosts");
    expect(eventGroupOf("Something new")).toBe("Other");
  });
});

describe("countdownText", () => {
  it("writes days, hours, minutes and seconds as they fit", () => {
    expect(countdownText(54_000)).toBe("54s");
    expect(countdownText((40 * 60 + 4) * 1000)).toBe("40m 04s");
    expect(countdownText((19 * 60 + 40) * 60_000)).toBe("19h 40m");
    expect(countdownText(((2 * 24 + 19) * 60 + 40) * 60_000)).toBe(
      "2d 19h 40m",
    );
    expect(countdownText(-5)).toBe("0s");
  });
});
