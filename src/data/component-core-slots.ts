/**
 * Core slots an external component has in game for each core slot NEXON lists (ADR
 * 0027). NEXON lists one (`available_core_slot`) on every Ultimate piece and none on the
 * others; T7SEN's in-game tooltip of an Ultimate Shell Crusher Sensor shows two empty
 * core slots (2026-10-17). All 124 Ultimate pieces are listed alike, so each counts two.
 */
export const coreSlotsPerListed = 2;

/**
 * The core types those two slots take, in the tooltip's order: one Recovery
 * Augmentation core and one Defense Augmentation core, on every Ultimate piece (T7SEN,
 * 2026-10-17). The ids are `core-type.json`'s; NEXON's keyless data doesn't say which
 * types a slot takes (`core-slot` answers 403).
 */
export const componentCoreTypeIds: readonly string[] = [
  "382010101", // Recovery Augmentation
  "382010201", // Defense Augmentation
];
