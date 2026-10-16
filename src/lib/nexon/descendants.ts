import "server-only";
import { z } from "zod";
import { entriesFrom, fetchMetadataSet, nexonImageUrl } from "./metadata";

/** Only the two fields the chat icons use. Other fields are ignored. */
const portraitSchema = z.object({
  descendant_name: z.string().min(1),
  descendant_image_url: nexonImageUrl,
});

/** Portrait image URL by Descendant name, for example `Bunny` or `Ultimate Bunny`. */
export type PortraitUrls = Readonly<Record<string, string>>;

/**
 * Picks each requested Descendant's portrait URL out of `descendant.json`.
 * Invalid entries are skipped one by one, so one malformed Descendant never
 * hides the others. Names must match exactly: portrait icons name the base
 * Descendant (`Bunny`), and only a character ticket names an Ultimate
 * (`Ultimate Bunny`; SKILL.md section 5.1).
 */
export function portraitUrlsFrom(
  metadata: unknown,
  names: readonly string[],
): PortraitUrls {
  const wanted = new Set(names);
  const urls: Record<string, string> = {};
  for (const entry of entriesFrom(metadata, portraitSchema).entries) {
    if (wanted.has(entry.descendant_name)) {
      urls[entry.descendant_name] = entry.descendant_image_url;
    }
  }
  return urls;
}

/**
 * Fetches portrait URLs while a page is prerendered (ADR 0008). A failure never
 * breaks the build: every icon then shows its labeled placeholder.
 */
export async function fetchPortraitUrls(
  names: readonly string[],
): Promise<PortraitUrls> {
  if (names.length === 0) {
    return {};
  }
  const urls = portraitUrlsFrom(
    await fetchMetadataSet("descendant", portraitSchema),
    names,
  );
  const missing = names.filter((name) => !(name in urls));
  if (missing.length > 0) {
    console.warn(
      `NEXON metadata has no valid portrait for: ${missing.join(", ")}. Those icons use placeholders.`,
    );
  }
  return urls;
}
