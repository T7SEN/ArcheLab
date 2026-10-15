/** The three Phase 0 design directions. Temporary: deleted with /design-lab. */

export type DirectionId = "signal" | "rift" | "forge";

export interface PaletteToken {
  /** CSS custom property set on the direction's section, read by design-lab.css. */
  variable: `--dl-${string}`;
  label: string;
  hex: string;
}

export interface FontNote {
  family: string;
  role: "Display" | "Body";
  specimen: string;
}

export interface Direction {
  id: DirectionId;
  letter: string;
  name: string;
  mood: string;
  palette: readonly PaletteToken[];
  fonts: readonly [FontNote, FontNote];
  frame: string;
  effect: string;
}

export const fontLicense =
  "SIL Open Font License 1.1, downloaded at build time and self-hosted";

export const directions: readonly Direction[] = [
  {
    id: "signal",
    letter: "A",
    name: "Signal",
    mood: "Cold tactical HUD: near-black blue, cyan signal accents, sharp clipped corners.",
    palette: [
      { variable: "--dl-bg", label: "Background", hex: "#070b0f" },
      { variable: "--dl-surface", label: "Surface", hex: "#0d141b" },
      { variable: "--dl-line", label: "Line", hex: "#1c2a36" },
      { variable: "--dl-ink", label: "Text", hex: "#e2ecf2" },
      { variable: "--dl-muted", label: "Muted text", hex: "#8fa5b5" },
      { variable: "--dl-accent", label: "Accent", hex: "#3fd2e3" },
    ],
    fonts: [
      {
        family: "Rajdhani",
        role: "Display",
        specimen: "https://fonts.google.com/specimen/Rajdhani",
      },
      {
        family: "Inter",
        role: "Body",
        specimen: "https://fonts.google.com/specimen/Inter",
      },
    ],
    frame: "Panels with two clipped corners and a hairline edge.",
    effect: "A faint scan band sweeps down the portrait every few seconds.",
  },
  {
    id: "rift",
    letter: "B",
    name: "Rift",
    mood: "Arche energy at rest: deep violet dark, soft glow, bracket-framed panels.",
    palette: [
      { variable: "--dl-bg", label: "Background", hex: "#0a0812" },
      { variable: "--dl-surface", label: "Surface", hex: "#141024" },
      { variable: "--dl-line", label: "Line", hex: "#2b2244" },
      { variable: "--dl-ink", label: "Text", hex: "#ece7f7" },
      { variable: "--dl-muted", label: "Muted text", hex: "#a69dc3" },
      { variable: "--dl-accent", label: "Accent", hex: "#a184ff" },
    ],
    fonts: [
      {
        family: "Chakra Petch",
        role: "Display",
        specimen: "https://fonts.google.com/specimen/Chakra+Petch",
      },
      {
        family: "IBM Plex Sans",
        role: "Body",
        specimen: "https://fonts.google.com/specimen/IBM+Plex+Sans",
      },
    ],
    frame: "Corner brackets around rounded panels.",
    effect: "A violet glow breathes slowly behind the portrait.",
  },
  {
    id: "forge",
    letter: "C",
    name: "Forge",
    mood: "Industrial and warm: graphite, amber energy, notched tabs and double rules.",
    palette: [
      { variable: "--dl-bg", label: "Background", hex: "#0d0c0a" },
      { variable: "--dl-surface", label: "Surface", hex: "#171512" },
      { variable: "--dl-line", label: "Line", hex: "#2e2923" },
      { variable: "--dl-ink", label: "Text", hex: "#f1ebe2" },
      { variable: "--dl-muted", label: "Muted text", hex: "#aca293" },
      { variable: "--dl-accent", label: "Accent", hex: "#f0a23b" },
    ],
    fonts: [
      {
        family: "Oxanium",
        role: "Display",
        specimen: "https://fonts.google.com/specimen/Oxanium",
      },
      {
        family: "Barlow",
        role: "Body",
        specimen: "https://fonts.google.com/specimen/Barlow",
      },
    ],
    frame: "A notched tab heads each panel, over a double rule.",
    effect: "A short amber trace runs around the portrait frame.",
  },
];
