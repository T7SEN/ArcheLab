/**
 * NEXON's reactor and external component art is 296 by 176 pixels, wider than tall
 * (checked 2026-10-16 on 10 reactors and 15 components, every tier and slot). Images
 * show at that shape, with `object-contain`, so other art still fits; these numbers only
 * reserve the space before it loads (ADR 0026, ADR 0027).
 */
export const wideArt = { width: 296, height: 176 } as const;
