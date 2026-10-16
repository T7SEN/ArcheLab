/**
 * NEXON's reactor art is 296 by 176 pixels, wider than tall (checked 2026-10-16 on 10
 * of the 60 images, every tier). Images show at that shape, with `object-contain`, so
 * other art still fits; these numbers only reserve the space before it loads.
 */
export const reactorArt = { width: 296, height: 176 } as const;
