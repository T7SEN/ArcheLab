import { describe, expect, it } from "vitest";
import {
  bountyTargets,
  eta0OpenDays,
  gameEvents,
  hqOrderCycles,
} from "./timers";

// The update notes' times, kept in UTC (`research_notes/TFD timers/sources.md`).
const dayStart = (iso: string) =>
  new Date(iso).getUTCHours() === 7 && new Date(iso).getUTCMinutes() === 0;

describe("hqOrderCycles", () => {
  it("runs back to back, three days each, from 07:00 UTC", () => {
    for (const cycle of hqOrderCycles) {
      expect(dayStart(cycle.startsAt), cycle.startsAt).toBe(true);
      expect(
        Date.parse(cycle.endsAt) - Date.parse(cycle.startsAt),
        cycle.startsAt,
      ).toBe(3 * 24 * 60 * 60 * 1000);
    }
    for (const [index, cycle] of hqOrderCycles.slice(1).entries()) {
      expect(cycle.startsAt).toBe(hqOrderCycles[index]?.endsAt);
    }
  });

  it("has seven quests in each cycle, each with a reward to choose", () => {
    for (const cycle of hqOrderCycles) {
      expect(cycle.quests, cycle.startsAt).toHaveLength(7);
      for (const quest of cycle.quests) {
        expect(quest.rewards.length, quest.objective).toBeGreaterThan(0);
      }
    }
  });
});

describe("gameEvents", () => {
  it("ends after it starts, each name once", () => {
    for (const event of gameEvents) {
      expect(Date.parse(event.endsAt), event.name).toBeGreaterThan(
        Date.parse(event.startsAt),
      );
    }
    expect(new Set(gameEvents.map((event) => event.name)).size).toBe(
      gameEvents.length,
    );
  });
});

describe("the week", () => {
  it("gives each weekday one bounty target, and ETA-0 four days", () => {
    expect(bountyTargets.map((target) => target.day)).toEqual([1, 2, 3, 4, 5]);
    expect([...eta0OpenDays].sort()).toEqual([0, 1, 5, 6]);
  });
});
