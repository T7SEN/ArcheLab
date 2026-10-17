/**
 * How the game writes core options whose numbers it shows differently from NEXON's
 * `core-type.json`, read from T7SEN's in-game lists of weapon cores (2026-10-17). By
 * default a "Multiply" option is a percentage of NEXON's fraction (0.8 is 80% [x]) and
 * an "Add" option is NEXON's number as is (5,625 [+]).
 *
 * - `percent`: "scaled" shows NEXON's fraction as a percentage (0.74 is 74%), "plain"
 *   adds a % to NEXON's number (24 is 24%), "none" shows the number as is.
 * - `flip`: the game shows the opposite sign (NEXON's Fire Rate -20% to -1% is shown
 *   1% to 20%).
 * - `label`: the game's name, when it differs from NEXON's.
 */
export const coreOptionDisplay: Readonly<
  Partial<
    Record<
      string,
      {
        readonly percent?: "scaled" | "plain" | "none";
        readonly flip?: true;
        readonly label?: string;
      }
    >
  >
> = {
  "Fire Rate": { flip: true },
  "Reload Time Modifier": { percent: "scaled" },
  Recoil: { percent: "scaled" },
  "Grappling Hook Charge Time Increase Ratio": { percent: "scaled" },
  "Multi-Hit Chance": { percent: "plain", label: "Multi-Hit Chance(+)" },
  "Weapon Change Speed": { percent: "none" },
};
