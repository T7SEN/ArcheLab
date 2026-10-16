/**
 * Arche types a Descendant has in game that NEXON's data leaves out, from T7SEN's
 * in-game checks (ADR 0023). They count like any other Arche type: a Descendant's page
 * and the index list them after the types its skills give, with no note, and reactors
 * count them when all the Descendant's skills share the reactor's attribute
 * (`reactorMatch`, ADR 0026). NEXON states a Transcendent module's new Arche type for
 * one module only (Ines's Time of the Hunting Hounds, Tech, already one of hers).
 */
export const extraArcheTypes: ReadonlyMap<string, readonly string[]> = new Map([
  // T7SEN, 2026-10-16: Raven is Singular too (Nightfall gives it in game); NEXON lists
  // all five of her skills as Fusion. T7SEN asked for no note about it anywhere.
  ["Raven", ["Singular"]],
]);
