import type { MetadataRoute } from "next";
import { siteHrefs } from "@/data/site-pages";
import { fetchDescendantSummaries } from "@/lib/nexon/descendant-page";
import { fetchWeaponSummaries } from "@/lib/nexon/weapon-page";
import { siteUrl } from "@/lib/site-metadata";

/**
 * Every page, from the navbar's and the footer's lists (ADR 0020, ADR 0021), so a new page
 * joins the sitemap with its link, then every Descendant's and every weapon's page from
 * NEXON's lists (ADR 0023, ADR 0024). No dates: nothing records when a page last changed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [descendants, weapons] = await Promise.all([
    fetchDescendantSummaries(),
    fetchWeaponSummaries(),
  ]);
  return siteHrefs(
    descendants.map((descendant) => descendant.slug),
    weapons.map((weapon) => weapon.slug),
  ).map((href) => ({ url: new URL(href, siteUrl).toString() }));
}
