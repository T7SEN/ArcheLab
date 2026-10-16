import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { allPages, legalPages, sitePages } from "./site-pages";

const appDir = fileURLToPath(new URL("../app/", import.meta.url));

/**
 * The URL of every page file under `src/app`. Route groups `(name)` add no URL
 * segment, and private folders `_name` and parallel slots `@name` hold no pages.
 */
function appRoutes(): string[] {
  return readdirSync(appDir, { recursive: true, withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && /^page\.(tsx?|jsx?|mdx)$/.test(entry.name),
    )
    .map((entry) =>
      entry.parentPath
        .slice(appDir.length)
        .split(/[\\/]/)
        .filter((segment) => segment !== ""),
    )
    .filter((segments) => !segments.some((s) => /^[_@]/.test(s)))
    .map(
      (segments) => `/${segments.filter((s) => !/^\(.*\)$/.test(s)).join("/")}`,
    );
}

describe("site pages", () => {
  it("lists every page under src/app, so each one gets a navbar or footer link", () => {
    const listed = allPages.map((page) => page.href).sort();
    expect(listed).toEqual(appRoutes().sort());
  });

  it("lists each page once", () => {
    const hrefs = allPages.map((page) => page.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps the legal pages out of the navbar", () => {
    const navbar = sitePages.map((page) => page.href);
    for (const page of legalPages) {
      expect(navbar).not.toContain(page.href);
    }
  });
});
