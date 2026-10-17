/**
 * Fellow facts NEXON's metadata leaves out (T7SEN, 2026-10-17; ADR 0035).
 * `fellow.json` gives each Fellow's tier and its Module Drop Rate Increase Modifier at
 * levels 1 to 40; its passive's numbers, the Auto-Dismantle Cycle and the Inversion
 * Reinforcement effects come from the Update 1.4.0 notes, which raised the level cap
 * to 40. No later note to 1.4.5 changes them.
 */

/** The Update 1.4.0 notes. */
export const fellowNotesUrl = "https://tfd.nexon.com/en/news/3528592";

/** A Fellow's passive: what it does for its Descendant on a cycle. */
export type FellowPassive = "hp" | "rounds" | "mp";

/** Each passive's name and its two numbers' names, as the notes write them. */
export const fellowPassives: Readonly<
  Record<FellowPassive, { name: string; interval: string; ratio: string }>
> = {
  hp: {
    name: "Auto HP Recovery",
    interval: "Auto HP Recovery Interval",
    ratio: "HP Recovery Ratio",
  },
  rounds: {
    name: "Auto Refill Rounds",
    interval: "Auto Refill Rounds Cycle",
    ratio: "Round Recovery Ratio",
  },
  mp: {
    name: "Auto MP Recovery",
    interval: "Auto MP Recovery Interval",
    ratio: "MP Recovery Ratio",
  },
};

/**
 * Which passive each Fellow has. Neither NEXON's data nor the notes pair them: this is
 * tfdhub.gg's pairing, which T7SEN confirmed in game on 2026-10-17.
 */
export const fellowPassiveOf: Readonly<Partial<Record<string, FellowPassive>>> =
  {
    "Hagios Sheepdog": "hp",
    "Vespers Hunting Dog": "rounds",
    "Snowy Sled Dog": "mp",
  };

/**
 * Each Fellow's art, 296 by 176 like NEXON's reactor and component art. NEXON's data
 * and hosts have none, so these are files T7SEN supplied on 2026-10-17, kept in
 * `public/art/fellows/`: the one exception to never copying NEXON art into the
 * repository, at T7SEN's decision (ADR 0035).
 */
export const fellowArt: Readonly<Partial<Record<string, string>>> = {
  "Hagios Sheepdog": "/art/fellows/hagios-sheepdog.webp",
  "Vespers Hunting Dog": "/art/fellows/vespers-hunting-dog.webp",
  "Snowy Sled Dog": "/art/fellows/snowy-sled-dog.webp",
};

/** Whether T7SEN has checked `fellowPassiveOf` in game; the details say so until then. */
export const fellowPassiveStatus: "provisional" | "verified" = "verified";

/** A passive's numbers at a level: every `interval` seconds, `ratio` of it back. */
export interface FellowPassiveLevel {
  readonly interval: number;
  /** As the notes give it: 0.16 is 16%. */
  readonly ratio: number;
}

/** One level of the notes' table. */
export interface FellowLevelFacts {
  readonly level: number;
  /** Seconds. */
  readonly autoDismantleCycle: number;
  readonly passives: Readonly<Record<FellowPassive, FellowPassiveLevel>>;
}

