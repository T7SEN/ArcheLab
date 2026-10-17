/**
 * Core slots a weapon has in game for each core slot NEXON lists (ADR 0024). NEXON lists
 * one (`available_core_slot`) on every Ultimate weapon, 43 on 2026-10-17, and none on
 * the others; T7SEN: "All Ultimate weapons can have up to 5 Cores" (2026-10-17), and
 * tooltips of Thunder Cage, Hammer and Anvil and Nazeistra's Devotion show five.
 */
export const weaponCoreSlotsPerListed = 5;

/**
 * Every Ultimate weapon's five core slots, in the game's order, by NEXON's weapon name:
 * the cross-check for NEXON's `core-slot.json`, which the pages show (ADR 0042;
 * `src/lib/nexon/weapon-cores.ts` warns at build about any difference). The slots differ
 * by weapon (T7SEN, 2026-10-17). These are tfdhub.gg's, read from each weapon's page on
 * 2026-10-17 and copied at T7SEN's request, and confirmed by T7SEN the same day; NEXON's
 * set lists the same for all 43 (`research_notes/TFD weapon core slots tfdhub/`). They
 * agree with the four T7SEN had checked in game before: Nazeistra's Devotion and Wave of
 * Light (Select Core Slot screens), Thunder Cage and Hammer and Anvil (tooltips of built
 * weapons, which list the cores in slot order with each slot's icon).
 */
export const weaponCoreSlots: ReadonlyMap<string, readonly string[]> = new Map([
  // Assault Rifle
  [
    "Ancient Knight",
    ["Free", "Firepower", "Firepower", "Attribute", "Tactical"],
  ],
  [
    "Divine Punishment",
    ["Free", "Firepower", "Attribute", "Tactical", "Precision"],
  ],
  ["EXCAVA", ["Free", "Free", "Attribute", "Tactical", "Tactical"]],
  ["Fallen Hope", ["Free", "Firepower", "Attribute", "Tactical", "Precision"]],
  // Balanced Melee Weapon
  [
    "Crime and Punishment",
    ["Firepower", "Firepower", "Firepower", "Attribute", "Attribute"],
  ],
  ["Hypernova", ["Firepower", "Attribute", "Attribute", "Hit", "Hit"]],
  ["Shadow", ["Firepower", "Attribute", "Hit", "Hit", "Hit"]],
  // Beam Rifle
  ["Clairvoyance", ["Free", "Attribute", "Tactical", "Precision", "Precision"]],
  [
    "Eye of the Typhoon",
    ["Free", "Firepower", "Attribute", "Attribute", "Hit"],
  ],
  ["King's Guard Lance", ["Free", "Free", "Firepower", "Attribute", "Special"]],
  [
    "Truly Deadly Arson",
    ["Free", "Free", "Attribute", "Attribute", "Tactical"],
  ],
  ["Voltia", ["Free", "Firepower", "Attribute", "Tactical", "Special"]],
  // Hand Cannon
  ["Malevolent", ["Free", "Firepower", "Attribute", "Tactical", "Tactical"]],
  [
    "Nazeistra's Devotion",
    ["Free", "Tactical", "Precision", "Firepower", "Hit"],
  ],
  ["Peace Maker", ["Free", "Hit", "Tactical", "Precision", "Precision"]],
  ["Perforator", ["Free", "Hit", "Tactical", "Tactical", "Special"]],
  ["Shackles of Mortality", ["Free", "Firepower", "Attribute", "Hit", "Hit"]],
  // Handgun
  [
    "The Final Masterpiece",
    ["Free", "Firepower", "Attribute", "Tactical", "Special"],
  ],
  [
    "The Last Dagger",
    ["Free", "Firepower", "Firepower", "Tactical", "Tactical"],
  ],
  // Launcher
  ["Exterminator", ["Free", "Attribute", "Attribute", "Tactical", "Tactical"]],
  ["Restored Relic", ["Free", "Free", "Attribute", "Attribute", "Tactical"]],
  ["Sigvore's Proof", ["Free", "Free", "Firepower", "Attribute", "Precision"]],
  // Machine Gun
  ["Albion Cavalry Gun", ["Free", "Free", "Attribute", "Hit", "Tactical"]],
  ["Enduring Legacy", ["Free", "Hit", "Precision", "Precision", "Special"]],
  ["Frenzied Locomotive", ["Free", "Hit", "Hit", "Precision", "Precision"]],
  // Power Melee Weapon
  ["Deus Ex Manus", ["Firepower", "Attribute", "Hit", "Hit", "Hit"]],
  // Scout Rifle
  ["Blue Beetle", ["Free", "Firepower", "Attribute", "Tactical", "Precision"]],
  ["ERASER", ["Free", "Attribute", "Attribute", "Tactical", "Precision"]],
  ["FrostWatcher", ["Free", "Firepower", "Attribute", "Tactical", "Special"]],
  ["Wave of Light", ["Free", "Firepower", "Tactical", "Precision", "Special"]],
  // Shotgun
  ["Executor", ["Free", "Firepower", "Precision", "Precision", "Special"]],
  [
    "Hammer and Anvil",
    ["Free", "Attribute", "Precision", "Precision", "Special"],
  ],
  ["Smithereens", ["Free", "Firepower", "Precision", "Precision", "Special"]],
  // Sniper Rifle
  ["A-TAMS", ["Free", "Hit", "Hit", "Hit", "Precision"]],
  ["Afterglow Sword", ["Free", "Hit", "Precision", "Precision", "Special"]],
  [
    "Piercing Light",
    ["Free", "Attribute", "Tactical", "Precision", "Precision"],
  ],
  // Submachine Gun
  ["E-Buster", ["Free", "Firepower", "Hit", "Precision", "Precision"]],
  ["Python", ["Free", "Firepower", "Tactical", "Precision", "Precision"]],
  ["Thunder Cage", ["Free", "Firepower", "Hit", "Tactical", "Precision"]],
  // Tactical Rifle
  [
    "Greg's Reversed Fate",
    ["Free", "Firepower", "Tactical", "Tactical", "Special"],
  ],
  ["Hive Master", ["Free", "Firepower", "Attribute", "Attribute", "Hit"]],
  ["Secret Garden", ["Free", "Hit", "Precision", "Precision", "Special"]],
  ["Whirlwind", ["Free", "Firepower", "Firepower", "Attribute", "Hit"]],
]);

/**
 * A core item the game also takes for a type, by `core-type.json` id, that NEXON's data
 * doesn't tie to it: T7SEN's pictures show the Hit Augmentation Core in a firearm's Hit
 * slot as well as the Hit Augmentation Core (Variant AB) (2026-10-17).
 */
export const weaponCoreAlsoTakes: Readonly<Partial<Record<string, string>>> = {
  "382000301": "Hit Augmentation Core",
};
