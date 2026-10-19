import { describe, expect, it } from "vitest";
import { cycle400 } from "./infiltration-400";
import { equipment400 } from "./infiltration-400-equipment";

// tfdhub's lists, read 2026-10-19 (`research_notes/TFD 400 equipment tfdhub/`).
describe("equipment400", () => {
  const operations = Object.keys(equipment400);

  it("covers every operation in the daily cycle", () => {
    expect(operations.sort()).toEqual([...new Set(cycle400.flat())].sort());
  });

  // Two sets on every 400% operation, as the game is coded (T7SEN, 2026-10-19).
  it("gives each four modules, a reactor or none, and two component sets", () => {
    for (const [operation, lists] of Object.entries(equipment400)) {
      expect(lists?.modules, operation).toHaveLength(4);
      expect(lists?.componentSets, operation).toHaveLength(2);
      if (lists?.reactor !== null) {
        expect(lists?.reactor, operation).toMatch(/ Reactor$/);
      }
    }
    // tfdhub lists no reactor for Magister Lab.
    expect(equipment400["Magister Lab"]?.reactor).toBeNull();
  });

  it("gives Magister Lab Slayer and HP Support, as T7SEN checked in game", () => {
    expect(equipment400["Magister Lab"]?.componentSets).toEqual([
      "Slayer",
      "HP Support",
    ]);
  });
});
