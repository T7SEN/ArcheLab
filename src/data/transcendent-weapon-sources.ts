/**
 * Where Transcendent weapons come from, as of Update 1.4.5, from the game's update
 * notes (ADR 0032; their data is in `reports/TFD update notes 1.4.0 and later.md`):
 * - Update 1.4.0, https://tfd.nexon.com/en/news/3528592 (20 August 2026; Onslaught's
 *   Quality ranges revised 23 August): the sources, the boxes, first clears, Trials;
 * - Update 1.4.3, https://tfd.nexon.com/en/news/3546703: Breach Tracking and Cradle of
 *   Evolution added, and trading;
 * - Update 1.4.5, https://tfd.nexon.com/en/news/3563834: Onslaught Stage 5, Monster
 *   Hunter in the loot, the Rotational Boost, and higher chances at "Ship Boarding
 *   Point", which T7SEN confirmed is Karel's Mothership's mission (2026-10-17).
 * T7SEN chose these notes as the source (2026-10-17). NEXON's metadata says nothing
 * about where any weapon comes from.
 *
 * The notes give one set of sources for every Transcendent weapon, not a source per
 * weapon. Names are copied as the notes write them ("The Forgottense" included);
 * chances are as written.
 */

/**
 * The Transcendent weapons these sources cover: the 11 Update 1.4.0 added, and Monster
 * Hunter, which Update 1.4.5 put in every Transcendent Weapon Loot. T7SEN confirmed it
 * also comes from Deslin's boxes and the first clears (2026-10-17).
 */
export const transcendentSourceWeapons: ReadonlySet<string> = new Set([
  "ARMIS",
  "Unleashed Instinct",
  "Storm Cage",
  "Malicious Dominator",
  "Raging Light",
  "Emperor's Guard Lance",
  "Sparky",
  "Frost Blossom",
  "ATR-0 Prototype",
  "Volcanic Heart",
  "Nightmare Launcher",
  "Monster Hunter",
]);

/** A Quality range, both ends included. */
export interface QualityRange {
  readonly min: number;
  readonly max: number;
}

/** Content that drops Transcendent weapons, and its chance on mission completion. */
export interface TranscendentDrop {
  readonly content: string;
  readonly quality: QualityRange;
  /** "Mission Completion Rewards Acquisition Chance", as written. */
  readonly chance: string;
}

const range = (min: number, max: number): QualityRange => ({ min, max });

/**
 * "Content that Drops Transcendent Weapons": Update 1.4.0's table in its order, with
 * the contents later updates added after the ones of their Quality range.
 */
