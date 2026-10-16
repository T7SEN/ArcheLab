/**
 * Module tiers beyond the four rarities (T7SEN, 2026-10-16): Ancestor and Trigger
 * modules are tiers of their own in game, not Transcendent or Ultimate, though NEXON's
 * data gives Ancestor modules `Tier4` and Trigger modules `Tier3`. NEXON's
 * `module_type` names them, "Ancestors" and "Trigger". They run before the rarities, in
 * this order, in filters and in "Highest tier" order (T7SEN, same day). In game,
 * Ancestors share Transcendent's color and Trigger Ultimate's (T7SEN, same day), so each
 * names the rarity tier whose color it takes.
 */
export const moduleTypeTiers: readonly {
  readonly name: string;
  /** The rarity tier id whose in-game color this tier shares. */
  readonly colorOf: string;
}[] = [
  { name: "Ancestors", colorOf: "Tier4" },
  { name: "Trigger", colorOf: "Tier3" },
];

/** The tier a module's type makes its own, or null for a module ranked by rarity. */
export function moduleTypeTier(
  moduleType: string | null,
): (typeof moduleTypeTiers)[number] | null {
  return moduleTypeTiers.find((tier) => tier.name === moduleType) ?? null;
}