// The notes' table, row for row: Level, Auto-Dismantle Cycle (s), Auto HP Recovery
// Interval (s), HP Recovery Ratio, Auto Refill Rounds Cycle (s), Round Recovery Ratio,
// Auto MP Recovery Interval (s), MP Recovery Ratio.
const table: readonly (readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
])[] = [
  [1, 60, 30, 0.16, 70, 0.2, 45, 0.08],
  [2, 60, 29.5, 0.16, 68, 0.2, 44, 0.08],
  [3, 60, 29, 0.16, 67, 0.2, 43, 0.08],
  [4, 60, 29, 0.17, 66, 0.2, 42, 0.08],
  [5, 60, 28.5, 0.17, 65, 0.2, 41, 0.08],
  [6, 60, 28, 0.17, 64, 0.2, 41, 0.09],
  [7, 60, 28, 0.18, 63, 0.2, 40, 0.09],
  [8, 60, 27.5, 0.18, 62, 0.2, 39, 0.09],
  [9, 60, 27, 0.18, 61, 0.2, 38, 0.09],
  [10, 60, 27, 0.19, 60, 0.2, 37, 0.09],
  [11, 60, 26.5, 0.19, 59, 0.2, 37, 0.1],
  [12, 60, 26, 0.19, 58, 0.2, 36, 0.1],
  [13, 60, 26, 0.2, 57, 0.2, 35, 0.1],
  [14, 60, 25.5, 0.2, 56, 0.2, 34, 0.1],
  [15, 60, 25, 0.2, 55, 0.2, 34, 0.11],
  [16, 60, 25, 0.21, 54, 0.2, 33, 0.11],
  [17, 60, 24.5, 0.21, 53, 0.2, 32, 0.11],
  [18, 60, 24, 0.21, 52, 0.2, 31, 0.11],
  [19, 60, 24, 0.22, 51, 0.2, 31, 0.12],
  [20, 60, 23.5, 0.22, 50, 0.2, 30, 0.12],
  [21, 60, 23, 0.22, 49, 0.2, 29, 0.12],
  [22, 60, 23, 0.23, 48, 0.2, 29, 0.13],
  [23, 60, 22.5, 0.23, 47, 0.2, 28, 0.13],
  [24, 60, 22, 0.23, 46, 0.2, 27, 0.13],
  [25, 60, 22, 0.24, 45, 0.2, 27, 0.14],
  [26, 60, 21.5, 0.24, 44, 0.2, 26, 0.14],
  [27, 60, 21, 0.24, 43, 0.2, 26, 0.15],
  [28, 60, 21, 0.25, 42, 0.2, 25, 0.15],
  [29, 60, 20.5, 0.25, 41, 0.2, 25, 0.16],
  [30, 60, 20, 0.25, 40, 0.2, 24, 0.16],
  [31, 60, 20, 0.27, 38, 0.2, 24, 0.18],
  [32, 60, 19.5, 0.276, 36.2, 0.2, 23, 0.19],
  [33, 60, 19, 0.282, 34.3, 0.2, 22, 0.2],
  [34, 60, 19, 0.302, 32.5, 0.2, 21, 0.2],
  [35, 60, 18.5, 0.307, 30.7, 0.2, 20, 0.21],
  [36, 60, 18, 0.312, 28.9, 0.2, 19, 0.22],
  [37, 60, 18, 0.331, 27.2, 0.2, 18, 0.22],
  [38, 60, 17.5, 0.335, 25.6, 0.2, 17, 0.22],
  [39, 60, 17, 0.339, 24, 0.2, 16, 0.23],
  [40, 60, 17, 0.358, 22.5, 0.2, 15, 0.23],
];

/** Every Fellow's numbers at levels 1 to 40, in level order. */
export const fellowLevelFacts: readonly FellowLevelFacts[] = table.map(
  ([
    level,
    dismantle,
    hpInterval,
    hpRatio,
    roundsCycle,
    roundsRatio,
    mpInterval,
    mpRatio,
  ]) => ({
    level,
    autoDismantleCycle: dismantle,
    passives: {
      hp: { interval: hpInterval, ratio: hpRatio },
      rounds: { interval: roundsCycle, ratio: roundsRatio },
      mp: { interval: mpInterval, ratio: mpRatio },
    },
  }),
);

/** An Inversion Reinforcement effect that needs a Fellow, as the notes word it. */
export interface FellowEffect {
  readonly name: string;
  /** When it is granted. */
  readonly condition: string;
  readonly effect: string;
}

/**
 * Season 4's Assistance effects that need one Fellow equipped (Update 1.4.0 notes,
 * Inversion Reinforcement), by Fellow. `[+]` is kept as the notes write it.
 */
export const fellowEffects: Readonly<Partial<Record<string, FellowEffect>>> = {
  "Hagios Sheepdog": {
    name: "Hagios Sheepdog Enhancement",
    condition:
      "While Fellow Hagios Sheepdog is equipped, when hit, grants Hagios Sheepdog Enhancement",
    effect: "Incoming DMG Modifier -48%[+] for 3s (Cooldown 20s)",
  },
  "Vespers Hunting Dog": {
    name: "Vespers Hunting Dog Enhancement",
    condition:
      "While Fellow Vespers Hunting Dog is equipped, on Firearm hit, grants Vespers Hunting Dog Enhancement",
    effect: "Rounds are not consumed for 3s (Cooldown 20s)",
  },
  "Snowy Sled Dog": {
    name: "Snowy Sled Dog Enhancement",
    condition:
      "When Fellow Snowy Sled Dog is equipped, on Skill hit, grants Snowy Sled Dog Enhancement",
    effect: "Skill Cost -23%[+] for 3s (Cooldown 20s)",
  },
};

/** The Assistance effect any equipped Fellow unlocks (Update 1.4.0 notes). */
export const anyFellowEffect: FellowEffect = {
  name: "Emergency Purification Kit",
  condition:
    "While a Fellow is equipped, on receiving a debuff, grants Emergency Purification Kit",
  effect:
    "Removes debuffs for 3s and grants Debuff Immunity for the duration (Cooldown 300s)",
};
