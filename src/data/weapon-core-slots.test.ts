import { describe, expect, it } from "vitest";
import { weaponCoreSlots } from "./weapon-core-slots";

const meleeWeapons = [
  "Crime and Punishment",
  "Deus Ex Manus",
  "Hypernova",
  "Shadow",
];

describe("weaponCoreSlots", () => {
  it("lists five slots for each weapon, Free first on firearms", () => {
    for (const [name, slots] of weaponCoreSlots) {
      expect(slots, name).toHaveLength(5);
      if (meleeWeapons.includes(name)) {
        expect(slots, name).not.toContain("Free");
      } else {
        expect(slots.at(0), name).toBe("Free");
      }
    }
  });

  it("has all 43 Ultimate weapons, agreeing with T7SEN's in-game checks", () => {
    expect(weaponCoreSlots.size).toBe(43);
    // From T7SEN's slot screens and tooltips (2026-10-17).
    expect(weaponCoreSlots.get("Nazeistra's Devotion")).toEqual([
      "Free",
      "Tactical",
      "Precision",
      "Firepower",
      "Hit",
    ]);
    expect(weaponCoreSlots.get("Wave of Light")).toEqual([
      "Free",
      "Firepower",
      "Tactical",
      "Precision",
      "Special",
    ]);
    expect(weaponCoreSlots.get("Thunder Cage")).toEqual([
      "Free",
      "Firepower",
      "Hit",
      "Tactical",
      "Precision",
    ]);
    expect(weaponCoreSlots.get("Hammer and Anvil")).toEqual([
      "Free",
      "Attribute",
      "Precision",
      "Precision",
      "Special",
    ]);
  });
});
