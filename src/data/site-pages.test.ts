import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { databaseCategories } from "@/features/database/database-items";
import {
  allPages,
  dynamicRoutes,
  legalPages,
  menuSections,
  navbarCurrent,
  navbarEntries,
  sitePages,
  type SitePage,
} from "./site-pages";

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

const isDynamic = (route: string): boolean => route.includes("[");

describe("site pages", () => {
  it("lists every page under src/app, so each one gets a navbar or footer link", () => {
    const listed = allPages.map((page) => page.href).sort();
    expect(listed).toEqual(
      appRoutes()
        .filter((route) => !isDynamic(route))
        .sort(),
    );
  });

  it("lists every dynamic route and where its pages come from", () => {
    const dynamic = appRoutes().filter(isDynamic).sort();
    expect(Object.keys(dynamicRoutes).sort()).toEqual(dynamic);
    for (const [route, source] of Object.entries(dynamicRoutes)) {
      expect(source, route).not.toBe("");
    }
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

describe("navbarCurrent", () => {
  it("marks a navbar page itself, or the section a page sits under", () => {
    expect(navbarCurrent("/")).toEqual({ href: "/", page: true });
    expect(navbarCurrent("/descendants")).toEqual({
      href: "/descendants",
      page: true,
    });
    expect(navbarCurrent("/descendants/ultimate-bunny")).toEqual({
      href: "/descendants",
      page: false,
    });
  });

  it("marks nothing outside the navbar, and Home is no page's section", () => {
    expect(navbarCurrent("/privacy")).toBeNull();
    expect(navbarCurrent("/descendantsx")).toBeNull();
    expect(navbarCurrent("/this-page-does-not-exist")).toBeNull();
  });
});

describe("navbarEntries", () => {
  it("puts the game's items under one Database button, after Home and the chat builder", () => {
    expect(
      navbarEntries().map((entry) =>
        "page" in entry
          ? entry.page.label
          : [entry.group, entry.pages.map((page) => page.label)],
      ),
    ).toEqual([
      // No Home: the logo links home (T7SEN, 2026-10-17).
      "Chat builder",
      [
        "Database",
        [
          // The database's own page leads its menu (ADR 0034).
          "Database",
          "Descendants",
          "Weapons",
          "Modules",
          "Reactors",
          "External Components",
          "Fellows",
          "Vehicles",
          "Mutant Cells",
          "Amorphous Materials",
          "Enhancement Materials",
          "Basic Materials",
          "Core Materials",
          "Cores",
          "Miscellaneous",
          "Cosmetics",
          "Difficulty Level Rewards",
          "400% Infiltration Operations",
          "Axion Operational Areas",
          "Void Erosion Purge",
          "Timers",
        ],
      ],
    ]);
  });

  it("puts every Database page but the database's own under its section, as T7SEN grouped them", () => {
    const database = sitePages.filter((page) => page.group === "Database");
    expect(
      database
        .filter((page) => page.section === undefined)
        .map((page) => page.href),
    ).toEqual(["/database"]);
    // T7SEN, 2026-10-19.
    expect(
      Object.fromEntries(
        menuSections.map((section) => [
          section,
          database
            .filter((page) => page.section === section)
            .map((page) => page.label),
        ]),
      ),
    ).toEqual({
      Equipment: [
        "Descendants",
        "Weapons",
        "Modules",
        "Reactors",
        "External Components",
        "Fellows",
        "Vehicles",
        "Mutant Cells",
      ],
      Consumable: [
        "Amorphous Materials",
        "Enhancement Materials",
        "Basic Materials",
        "Core Materials",
        "Cores",
        "Miscellaneous",
      ],
      "Game info": [
        "Difficulty Level Rewards",
        "400% Infiltration Operations",
        "Axion Operational Areas",
        "Void Erosion Purge",
        "Timers",
      ],
      Collection: ["Cosmetics"],
    });
  });

  it("puts every database page category in a section, so the database page shows its card", () => {
    for (const category of databaseCategories) {
      expect(
        sitePages.find((page) => page.href === category.href)?.section,
        category.href,
      ).toBeDefined();
    }
  });

  it("keeps Game info the last section (T7SEN, 2026-10-19)", () => {
    expect(menuSections.at(-1)).toBe("Game info");
  });

  it("keeps a section's pages together, the sections in menuSections order", () => {
    const sections = sitePages.flatMap((page) =>
      page.section === undefined ? [] : [page.section],
    );
    expect(
      sections.filter((section, index) => section !== sections[index - 1]),
    ).toEqual([...menuSections]);
  });

  it("makes the page named as its group the page the group's button opens", () => {
    const database = navbarEntries().find((entry) => "group" in entry);
    expect(database !== undefined && "group" in database).toBe(true);
    if (database !== undefined && "group" in database) {
      expect(database.home?.href).toBe("/database");
    }
  });

  it("gives a group the place of its first page, and keeps every page once", () => {
    const page = (label: string, group?: "Database"): SitePage => ({
      href: `/${label}`,
      label,
      icon: sitePages[0].icon,
      group,
    });
    const entries = navbarEntries([
      page("a"),
      page("b", "Database"),
      page("c"),
      page("d", "Database"),
    ]);
    expect(
      entries.map((entry) =>
        "page" in entry
          ? entry.page.label
          : entry.pages.map((member) => member.label).join("+"),
      ),
    ).toEqual(["a", "b+d", "c"]);
  });
});
