/**
 * The sub-stats an external component can have, by slot, the same for every tier and set
 * (ADR 0027). NEXON's keyless data doesn't list them. These are tfdhub.gg's lists, read
 * 2026-10-16 and recorded at T7SEN's request; T7SEN checked all four in game on
 * 2026-10-17, for Ultimate, Rare and Normal pieces alike, and found them correct. The
 * ids are NEXON's, from `stat.json`, which names them; every one matched its name there
 * on 2026-10-16.
 */
export const componentSubStatIds: Readonly<Record<string, readonly string[]>> =
  {
    "Auxiliary Power": [
      "105000001", // Max HP
      "105000062", // Fire Resistance
      "105000101", // MP Recovery Out of Combat
      "105000187", // DBNO Duration
      "105000180", // Kuiper Shard Drop Rate Increase Modifier
      "105000176", // Module Drop Rate Increase Modifier
    ],
    Sensor: [
      "105000024", // Max MP
      "105000063", // Chill Resistance
      "105000104", // MP Recovery In Combat
      "105000136", // HP Recovery Modifier
      "105000178", // Consumable Drop Rate Increase Modifier
      "105000181", // Character EXP Gain Modifier
    ],
    Memory: [
      "105000029", // DEF
      "105000064", // Electric Resistance
      "105000138", // MP Recovery Modifier
      "105000105", // Shield Recovery In Combat
      "105000179", // Gold Drop Rate Increase Modifier
      "105000182", // Firearm Proficiency Gain Modifier
    ],
    // Eight, not six: the two Ecive stats are on Processors only.
    Processor: [
      "105000025", // Max Shield
      "105000065", // Toxin Resistance
      "105000172", // Shield Recovery Modifier
      "105000102", // Shield Recovery Out of Combat
      "105000177", // Equipment Drop Rate Increase Modifier
      "105000188", // Item Acquisition Distance Increase Modifier
      "105000190", // Ecive Search Radius Increase Modifier
      "105000191", // Ecive Display Time
    ],
  };

/**
 * "verified" since T7SEN's in-game check on 2026-10-17. While "provisional", the
 * details mark the sub-stats as not verified (AGENTS.md rule 4).
 */
export const componentSubStatStatus: "provisional" | "verified" = "verified";
