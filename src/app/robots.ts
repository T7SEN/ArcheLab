import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-metadata";

/** Every page may be crawled; the sitemap lists them (ADR 0020). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