export const transcendentDrops: readonly TranscendentDrop[] = [
  { content: "Old Mystery - Normal", quality: range(1, 150), chance: "5.17%" },
  {
    content: "Mystery's End - Normal",
    quality: range(1, 150),
    chance: "4.89%",
  },
  {
    content: "Heart of the Fortress - Normal",
    quality: range(1, 150),
    chance: "4.39%",
  },
  {
    content: "Slumber Valley - Normal",
    quality: range(1, 150),
    chance: "4.31%",
  },
  { content: "Bio-Lab - Normal", quality: range(1, 150), chance: "3.75%" },
  {
    content: "Unknown Laboratory - Normal",
    quality: range(1, 150),
    chance: "3.72%",
  },
  { content: "Seed Vault - Normal", quality: range(1, 150), chance: "3.61%" },
  {
    content: "The Forgottense - Normal",
    quality: range(1, 150),
    chance: "3.39%",
  },
  { content: "The Chapel - Normal", quality: range(1, 150), chance: "3.33%" },
  {
    content: "Caligo Ossuary - Normal",
    quality: range(1, 150),
    chance: "3.06%",
  },
  { content: "Asylum - Normal", quality: range(1, 150), chance: "2.92%" },
  { content: "The Haven - Normal", quality: range(1, 150), chance: "2.67%" },
  {
    content: "Quarantine Zone - Normal",
    quality: range(1, 150),
    chance: "2.64%",
  },
  { content: "The Shelter - Normal", quality: range(1, 150), chance: "2.17%" },
  { content: "Sepulcher - Normal", quality: range(1, 150), chance: "2.11%" },
  {
    content: "The Magister Lab - Normal",
    quality: range(1, 150),
    chance: "2.03%",
  },
  {
    content: "Assumed Bridge Zone - Normal",
    quality: range(1, 150),
    chance: "6.92%",
  },
  {
    content: "Old Mystery - Hard 100%",
    quality: range(51, 200),
    chance: "5.17%",
  },
  {
    content: "Mystery's End - Hard 100%",
    quality: range(51, 200),
    chance: "4.89%",
  },
  {
    content: "Heart of the Fortress - Hard 100%",
    quality: range(51, 200),
    chance: "4.39%",
  },
  {
    content: "Slumber Valley - Hard 100%",
    quality: range(51, 200),
    chance: "4.31%",
  },
  { content: "Bio-Lab - Hard 100%", quality: range(51, 200), chance: "3.75%" },
  {
    content: "Unknown Laboratory - Hard 100%",
    quality: range(51, 200),
    chance: "3.72%",
  },
  {
    content: "Seed Vault - Hard 100%",
    quality: range(51, 200),
    chance: "3.61%",
  },
  {
    content: "The Forgottense - Hard 100%",
    quality: range(51, 200),
    chance: "3.39%",
  },
  {
    content: "The Chapel - Hard 100%",
    quality: range(51, 200),
    chance: "3.33%",
  },
  {
    content: "Caligo Ossuary - Hard 100%",
    quality: range(51, 200),
    chance: "3.06%",
  },
  { content: "Asylum - Hard 100%", quality: range(51, 200), chance: "2.92%" },
  {
    content: "The Haven - Hard 100%",
    quality: range(51, 200),
    chance: "2.67%",
  },
  {
    content: "Quarantine Zone - Hard 100%",
    quality: range(51, 200),
    chance: "2.64%",
  },
  {
    content: "The Shelter - Hard 100%",
    quality: range(51, 200),
    chance: "2.17%",
  },
  {
    content: "Sepulcher - Hard 100%",
    quality: range(51, 200),
    chance: "2.11%",
  },
  {
    content: "The Magister Lab - Hard 100%",
    quality: range(51, 200),
    chance: "2.03%",
  },
  {
    content: "Sigma Sector: Broken Boundary (Normal)",
    quality: range(51, 200),
    chance: "3.47%",
  },
  {
    content: "Sigma Sector: Isolated Desert (Normal)",
    quality: range(51, 200),
    chance: "2.69%",
  },
  {
    content: "Mystery's End - Hard 400%",
    quality: range(101, 250),
    chance: "4.89%",
  },
  {
    content: "Heart of the Fortress - Hard 400%",
    quality: range(101, 250),
    chance: "4.39%",
  },
  {
    content: "Slumber Valley - Hard 400%",
    quality: range(101, 250),
    chance: "4.31%",
  },
  {
    content: "Unknown Laboratory - Hard 400%",
    quality: range(101, 250),
    chance: "3.72%",
  },
  {
    content: "Seed Vault - Hard 400%",
    quality: range(101, 250),
    chance: "3.61%",
  },
  {
    content: "The Forgottense - Hard 400%",
    quality: range(101, 250),
    chance: "3.39%",
  },
  {
    content: "The Chapel - Hard 400%",
    quality: range(101, 250),
    chance: "3.33%",
  },
  {
    content: "Caligo Ossuary - Hard 400%",
    quality: range(101, 250),
    chance: "3.06%",
  },
  { content: "Asylum - Hard 400%", quality: range(101, 250), chance: "2.92%" },
  {
    content: "The Haven - Hard 400%",
    quality: range(101, 250),
    chance: "2.67%",
  },
  {
    content: "Quarantine Zone - Hard 400%",
    quality: range(101, 250),
    chance: "2.64%",
  },
  {
    content: "The Shelter - Hard 400%",
    quality: range(101, 250),
    chance: "2.17%",
  },
  {
    content: "The Magister Lab - Hard 400%",
    quality: range(101, 250),
    chance: "2.03%",
  },
  {
    content: "Assumed Bridge Zone - Hard",
    quality: range(101, 250),
    chance: "6.92%",
  },
  {
    content: "Sigma Sector: Broken Boundary (High-risk)",
    quality: range(176, 325),
    chance: "3.47%",
  },
  {
    content: "Sigma Sector: Isolated Desert (High-risk)",
    quality: range(176, 325),
    chance: "2.69%",
  },
  {
    content: "Medium-Sized Facility Zone - Normal",
    quality: range(176, 325),
    chance: "4.92%",
  },
  {
    content: "Sealed Residential District",
    quality: range(201, 350),
    chance: "6.69%",
  },
  {
    content: "Emergency Deployment Zone",
    quality: range(201, 350),
    chance: "5.22%",
  },
  { content: "Liquefied AX Vault", quality: range(201, 350), chance: "3.86%" },
  { content: "First Crater", quality: range(201, 350), chance: "3.78%" },
  {
    content: "Technical Research Institute",
    quality: range(201, 350),
    chance: "3.69%",
  },
  { content: "AX Refinery", quality: range(201, 350), chance: "2.97%" },
  {
    content: "AX Power Converter Station",
    quality: range(201, 350),
    chance: "1.97%",
  },
  { content: "Axium Drop Zone", quality: range(201, 350), chance: "0.47%" },
  { content: "Axium Mining Area", quality: range(201, 350), chance: "2.5%" },
  { content: "Forbidden Sanctuary", quality: range(251, 400), chance: "5.64%" },
  {
    content: "Bastion of Immortality",
    quality: range(251, 400),
    chance: "5.06%",
  },
  { content: "Legion Laboratory", quality: range(251, 400), chance: "4.78%" },
  {
    content: "Exposed Underwater Base",
    quality: range(251, 400),
    chance: "4.69%",
  },
  {
    content: "Supermassive Receptor",
    quality: range(251, 400),
    chance: "4.64%",
  },
  {
    content: "Medium-Sized Facility Zone - Hard",
    quality: range(251, 400),
    chance: "4.92%",
  },
  // Update 1.4.3: the range is written "251 → 400" under a range heading.
  { content: "Breach Tracking", quality: range(251, 400), chance: "5.00%" },
  // Update 1.4.3: a new dungeon.
  { content: "Cradle of Evolution", quality: range(271, 400), chance: "4.36%" },
  // Revised 23 August: the struck-out lows (276, 301, 351, 376) gave way to these.
  { content: "Onslaught - Stage 1", quality: range(261, 400), chance: "7.11%" },
  { content: "Onslaught - Stage 2", quality: range(271, 400), chance: "7.11%" },
  { content: "Onslaught - Stage 3", quality: range(281, 400), chance: "7.11%" },
  { content: "Onslaught - Stage 4", quality: range(291, 400), chance: "7.11%" },
  // Update 1.4.5: a new stage.
  { content: "Onslaught - Stage 5", quality: range(301, 400), chance: "10.7%" },
];

