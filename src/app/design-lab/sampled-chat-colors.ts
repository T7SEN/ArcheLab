/**
 * Provisional chat colors for the temporary design lab only.
 *
 * Source: sampled from T7SEN's in-game screenshot of `<tier1>` to `<tier4>` on the
 * chat background, 15 October 2026 (docs/SPEC.md section 4.1). Rarity names follow the
 * community mapping in the same section. Phase 1 records verified values in
 * src/data/chat-tags.json; this file is deleted with /design-lab.
 */
export const sampledOn = "15 October 2026";

export const chatBackground = "#212321";

export const tierColors = [
  { tag: "tier1", rarity: "Normal", hex: "#53b7f7" },
  { tag: "tier2", rarity: "Rare", hex: "#d487f5" },
  { tag: "tier3", rarity: "Ultimate", hex: "#f7db78" },
  { tag: "tier4", rarity: "Transcendent", hex: "#ff886d" },
] as const;
