/**
 * Each rounds type's icon from NEXON's Library, linked from its asset CDN and never
 * copied into the repo (ADR 0012, ADR 0024). Matched on 2026-10-16 on the Library's
 * weapons page (https://tfd.nexon.com/en/library/weapons), which shows each weapon with
 * its rounds icon: ATR-0 Prototype and Emperor's Guard Lance (Enhanced Ammo) carry
 * `EnhancedRounds`, Malicious Dominator (Impact Rounds) `ImpactRounds`, Raging Light
 * (High-Power Rounds) `HighpowerRounds`, Monster Hunter (General Rounds) `GeneralRounds`.
 * Modules name Enhanced Ammo "Special Rounds": the Library's modules page
 * (https://tfd.nexon.com/en/library/modules) shows `EnhancedRounds` beside "Special
 * Rounds" in its Firearm filter (checked 2026-10-16).
 */
const libraryIcons = "https://tfdvod.dn.nexoncdn.co.kr/img/cbt/library/icons/";

const roundsIconFiles: ReadonlyMap<string, string> = new Map([
  ["General Rounds", "icon_bullet--GeneralRounds.png"],
  ["Enhanced Ammo", "icon_bullet--EnhancedRounds.png"],
  ["Special Rounds", "icon_bullet--EnhancedRounds.png"],
  ["Impact Rounds", "icon_bullet--ImpactRounds.png"],
  ["High-Power Rounds", "icon_bullet--HighpowerRounds.png"],
]);

/** The Library icon for a rounds type, or null for one it has no icon for. */
export function roundsIconUrl(rounds: string | null): string | null {
  const file = rounds === null ? undefined : roundsIconFiles.get(rounds);
  return file === undefined ? null : `${libraryIcons}${file}`;
}
