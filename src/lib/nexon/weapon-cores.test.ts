import { describe, expect, it } from "vitest";
import type { CoreTypeRecord } from "./core-types";
import { metadataUrl } from "./metadata";
import {
  coreSlotTypesOf,
  crossCheckWeaponCoreSlots,
  slotNameOf,
  weaponCoreTypeChoices,
  type CoreSlotRecord,
} from "./weapon-cores";

/** A core type shaped like NEXON's, by its option sets' ids (read 2026-10-17). */
const type = (id: string, name: string, sets: string[]): CoreTypeRecord => ({
  core_type_id: id,
  core_type: name,
  core_option: sets.map((set) => ({ core_option_id: set, detail: [] })),
});

const coreTypes = [
  type("382000101", "Firepower Augmentation", ["383000101"]),
  type("382000102", "Firepower Augmentation", ["383000102"]),
  type("382000301", "Hit Augmentation", ["383000301"]),
  type("382000302", "Hit Augmentation", ["383000302"]),
  type("382009901", "Free Augmentation", ["383000101", "383000301"]),
  type("382009902", "Free Augmentation", ["383000102", "383000301"]),
];

describe("core-slot.json", () => {
  it("is read from above the language folder", () => {
    expect(metadataUrl("core-slot")).toBe(
      "https://open.api.nexon.com/static/tfd/meta/core-slot.json",
    );
  });
});

describe("coreSlotTypesOf", () => {
  const coreSlots: CoreSlotRecord[] = [
    {
      core_slot_id: "381000009",
      available_weapon_id: ["211043001"],
      available_core_type_id: ["382009901", "382000101", "382000301"],
    },
  ];

  it("gives a weapon's slot types in order, from the slot ids it lists", () => {
    expect(coreSlotTypesOf(["381000009"], coreSlots)).toEqual([
      "382009901",
      "382000101",
      "382000301",
    ]);
    expect(coreSlotTypesOf(["381000999"], coreSlots)).toEqual([]);
  });
});

describe("slotNameOf", () => {
  it("names a slot as the game does", () => {
    expect(slotNameOf("382009902", coreTypes)).toBe("Free");
    expect(slotNameOf("382000301", coreTypes)).toBe("Hit");
    expect(slotNameOf("382000999", coreTypes)).toBeUndefined();
  });
});

describe("weaponCoreTypeChoices", () => {
  it("fits each type to the Free slot and the weapon's slots of its own type", () => {
    expect(
      weaponCoreTypeChoices(
        ["382009901", "382000101", "382000101", "382000301"],
        coreTypes,
      ),
    ).toEqual([
      { id: "382000101", slots: ["Free", "Firepower"] },
      {
        id: "382000301",
        slots: ["Free", "Hit"],
        alsoTakes: "Hit Augmentation Core",
      },
    ]);
  });

  it("gives a Launcher's Free slot the Firepower type its Free variant holds", () => {
    // Sigvore's Proof: two Free slots of 382009902, with Explosive ATK Firepower.
    expect(
      weaponCoreTypeChoices(["382009902", "382009902", "382000102"], coreTypes),
    ).toEqual([
      { id: "382000102", slots: ["Free", "Firepower"] },
      { id: "382000301", slots: ["Free"], alsoTakes: "Hit Augmentation Core" },
    ]);
  });

  it("shows a weapon without a Free slot only its own slots' types", () => {
    // A melee weapon's Hit slots, with no plain Hit core.
    expect(
      weaponCoreTypeChoices(["382000302", "382000302"], coreTypes),
    ).toEqual([{ id: "382000302", slots: ["Hit"] }]);
  });
});

describe("crossCheckWeaponCoreSlots", () => {
  const ours = new Map([
    ["Thunder Cage", ["Free", "Firepower", "Hit", "Tactical", "Precision"]],
    ["Python", ["Free", "Firepower", "Tactical", "Precision", "Precision"]],
  ]);

  it("finds nothing when NEXON's set agrees", () => {
    expect(crossCheckWeaponCoreSlots(new Map(ours), ours)).toEqual([]);
  });

  it("names a weapon on one side only, or with different slots", () => {
    expect(
      crossCheckWeaponCoreSlots(
        new Map([
          ["Thunder Cage", ["Free", "Firepower", "Hit", "Tactical", "Special"]],
          ["Voltia", ["Free", "Firepower", "Attribute", "Tactical", "Special"]],
        ]),
        ours,
      ),
    ).toEqual([
      "Thunder Cage has Free, Firepower, Hit, Tactical, Special in NEXON's set, Free, Firepower, Hit, Tactical, Precision in weapon-core-slots.ts.",
      "Python is in weapon-core-slots.ts, not NEXON's set.",
      "Voltia is in NEXON's set, not weapon-core-slots.ts.",
    ]);
  });
});
