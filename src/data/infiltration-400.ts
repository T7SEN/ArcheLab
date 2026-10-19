/**
 * Which two Infiltration Operations are 400% each day (T7SEN, 2026-10-18; ADR 0049). No
 * official source says: not NEXON's data, the Library or the update notes. This is
 * tfdhub.gg's 50-day cycle, read from its 400% page on 2026-10-18: recorded 2026-08-11
 * to 2026-09-29, "verified against history", and repeated from there. A day starts at
 * 07:00 UTC (00:00 PDT). tfdhub's pages are a valid source, not provisional (T7SEN,
 * 2026-10-19), though tfdhub warns that "the in-game rotation has recently changed".
 */

/** The cycle's first day, and its length in days. */
export const rotation400 = {
  startsAt: "2026-08-11T07:00:00Z",
  days: 50,
} as const;

/**
 * Each day's two operations, by name as the game writes them, from the cycle's first
 * day on (2026-08-11 is the first pair).
 */
export const cycle400: readonly (readonly [string, string])[] = [
  ["Slumber Valley", "The Haven"],
  ["Slumber Valley", "The Asylum"],
  ["The Shelter", "Quarantine Zone"],
  ["The Shelter", "The Forgottense"],
  ["The Forgottense", "Caligo Ossuary"],
  ["The Forgottense", "Quarantine Zone"],
  ["The Shelter", "The Chapel"],
  ["Slumber Valley", "The Forgottense"],
  ["Slumber Valley", "The Asylum"],
  ["The Haven", "Mystery's End"],
  ["Slumber Valley", "The Asylum"],
  ["Unknown Laboratory", "Magister Lab"],
  ["Magister Lab", "The Chapel"],
  ["Slumber Valley", "Unknown Laboratory"],
  ["The Haven", "Mystery's End"],
  ["Slumber Valley", "The Haven"],
  ["The Forgottense", "Mystery's End"],
  ["Magister Lab", "Caligo Ossuary"],
  ["The Shelter", "Caligo Ossuary"],
  ["Seed Vault", "Mystery's End"],
  ["The Asylum", "Unknown Laboratory"],
  ["The Chapel", "The Forgottense"],
  ["The Shelter", "Slumber Valley"],
  ["The Chapel", "Seed Vault"],
  ["Seed Vault", "The Forgottense"],
  ["The Shelter", "Seed Vault"],
  ["Slumber Valley", "The Asylum"],
  ["Quarantine Zone", "Unknown Laboratory"],
  ["The Haven", "Quarantine Zone"],
  ["Slumber Valley", "The Chapel"],
  ["Caligo Ossuary", "The Forgottense"],
  ["The Shelter", "The Chapel"],
  ["The Chapel", "The Haven"],
  ["Magister Lab", "Quarantine Zone"],
  ["Magister Lab", "Seed Vault"],
  ["The Haven", "Mystery's End"],
  ["Magister Lab", "Seed Vault"],
  ["Slumber Valley", "Unknown Laboratory"],
  ["Unknown Laboratory", "Quarantine Zone"],
  ["Quarantine Zone", "Mystery's End"],
  ["Caligo Ossuary", "The Haven"],
  ["The Chapel", "Unknown Laboratory"],
  ["Caligo Ossuary", "The Haven"],
  ["Magister Lab", "The Asylum"],
  ["Quarantine Zone", "Mystery's End"],
  ["Unknown Laboratory", "Quarantine Zone"],
  ["The Chapel", "Mystery's End"],
  ["Magister Lab", "The Asylum"],
  ["The Shelter", "The Asylum"],
  ["The Shelter", "Caligo Ossuary"],
];

/** Operations with a 400% difficulty that the cycle never names (tfdhub: disabled). */
export const outside400Cycle: readonly string[] = ["Heart of the Fortress"];
