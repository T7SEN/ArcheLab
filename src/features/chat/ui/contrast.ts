/** WCAG 2 AA minimum contrast for normal-size text. */
export const minimumTextContrast = 4.5;

const hexColor = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

function linearChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #RRGGBB color. */
export function relativeLuminance(hex: string): number {
  const match = hexColor.exec(hex);
  if (match === null) {
    throw new Error(`Not a #RRGGBB color: ${hex}`);
  }
  const [red, green, blue] = [match[1], match[2], match[3]].map((part) =>
    linearChannel(Number.parseInt(part, 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio between two colors, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
