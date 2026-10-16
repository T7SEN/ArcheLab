import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { allPages, siteHrefs } from "@/data/site-pages";
import { pageMetadata, siteImage, siteUrl } from "./site-metadata";

describe("search engines", () => {
  it("the sitemap lists every page, then every Descendant's and weapon's", () => {
    expect(siteHrefs(["raven", "ultimate-bunny"], ["monster-hunter"])).toEqual([
      ...allPages.map((page) => page.href),
      "/descendants/raven",
      "/descendants/ultimate-bunny",
      "/weapons/monster-hunter",
    ]);
  });

  it("robots.txt allows every page and points at the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${siteUrl}/sitemap.xml`,
    });
  });
});

describe("pageMetadata", () => {
  it("gives a page its canonical address and full link preview", () => {
    const metadata = pageMetadata({
      path: "/tools/chat",
      title: "Chat message builder",
      description: "Build messages.",
    });
    expect(metadata.title).toBe("Chat message builder");
    expect(metadata.alternates?.canonical).toBe("/tools/chat");
    expect(metadata.openGraph).toMatchObject({
      url: "/tools/chat",
      siteName: "ArcheLab",
      title: "Chat message builder",
      description: "Build messages.",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    // The site image by default.
    expect(metadata.openGraph?.images).toEqual([siteImage]);
    expect(metadata.twitter?.images).toEqual([siteImage]);
  });

  it("leaves the image to a page's own opengraph-image file", () => {
    const metadata = pageMetadata({
      path: "/tools/chat",
      description: "Build messages.",
      ownImage: true,
    });
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("leaves the home page's title to the layout and previews it as ArcheLab", () => {
    const metadata = pageMetadata({ path: "/", description: "Tools." });
    expect(metadata).not.toHaveProperty("title");
    expect(metadata.openGraph).toMatchObject({ title: "ArcheLab", url: "/" });
  });
});
