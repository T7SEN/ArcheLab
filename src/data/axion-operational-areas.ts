/**
 * Which two Axion Plains Operational Area missions are active, every two hours (T7SEN,
 * 2026-10-19; ADR 0052). No official source says: not NEXON's data, the Library or the
 * update notes. This is tfdhub.gg's seven-pair cycle, read from its Axion Operational
 * Area page on 2026-10-19 with T7SEN's okay: "The seven mission pairs repeat in the same
 * order", changing every two hours on odd UTC hours (07:00 UTC, the game's daily reset,
 * is one). tfdhub's pages are a valid source, not provisional (T7SEN, 2026-10-19).
 */

/** When the cycle's first pair starts, and how long each pair is active. */
export const axionRotation = {
  startsAt: "2026-10-18T21:00:00Z",
  hours: 2,
} as const;

/**
 * Each rotation's two missions, by name as the game writes them, from the cycle's first
 * on (2026-10-18 21:00 UTC is the first pair).
 */
export const axionCycle: readonly (readonly [string, string])[] = [
  ["AX Refinery", "Liquefied AX Vault"],
  ["AX Power Converter Station", "Technical Research Institute"],
  ["Sealed Residential District", "AX Refinery"],
  ["Emergency Deployment Zone", "Technical Research Institute"],
  ["First Crater", "Sealed Residential District"],
  ["Liquefied AX Vault", "Emergency Deployment Zone"],
  ["AX Power Converter Station", "First Crater"],
];

/** The seven missions, as the page lists them: the order they first come in the cycle. */
export const axionMissions: readonly string[] = [...new Set(axionCycle.flat())];
