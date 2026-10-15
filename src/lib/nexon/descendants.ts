import "server-only";
import { z } from "zod";

/** NEXON's keyless static metadata for Descendants (SKILL.md section 5.5). */
export const descendantMetadataUrl =
  "https://open.api.nexon.com/static/tfd/meta/en/descendant.json";

/** Images are only ever loaded from NEXON's static image host. */
const imageHost = "https://open.api.nexon.com/static/tfd/img/";

const fetchTimeoutMs = 15_000;

/** Only the two fields the builder uses. Other fields are ignored. */
const descendantSchema = z.object({
  descendant_name: z.string().min(1),
  descendant_image_url: z.string().startsWith(imageHost),
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
  if (!Array.isArray(metadata)) {
    return {};
  }
  const wanted = new Set(names);
  const urls: Record<string, string> = {};
  for (const entry of metadata) {
    const result = descendantSchema.safeParse(entry);
    if (result.success && wanted.has(result.data.descendant_name)) {
      urls[result.data.descendant_name] = result.data.descendant_image_url;
    }
  }
  return urls;
}

/**
 * Fetches portrait URLs while a page is prerendered (ADR 0008). A failure never
 * breaks the build: it logs a warning and returns no URLs, so every icon shows
 * its labeled placeholder. The weekly scheduled deploy refetches, keeping the
 * data far inside the 30-day limit (Nexon API Terms §8.7).
 */
export async function fetchPortraitUrls(
  names: readonly string[],
): Promise<PortraitUrls> {
  if (names.length === 0) {
    return {};
  }
  try {
    const response = await fetch(descendantMetadataUrl, {
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${String(response.status)}`);
    }
    const urls = portraitUrlsFrom(await response.json(), names);
    const missing = names.filter((name) => !(name in urls));
    if (missing.length > 0) {
      console.warn(
        `NEXON metadata has no valid portrait for: ${missing.join(", ")}. Those icons use placeholders.`,
      );
    }
    return urls;
  } catch (error) {
    console.warn(
      `Could not load NEXON Descendant metadata (${String(error)}). Icons use placeholders.`,
    );
    return {};
  }
}
