/**
 * Arche types a Descendant has in game that NEXON's data leaves out, from T7SEN's
 * in-game checks (ADR 0023). A Descendant's page and the index list them after the
 * types its skills give. NEXON states a Transcendent module's new Arche type for one
 * module only (Ines's Time of the Hunting Hounds, Tech, already one of hers).
 */
export const extraArcheTypes: ReadonlyMap<string, readonly string[]> = new Map([
  // T7SEN, 2026-10-16: Raven is Singular too, through a Transcendent module; NEXON
  // lists all five of her skills as Fusion.
  ["Raven", ["Singular"]],
]);
