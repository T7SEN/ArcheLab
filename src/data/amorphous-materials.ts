/**
 * What the game shows about Amorphous Material Patterns that NEXON's data doesn't, from
 * T7SEN's in-game list (screenshots of every Amorphous material, 2026-10-17; ADR 0041):
 * - The game has the 44 patterns below. NEXON's `consumable-material.json` also lists
 *   the removed numbered ones, their Variants and Mutants (204), and Hagios Sheepdog's,
 *   which the game no longer shows.
 * - Every pattern is Ultimate but two, Bunny's and Freyna's, which are Rare.
 * - The same list holds Shape Stabilizer Form 7 and Form 8 (Ultimate), which aren't
 *   patterns and open nothing; the page leaves them out.
 */

/** The patterns in the game, by the name after "Amorphous Material Pattern: ". */
export const inGamePatterns: readonly string[] = [
  // Descendants
  "Bunny",
  "Freyna",
  "Ines",
  "Serena",
  "Dia",
  "Harris",
  "Raven",
  "Ultimate Ajax",
  "Ultimate Gley",
  "Ultimate Sharen",
  "Ultimate Valby",
  "Ultimate Luna",
  "Ultimate Blair",
  "Ultimate Yujin",
  "Ultimate Esiemo",
  "Ultimate Hailey",
  // Weapons
  "Albion Cavalry Gun",
  "Malevolent",
  "Nazeistra's Devotion",
  "EXCAVA",
  "Hammer and Anvil",
  "The Final Masterpiece",
  "Wave of Light",
  "Clairvoyance",
  "E-Buster",
  "Restored Relic",
  "Peace Maker",
  "Perforator",
  "King's Guard Lance",
  "Ancient Knight",
  "Greg's Reversed Fate",
  "Sigvore's Proof",
  "Shadow",
  "Deus Ex Manus",
  "ERASER",
  "Exterminator",
  "Hive Master",
  "Crime and Punishment",
  "Whirlwind",
  "Shackles of Mortality",
  // Fellows
  "Vespers Hunting Dog",
  "Snowy Sled Dog",
  // Vehicles
  "Orca",
  "Vortex",
];

/** Whether a pattern, by the name after the prefix, is in the game. */
export function patternInGame(name: string): boolean {
  return inGamePatterns.includes(name);
}

/** The Rare patterns, by name; the rest are Ultimate. */
export const rarePatterns: readonly string[] = ["Bunny", "Freyna"];

/** A pattern's tier as NEXON writes tiers: `Tier2` (Rare) or `Tier3` (Ultimate). */
export function patternTier(name: string): "Tier2" | "Tier3" {
  return rarePatterns.includes(name) ? "Tier2" : "Tier3";
}
