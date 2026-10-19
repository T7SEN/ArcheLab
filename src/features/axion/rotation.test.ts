import { describe, expect, it } from "vitest";
import { axionCycle, axionMissions } from "@/data/axion-operational-areas";
import {
  pairIn,
  rotationAt,
  rotationStart,
  rotationsBetween,
  rotationsOf,
} from "./rotation";

// tfdhub.gg's schedule, read 2026-10-19 (`research_notes/TFD axion operational
// areas/sources.md`): the cycle's first pair from 2026-10-18 21:00 UTC, two hours each.
const at = (iso: string) => Date.parse(iso);

describe("the cycle", () => {
  it("has seven pairs of the seven missions, each mission in two of them", () => {
    expect(axionCycle).toHaveLength(7);
    expect(axionMissions).toHaveLength(7);
    for (const name of axionMissions) {
      expect(
        axionCycle.filter((pair) => pair.includes(name)),
        name,
      ).toHaveLength(2);
    }
  });
});

describe("rotationAt and pairIn", () => {
  it("start at the anchor and change every two hours on odd UTC hours", () => {
    expect(rotationAt(at("2026-10-18T21:00:00Z"))).toBe(0);
    expect(rotationAt(at("2026-10-18T22:59:59Z"))).toBe(0);
    expect(rotationAt(at("2026-10-18T23:00:00Z"))).toBe(1);
    expect(rotationStart(1)).toBe(at("2026-10-18T23:00:00Z"));
  });

  it("give the pairs tfdhub showed on 19 October", () => {
    expect(pairIn(rotationAt(at("2026-10-19T08:57:00Z")))).toEqual([
      "Liquefied AX Vault",
      "Emergency Deployment Zone",
    ]);
    expect(pairIn(rotationAt(at("2026-10-19T09:00:00Z")))).toEqual([
      "AX Power Converter Station",
      "First Crater",
    ]);
    // Seven rotations on, the cycle again.
    expect(pairIn(rotationAt(at("2026-10-19T11:00:00Z")))).toEqual([
      "AX Refinery",
      "Liquefied AX Vault",
    ]);
  });

  it("run before the anchor too", () => {
    expect(rotationAt(at("2026-10-18T20:59:59Z"))).toBe(-1);
    expect(pairIn(-1)).toEqual(axionCycle[6]);
  });
});

describe("rotationsBetween", () => {
  it("lists every rotation active in a span, the one running at its start first", () => {
    // A UTC day: the rotation from 23:00 the day before, then twelve more.
    const day = rotationsBetween(
      at("2026-10-19T00:00:00Z"),
      at("2026-10-20T00:00:00Z"),
    );
    expect(day).toHaveLength(13);
    expect(rotationStart(day[0] ?? 0)).toBe(at("2026-10-18T23:00:00Z"));
    // A day starting on a change, as UTC+3's: exactly twelve.
    expect(
      rotationsBetween(at("2026-10-18T21:00:00Z"), at("2026-10-19T21:00:00Z")),
    ).toHaveLength(12);
  });
});

describe("rotationsOf", () => {
  it("finds a mission's next turns, from a rotation on", () => {
    expect(rotationsOf("First Crater", 0, 2)).toEqual([4, 6]);
    expect(rotationsOf("First Crater", 6, 3)).toEqual([6, 11, 13]);
    expect(rotationsOf("Nowhere", 0, 2)).toEqual([]);
  });
});
