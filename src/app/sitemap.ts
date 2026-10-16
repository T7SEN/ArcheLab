import type { MetadataRoute } from "next";
import { allPages } from "@/data/site-pages";
import { siteUrl } from "@/lib/site-metadata";

/**
 * Every page, from the navbar's and the footer's lists (ADR 0020, ADR 0021), so a new page
 * joins the sitemap with its link. No dates: nothing records when a page last changed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return allPages.map((page) => ({
    url: new URL(page.href, siteUrl).toString(),
  }));
}
