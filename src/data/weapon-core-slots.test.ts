import { describe, expect, it } from "vitest";
import { weaponCoreSlots, weaponCoreTypeChoices } from "./weapon-core-slots";

describe("weaponCoreSlots", () => {
  it("lists five slots for each checked weapon, Free first", () => {
    for (const [name, slots] of weaponCoreSlots) {
      expect(slots, name).toHaveLength(5);
      expect(slots.at(0), name).toBe("Free");
    }
  });
});

describe("weaponCoreTypeChoices", () => {
  it("fits each type to the Free slot and the weapon's slots of its own type", () => {
    // Nazeistra's Devotion, from T7SEN's slot screen (2026-10-17).
    const choices = weaponCoreTypeChoices([
      "Free",
      "Tactical",
      "Precision",
      "Firepower",
      "Hit",
    ]);
    expect(choices.map((choice) => choice.slots)).toEqual([
      ["Free", "Firepower"],
      ["Free"],
      ["Free", "Hit"],
      ["Free", "Tactical"],
      ["Free", "Precision"],
      ["Free"],
    ]);
    expect(choices.at(2)?.alsoTakes).toBe("Hit Augmentation Core");
  });

  it("names a slot type once, however many slots of it a weapon has", () => {
    // Hammer and Anvil has two Precision slots.
    const precision = weaponCoreTypeChoices([
      "Free",
      "Attribute",
      "Precision",
      "Precision",
      "Special",
    ]).at(4);
    expect(precision?.slots).toEqual(["Free", "Precision"]);
  });
});
