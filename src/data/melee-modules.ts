/**
 * Which modules are for melee weapons (ADR 0025). NEXON's module data gives a melee
 * module only the rounds class of the melee weapons it fits (Impact or High-Power
 * Rounds), so without this list it would sit among the firearm modules. NEXON's Library
 * lists melee modules on their own: on 2026-10-16 its Melee Weapon filter
 * (https://tfd.nexon.com/en/library/modules?rune=WeaponMelee) showed exactly the 125
 * modules whose ids start with these digits, and no other. A melee module NEXON adds
 * under another id would show as a firearm module until this list has it.
 */
const meleeIdPrefixes: readonly string[] = ["25209", "25210"];

/** Whether a module, by its NEXON id, is for melee weapons. */
export function isMeleeModule(moduleId: string): boolean {
  return meleeIdPrefixes.some((prefix) => moduleId.startsWith(prefix));
}
