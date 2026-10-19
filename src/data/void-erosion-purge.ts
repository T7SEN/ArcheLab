/**
 * Which map Void Erosion Purge: Normal's Stage 10 takes each day (T7SEN, 2026-10-19;
 * ADR 0053). The game's notes say Stage 10 is "one of five different missions" and
 * "Each mission will change daily at 00:00 PDT" (Hotfix 1.2.22, 2025-07-03): 07:00 UTC,
 * when the 400% Infiltration Operations change too. They don't give the order. This is
 * tfdhub.gg's five-day cycle, read from its Void Erosion Purge page on 2026-10-19:
 * "After the fifth map, the rotation starts again from the first one." tfdhub's pages
 * are a valid source, not provisional (T7SEN, 2026-10-19). The maps are named as
 * NEXON's reward list writes them; a build warns if one isn't there.
 */

/** When the cycle's first map has its day: from 07:00 UTC, for one day. */
export const purgeRotation = {
  startsAt: "2026-10-18T07:00:00Z",
} as const;

/** The five maps, in the cycle's order, from its first day on. */
export const purgeCycle: readonly string[] = [
  "Eroded Ancestors Ruins",
  "Amorphous Contamination Zone",
  "Twisted Ancestors' Facility",
  "Eroded Vulgus Reactor",
  "Eroded Vulgus Underground Facilities",
];

/**
 * Each map's picture: tfdhub.gg's capture of the map in game, used with tfdhub's
 * permission (T7SEN, 2026-10-19). WebP files in `public/art/void-erosion-purge/`, by the
 * map's address; NEXON's data and hosts have no map art (ADR 0035, ADR 0053).
 */
export const purgeMapArt: Readonly<Partial<Record<string, string>>> = {
  "Eroded Ancestors Ruins":
    "/art/void-erosion-purge/eroded-ancestors-ruins.webp",
  "Amorphous Contamination Zone":
    "/art/void-erosion-purge/amorphous-contamination-zone.webp",
  "Twisted Ancestors' Facility":
    "/art/void-erosion-purge/twisted-ancestors-facility.webp",
  "Eroded Vulgus Reactor": "/art/void-erosion-purge/eroded-vulgus-reactor.webp",
  "Eroded Vulgus Underground Facilities":
    "/art/void-erosion-purge/eroded-vulgus-underground-facilities.webp",
};

/** Each art file's size in pixels, so the page holds its room before it loads. */
export const purgeMapArtSize: Readonly<
  Partial<Record<string, { readonly width: number; readonly height: number }>>
> = {
  "Eroded Ancestors Ruins": { width: 1400, height: 691 },
  "Amorphous Contamination Zone": { width: 1025, height: 655 },
  "Twisted Ancestors' Facility": { width: 1400, height: 692 },
  "Eroded Vulgus Reactor": { width: 1400, height: 693 },
  "Eroded Vulgus Underground Facilities": { width: 1211, height: 1074 },
};
