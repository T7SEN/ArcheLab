/**
 * What the Cosmetics index needs beyond NEXON's `customizing-item.json` (ADR 0039):
 * each type's name, the order the index lists them in, and which ones every Descendant
 * can use.
 */

/**
 * NEXON's cosmetic type ids with the game's names for them, in the index's order. The
 * Update 1.4.0 notes' shop tables name Head Skin, Body Skin, Makeup, Back Attachment,
 * Chest Attachment, Paint and Spawns (https://tfd.nexon.com/en/news/3528592, read on
 * 2026-10-17); Hair Paint is NEXON's own id, `HairPaint`, split in two.
 */
export const cosmeticTypes = [
  { id: "CharacterHeadSkin", name: "Head Skin" },
  { id: "CharacterBodySkin", name: "Body Skin" },
  { id: "CharacterMakeupSkin", name: "Makeup" },
  { id: "CharacterBackAttachment", name: "Back Attachment" },
  { id: "CharacterChestAttachment", name: "Chest Attachment" },
  { id: "Paint", name: "Paint" },
  { id: "HairPaint", name: "Hair Paint" },
  { id: "CharacterSpawnSkin", name: "Spawn" },
] as const;

/**
 * A type's name: the game's, or for a type NEXON adds later, its id without
 * "Character", split into words ("CharacterWeaponSkin" is "Weapon Skin").
 */
export function cosmeticTypeName(id: string): string {
  const known = cosmeticTypes.find((type) => type.id === id);
  if (known !== undefined) {
    return known.name;
  }
  return id
    .replace(/^Character/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

/**
 * The types every Descendant can use. NEXON lists no Descendants for them, and T7SEN
 * confirmed in game that every Descendant can (T7SEN, 2026-10-17).
 */
export const everyDescendantTypes: readonly string[] = [
  "CharacterBackAttachment",
  "CharacterChestAttachment",
  "Paint",
  "HairPaint",
  "CharacterSpawnSkin",
];
