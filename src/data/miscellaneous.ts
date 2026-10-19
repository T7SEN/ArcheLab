/**
 * The Miscellaneous page's list (T7SEN, 2026-10-18; ADR 0050): the items under the
 * "Miscellaneous" filter of NEXON's Library's Consumable list
 * (https://tfd.nexon.com/en/library/consumable?consumables=other, read in the browser on
 * 2026-10-18), by NEXON id and tier, in the Library's order: Ultimate, Rare, then
 * Normal, each A–Z. NEXON's `consumable-material.json` files them under seven types
 * (loot boxes, shop coins, other materials) that also hold about 150 items the Library
 * leaves out, so the list is kept here. The Library lists Transcendent Weapon Loot 32 times, each box
 * with its own art and drop places; the page shows it once. Notes:
 * research_notes/TFD miscellaneous/.
 */

export interface MiscellaneousFacts {
  /** As the Library and NEXON's data write it. */
  readonly name: string;
  /** The Library's tier: `Tier3` Ultimate, `Tier2` Rare, `Tier1` Normal. */
  readonly tier: "Tier1" | "Tier2" | "Tier3";
  /** NEXON's material ids: one, or every box of the same name. */
  readonly ids: readonly string[];
  /** What it gives, as the update notes say, and where that is on the site. */
  readonly gives?: { readonly name: string; readonly href: string };
}

