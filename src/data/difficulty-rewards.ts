/**
 * What the Difficulty Level Rewards page needs beyond NEXON's sets (T7SEN, 2026-10-18;
 * ADR 0048): when each week of rewards starts, and how outposts and Void Fusion Reactors
 * name their battlefield.
 */

/**
 * The reward list's rotation 116 started on Tuesday 13 October 2026 at 07:00 UTC, and
 * each lasts exactly 7 days. Read on 2026-10-18 from the game's online Library
 * (https://tfd.nexon.com/en/library/rewards: 116 current, 117 from 2026-10-20 07:00
 * UTC, 118 and 119 seven days apart, every reward matching the list), and the reset
 * notice of 2024-11-01 (every Tuesday at 00:00 PDT, Monday 23:00 PST: 07:00 UTC all
 * year). Not yet checked in game, so the page marks it provisional.
 */
export const rotationAnchor = {
  rotation: 116,
  startsAt: "2026-10-13T07:00:00Z",
} as const;

/** "verified" once T7SEN has checked a week's reward and the change time in game. */
export const rotationAnchorStatus: "provisional" | "verified" = "provisional";

/**
 * The names outposts ("Lumber Yard: Vulgus Strategic Outpost") give a battlefield that
 * the reward list writes otherwise; every other name matches as written. The same on
 * Normal and Hard (checked 2026-10-18).
 */
export const outpostAliases: Readonly<Record<string, string>> = {
  "Fallen Theater": "The Fallen Theater",
  "Lumber Yard": "The Lumber Yard",
  "The Repository": "Repository",
  Storage: "The Storage",
};

/**
 * The names Void Fusion Reactors give a battlefield after "Void Fusion Reactor - <region>
 * " ("Void Fusion Reactor - Vespers Ruins") that the reward list writes otherwise.
 */
export const fusionReactorAliases: Readonly<Record<string, string>> = {
  Ruins: "The Ruins",
  Storage: "The Storage",
  "Miragestone Deposit": "Miragestone",
  Mountaintops: "The Mountaintops",
  "Corrupted Zone": "The Corrupted Zone",
};
