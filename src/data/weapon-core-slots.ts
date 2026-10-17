/**
 * Core slots a weapon has in game for each core slot NEXON lists (ADR 0024). NEXON lists
 * one (`available_core_slot`) on every Ultimate weapon, 43 on 2026-10-17, and none on
 * the others; T7SEN: "All Ultimate weapons can have up to 5 Cores" (2026-10-17), and
 * tooltips of Thunder Cage, Hammer and Anvil and Nazeistra's Devotion show five.
 */
export const weaponCoreSlotsPerListed = 5;

/**
 * Each checked weapon's five core slots, in the game's order, by weapon name. The slots
 * differ by weapon (T7SEN, 2026-10-17), and NEXON's keyless data doesn't say which
 * (`core-slot` answers 403), so a weapon not listed here shows no core types.
 */
export const weaponCoreSlots: ReadonlyMap<string, readonly string[]> = new Map([
  // T7SEN's Select Core Slot screens, 2026-10-17.
  [
    "Nazeistra's Devotion",
    ["Free", "Tactical", "Precision", "Firepower", "Hit"],
  ],
  ["Wave of Light", ["Free", "Firepower", "Tactical", "Precision", "Special"]],
  // Read from T7SEN's tooltips of built weapons, 2026-10-17: a tooltip lists the cores
  // in slot order with each slot's icon, as Nazeistra's Devotion's tooltip and slot
  // screen show alike.
  ["Thunder Cage", ["Free", "Firepower", "Hit", "Tactical", "Precision"]],
  [
    "Hammer and Anvil",
    ["Free", "Attribute", "Precision", "Precision", "Special"],
  ],
]);

/**
 * The core types weapon slots take, by `core-type.json` id, with the slot each fits
 * besides Free, which takes any of them (T7SEN, 2026-10-17). They are the six core sets
 * of NEXON's Free Augmentation type (382009901), each with its own core item.
 * `alsoTakes` names a core item the game also takes that NEXON's data doesn't tie to the
 * type: T7SEN's pictures show the Hit Augmentation Core as well as the Hit Augmentation
 * Core (Variant AB).
 */
export const weaponCoreTypes: readonly {
  readonly id: string;
  readonly slot: string;
  readonly alsoTakes?: string;
}[] = [
  { id: "382000101", slot: "Firepower" },
  { id: "382000201", slot: "Attribute" },
  { id: "382000301", slot: "Hit", alsoTakes: "Hit Augmentation Core" },
  { id: "382000401", slot: "Tactical" },
  { id: "382000501", slot: "Precision" },
  { id: "382000601", slot: "Special" },
];

/**
 * The core types to show for a weapon's slots, each with the slots it fits there: the
 * Free slot, and the weapon's slots of its own type. A type only the Free slot takes is
 * still shown.
 */
export function weaponCoreTypeChoices(slots: readonly string[]): {
  readonly id: string;
  readonly slots: readonly string[];
  readonly alsoTakes?: string;
}[] {
  return weaponCoreTypes.map((type) => ({
    id: type.id,
    slots: [
      ...new Set(slots.filter((slot) => slot === "Free" || slot === type.slot)),
    ],
    ...(type.alsoTakes === undefined ? {} : { alsoTakes: type.alsoTakes }),
  }));
}

/** Melee weapons' types end so ("Balanced Melee Weapon"); their cores aren't checked yet. */
export function isMeleeWeaponType(type: string): boolean {
  return type.endsWith("Melee Weapon");
}
