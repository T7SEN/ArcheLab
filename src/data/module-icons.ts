/**
 * Icons for module sockets, Descendant module slots and Descendant modules, from
 * NEXON's Library, linked from its asset CDN and never copied into the repo (ADR 0012,
 * ADR 0025). Matched on 2026-10-16 on the Library's modules page
 * (https://tfd.nexon.com/en/library/modules):
 * - Each module card shows its socket as a colored icon. Matching 22 cards by name
 *   against NEXON's data, every color fit one socket: red Almandine, blue Cerulean,
 *   green Malachite, yellow Xantic and purple Rutile.
 * - The Descendant filter shows `icon_Character` for all Descendant modules,
 *   `icon_character--main` for Standard (NEXON's `Main` slot),
 *   `icon_character--skillrune_charactersub` for Skill/Sub (`Skill` and `Sub`) and
 *   `icon_character--trigger` for Trigger.
 */
const libraryIcons = "https://tfdvod.dn.nexoncdn.co.kr/img/cbt/library/icons/";

const socketIconFiles: ReadonlyMap<string, string> = new Map([
  ["Almandine", "icon_rune_w_Red.png"],
  ["Cerulean", "icon_rune_w_Blue.png"],
  ["Malachite", "icon_rune_w_Green.png"],
  ["Xantic", "icon_rune_w_Yellow.png"],
  ["Rutile", "icon_rune_w_Purple.png"],
]);

const slotIconFiles: ReadonlyMap<string, string> = new Map([
  ["Main", "icon_character--main.png"],
  ["Skill", "icon_character--skillrune_charactersub.png"],
  ["Sub", "icon_character--skillrune_charactersub.png"],
  ["Trigger", "icon_character--trigger.png"],
]);

/** The Library icon for a socket, or null for one it has no icon for. */
export function socketIconUrl(socket: string | null): string | null {
  const file = socket === null ? undefined : socketIconFiles.get(socket);
  return file === undefined ? null : `${libraryIcons}${file}`;
}

/** The Library icon for a Descendant module slot, or null for one it has no icon for. */
export function slotIconUrl(slot: string): string | null {
  const file = slotIconFiles.get(slot);
  return file === undefined ? null : `${libraryIcons}${file}`;
}

/** The Library's icon for Descendant modules. */
export const descendantModuleIconUrl = `${libraryIcons}icon_Character.png`;
