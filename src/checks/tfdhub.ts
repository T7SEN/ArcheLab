/**
 * Reading tfdhub.gg's rotation pages for the daily check (ADR 0055), with tfdhub's
 * permission (T7SEN, 2026-10-19). Pure: each takes a page's server-rendered HTML and
 * returns what it shows as current, or null when the page's layout has changed.
 */

/** tfdhub's pages, by what they show. */
export const tfdhubPages = {
  infiltration400: "https://tfdhub.gg/en/infiltration-400",
  axion: "https://tfdhub.gg/en/axion-operational-area",
  purge: "https://tfdhub.gg/en/void-erosion-purge",
} as const;

/** The named and numeric HTML entities tfdhub's pages use, as text. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Void Erosion Purge's current Stage 10 map: "Current map", then its name. */
export function purgeCurrentMap(html: string): string | null {
  const name = /Current map<\/span><strong[^>]*>([^<]+)<\/strong>/.exec(
    html,
  )?.[1];
  return name === undefined ? null : decodeEntities(name.trim());
}

/** The two Axion Operational Area missions after "Current rotation". */
export function axionCurrentPair(
  html: string,
): readonly [string, string] | null {
  const at = html.indexOf("Current rotation</span>");
  if (at === -1) {
    return null;
  }
  const names = [
    ...html.slice(at, at + 3000).matchAll(/<span>([^<]+)<\/span><\/strong>/g),
  ].map((match) => decodeEntities((match.at(1) ?? "").trim()));
  const first = names.at(0);
  const second = names.at(1);
  return first === undefined || second === undefined ? null : [first, second];
}

/** The 400% page's current day, by its start, and its two operations. */
export function infiltrationToday(html: string): {
  readonly startsAt: string;
  readonly operations: readonly [string, string];
} | null {
  const at = html.indexOf("Current rotation</h2>");
  if (at === -1) {
    return null;
  }
  const block = html.slice(at, at + 12000);
  const startsAt = /<time[^>]*dateTime="([^"]+)"/.exec(block)?.[1];
  const names = [
    ...block.matchAll(/400%<\/span><span[^>]*>([^<]+)<\/span>/g),
  ].map((match) => decodeEntities((match.at(1) ?? "").trim()));
  const first = names.at(0);
  const second = names.at(1);
  return startsAt === undefined || first === undefined || second === undefined
    ? null
    : { startsAt, operations: [first, second] };
}

/** Two pairs with the same names, in either order. */
export function samePair(
  a: readonly string[] | null,
  b: readonly string[] | null,
): boolean {
  return (
    a !== null &&
    b !== null &&
    a.length === b.length &&
    [...a].sort().join("|") === [...b].sort().join("|")
  );
}
