import { describe, expect, it } from "vitest";
import {
  fellowEffects,
  fellowLevelFacts,
  fellowPassiveOf,
  fellowPassives,
} from "./fellows";

describe("Fellow facts from the Update 1.4.0 notes", () => {
  it("has one row for every level from 1 to 40, in order", () => {
    expect(fellowLevelFacts.map((row) => row.level)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1),
    );
  });

  it("keeps the notes' first and last rows", () => {
    expect(fellowLevelFacts.at(0)).toEqual({
      level: 1,
      autoDismantleCycle: 60,
      passives: {
        hp: { interval: 30, ratio: 0.16 },
        rounds: { interval: 70, ratio: 0.2 },
        mp: { interval: 45, ratio: 0.08 },
      },
    });
    expect(fellowLevelFacts.at(-1)).toEqual({
      level: 40,
      autoDismantleCycle: 60,
      passives: {
        hp: { interval: 17, ratio: 0.358 },
        rounds: { interval: 22.5, ratio: 0.2 },
        mp: { interval: 15, ratio: 0.23 },
      },
    });
  });

  it("gives the same Fellows a passive and an effect, one passive each", () => {
    const named = Object.keys(fellowPassiveOf).sort();
    expect(Object.keys(fellowEffects).sort()).toEqual(named);
    expect(new Set(Object.values(fellowPassiveOf))).toEqual(
      new Set(Object.keys(fellowPassives)),
    );
  });
});