/** Every Miscellaneous item, in the Library's order. */
export const miscellaneousItems: readonly MiscellaneousFacts[] = [
  {
    name: "Ancestors Module Loot",
    tier: "Tier3",
    ids: ["263060050"],
  },
  {
    name: "Ancestors Module Loot A",
    tier: "Tier3",
    ids: ["263060068"],
  },
  {
    name: "Ancestors Module Loot B",
    tier: "Tier3",
    ids: ["263060069"],
  },
  {
    name: "Ancestors Module Loot C",
    tier: "Tier3",
    ids: ["263060070"],
  },
  {
    name: "Ancestors Module Loot D",
    tier: "Tier3",
    ids: ["263060071"],
  },
  {
    name: "Ancestors Module Loot E",
    tier: "Tier3",
    ids: ["263060072"],
  },
  {
    name: "Ancestors Module Loot II",
    tier: "Tier3",
    ids: ["263060060"],
  },
  {
    name: "Dimensional Spectral Prism",
    tier: "Tier3",
    ids: ["269020027"],
  },
  {
    name: "Frozen Gas Crystal",
    tier: "Tier3",
    ids: ["263060066"],
  },
  {
    name: "High-Value Relic",
    tier: "Tier3",
    ids: ["263080001"],
  },
  {
    name: "Kuiper Bio Adhesive",
    tier: "Tier3",
    ids: ["263060067"],
  },
  {
    name: "Melee Weapon Module Ultimate Loot",
    tier: "Tier3",
    ids: ["263060042"],
  },
  {
    name: "Photon Imprinter",
    tier: "Tier3",
    ids: ["263083001"],
  },
  {
    name: "Premium ETA Voucher",
    tier: "Tier3",
    ids: ["263040002"],
  },
  {
    name: "Quality Certified ETA Voucher",
    tier: "Tier3",
    ids: ["263040003"],
  },
  {
    name: "S1 Attachment Selection Box",
    tier: "Tier3",
    ids: ["291000129"],
  },
  {
    name: "S1 Emote Selection Box",
    tier: "Tier3",
    ids: ["291000126"],
  },
  {
    name: "S1 Grappling Hook/Ecive Selection Box",
    tier: "Tier3",
    ids: ["291000128"],
  },
  {
    name: "S1 Head Skin Selection Box",
    tier: "Tier3",
    ids: ["291000125"],
  },
  {
    name: "S1 Name Card/UI Theme Selection Box",
    tier: "Tier3",
    ids: ["291000127"],
  },
  {
    name: "Shape Stabilizer Selection Box",
    tier: "Tier3",
    ids: ["291000130"],
  },
  {
    name: "Standard ETA Voucher",
    tier: "Tier3",
    ids: ["263040001"],
  },
  {
    name: "Support Coin",
    tier: "Tier3",
    ids: ["263090001"],
  },
  {
    name: "Trade Permit",
    tier: "Tier3",
    ids: ["263120001"],
  },
  {
    name: "Transcendent Photon Imprinter",
    tier: "Tier3",
    ids: ["263083002"],
  },
  {
    name: "Transcendent Weapon Loot",
    tier: "Tier3",
    // Update 1.4.0 and 1.4.5: a Transcendent weapon, Monster Hunter among them since
    // 1.4.5 (`src/data/transcendent-weapon-sources.ts`).
    gives: { name: "Transcendent weapons", href: "/weapons?tier=Transcendent" },
    ids: [
      "269020016",
      "269020017",
      "269020018",
      "269020019",
      "269020020",
      "269020029",
      "269020030",
      "269020031",
      "269020032",
      "269020033",
      "269020034",
      "269020035",
      "269020036",
      "269020037",
      "269020038",
      "269020039",
      "269020040",
      "269020041",
      "269020042",
      "269020043",
      "269020044",
      "269020045",
      "269020046",
      "269020047",
      "269020048",
      "269020049",
      "269020050",
      "269020051",
      "269020052",
      "269020053",
      "269020054",
      "269020055",
    ],
  },
  {
    name: "Trigger Module Loot",
    tier: "Tier3",
    ids: ["263060028"],
  },
  {
    name: "Trigger Module Loot A",
    tier: "Tier3",
    ids: ["263060033"],
  },
  {
    name: "Trigger Module Loot B",
    tier: "Tier3",
    ids: ["263060034"],
  },
  {
    name: "Trigger Module Loot C",
    tier: "Tier3",
    ids: ["263060035"],
  },
  {
    name: "Trigger Module Loot D",
    tier: "Tier3",
    ids: ["263060036"],
  },
  {
    name: "Trigger Module Loot E",
    tier: "Tier3",
    ids: ["263060055"],
  },
  {
    name: "Trigger Module Loot F",
    tier: "Tier3",
    ids: ["263060061"],
  },
  {
    name: "Trigger Module Loot G",
    tier: "Tier3",
    ids: ["263060062"],
  },
  {
    name: "Trigger Module Loot H",
    tier: "Tier3",
    ids: ["263060064"],
  },
  {
    name: "Trigger Module Loot I",
    tier: "Tier3",
    ids: ["263060065"],
  },
  {
    name: "Trigger Module Loot J",
    tier: "Tier3",
    ids: ["263060076"],
  },
  {
    name: "Trigger Module Loot K",
    tier: "Tier3",
    ids: ["263060081"],
  },
  {
    name: "Trigger Module Loot L",
    tier: "Tier3",
    ids: ["269020026"],
  },
  {
    name: "Trigger Module Selection Box J",
    tier: "Tier3",
    ids: ["291000141"],
  },
  {
    name: "Xeno Fluid",
    tier: "Tier3",
    ids: ["269020028"],
  },
  {
    name: "Core Amplifier",
    tier: "Tier2",
    ids: ["262020101"],
  },
  {
    name: "Decryption Key",
    tier: "Tier2",
    ids: ["263503001"],
  },
  {
    name: "Decryption Key II",
    tier: "Tier2",
    ids: ["263503002"],
  },
  {
    name: "Dimensional Stabilization Key",
    tier: "Tier2",
    ids: ["263503006"],
  },
  {
    name: "Melee Weapon Module Loot A",
    tier: "Tier2",
    ids: ["263060039"],
  },
  {
    name: "Mysterious Coin",
    tier: "Tier2",
    ids: ["263080003"],
  },
  {
    name: "Sub Wave Modulator",
    tier: "Tier2",
    ids: ["263130002"],
  },
  {
    name: "Transcendent Wave Modulator",
    tier: "Tier2",
    ids: ["263130001"],
  },
  {
    name: "Ultra-Precision Code Analyzer",
    tier: "Tier2",
    ids: ["263013001"],
  },
  {
    name: "Ultra-Precision Code Breaker",
    tier: "Tier2",
    ids: ["263013002"],
  },
  {
    name: "Vulgus Bio Data Chip",
    tier: "Tier2",
    ids: ["263503010"],
  },
  {
    name: "Code Analyzer",
    tier: "Tier1",
    ids: ["263011001"],
  },
  {
    name: "Code Breaker",
    tier: "Tier1",
    ids: ["263011002"],
  },
  {
    name: "Collectible Coin",
    tier: "Tier1",
    ids: ["263080002"],
  },
  {
    name: "Precision Code Analyzer",
    tier: "Tier1",
    ids: ["263012001"],
  },
  {
    name: "Precision Code Breaker",
    tier: "Tier1",
    ids: ["263012002"],
  },
  {
    name: "Void Organism",
    tier: "Tier1",
    ids: ["262031020"],
  },
];