/** A Transcendent weapon guaranteed on the first clear, at this Quality. */
export const transcendentFirstClears: readonly {
  readonly content: string;
  readonly quality: number;
}[] = [
  { content: "Unknown Laboratory - Normal", quality: 25 },
  { content: "The Chapel - Normal", quality: 50 },
  { content: "Bio-Lab - Normal", quality: 75 },
  { content: "Heart of the Fortress - Normal", quality: 100 },
];

/**
 * Karel's Mothership: Transcendent Weapon Loot by difficulty. Update 1.4.5 raised the
 * chances at its "Ship Boarding Point" from 14.5% (both difficulties).
 */
export const karelsMothershipLoot: readonly {
  readonly difficulty: string;
  readonly quality: QualityRange;
  /** On mission completion, as written. */
  readonly chance: string;
}[] = [
  { difficulty: "Normal", quality: range(251, 400), chance: "15.2%" },
  { difficulty: "Hard", quality: range(271, 400), chance: "16.9%" },
];

/** Trials: Transcendent Weapon Loot each round, with its Quality by round. */
export const trialsLoot: {
  /** "Acquisition chance", as written. */
  readonly chance: string;
  readonly rounds: readonly QualityRange[];
  /** With a Rotational Build. */
  readonly rotational: readonly QualityRange[];
} = {
  chance: "10%",
  rounds: [range(271, 400), range(271, 400), range(281, 400), range(281, 400)],
  rotational: [
    range(51, 350),
    range(51, 350),
    range(101, 350),
    range(101, 350),
  ],
};

/** Deslin in Albion sells these for Transcendent Trait Element. */
export const transcendentShop: readonly {
  readonly item: string;
  readonly price: number;
  readonly limit: string;
}[] = [
  { item: "[All] Transcendent Weapon Box", price: 400, limit: "Unlimited" },
  {
    item: "[Range 4] Transcendent Weapon Box",
    price: 800,
    limit: "10 times per week",
  },
];

/**
 * Transcendent Trait Element, the boxes' price, comes from dismantling Transcendent
 * weapons (more for a higher level and Quality range) and from Merit Exchange
 * (Excavation Chief Reina in Albion), which sells this much for Merit Token.
 */
export const traitElementSources = {
  meritExchange: { amount: 200, price: 100, limit: "10 times per week" },
} as const;

/**
 * Update 1.4.5's Rotational Boost: each day two of these contents get a +15% Transcendent
 * Weapon Acquisition Chance Boost, as its own multiplier. The list is as written.
 */
export const rotationalBoost = {
  boost: "+15%",
  perDay: 2,
  contents: [
    "Onslaught",
    "Sigma Sector",
    "Cradle of Evolution",
    "Axion Plains Battlefield Missions",
    "Trials",
    "Infiltration Operation (400%)",
    "Void Vessel",
    "Karel's Mothership",
    "Axion Plains Infiltration Operation",
  ],
} as const;

/**
 * Update 1.4.3's trading: Transcendent weapons sell by Private Trading or Lounge Storage
 * Trade, with a minimum price per weapon by its Quality category, in Caliber. A traded
 * weapon becomes bound and gives no Base Quality EXP.
 */
export const transcendentTradeMinimums: readonly {
  /** As written: "Quality 1" to "Quality 4". */
  readonly category: string;
  readonly caliber: number;
}[] = [
  { category: "Quality 1", caliber: 100 },
  { category: "Quality 2", caliber: 200 },
  { category: "Quality 3", caliber: 400 },
  { category: "Quality 4", caliber: 600 },
];
