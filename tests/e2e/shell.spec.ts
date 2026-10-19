import { expect, test, type Locator } from "@playwright/test";
import { changelog } from "../../src/data/changelog";
import {
  menuSections,
  navbarFoldBelow,
  sitePages,
} from "../../src/data/site-pages";

/**
 * The pages the navbar links: all but the footer-only ones (ADR 0028) and Home, which the
 * logo links (`navbar: false`; T7SEN, 2026-10-17).
 */
const navbarPages = sitePages.filter(
  (page) => page.footerOnly !== true && page.navbar !== false,
);

const disclaimer = "ArcheLab, a fan site not affiliated with Nexon.";
const attribution = "Data based on NEXON Open API.";

/**
 * Waits until PillNav has measured its fold. Before that, CSS alone folds the navbar
 * (ADR 0010): the menu button shows on phones, but opens nothing until hydration.
 */
const measured = (nav: Locator) =>
  expect(nav).not.toHaveAttribute("data-fold-below");

for (const path of ["/", "/tools/chat", "/this-page-does-not-exist"]) {
  test(`footer shows the disclaimer, attribution and version on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");

    await expect(footer).toContainText(
      // The heart is drawn, and read as "love" (T7SEN, 2026-10-17).
      "Made with love by T7SEN. © 2026 ArcheLab",
    );
    await expect(footer).toContainText(disclaimer);
    await expect(footer).toContainText(attribution);
    // "NEXON Open API" in the attribution opens NEXON's API site (T7SEN, 2026-10-17).
    const api = footer.getByRole("link", { name: "NEXON Open API" });
    await expect(api).toHaveAttribute("href", "https://openapi.nexon.com/");
    await expect(api).toHaveAttribute("target", "_blank");
    // T7SEN's name opens their page of links (T7SEN, 2026-10-19).
    const owner = footer.getByRole("link", { name: "T7SEN", exact: true });
    await expect(owner).toHaveAttribute("href", "https://links.t7sen.com/");
    await expect(owner).toHaveAttribute("target", "_blank");
    // The site's version, the Changelog's newest, opens the Changelog (T7SEN,
    // 2026-10-19).
    await expect(
      footer.getByRole("link", {
        name: `Version ${String(changelog[0]?.version)}`,
        exact: true,
      }),
    ).toHaveAttribute("href", "/changelog");
  });
}

for (const current of navbarPages) {
  test(`navbar links every page and marks ${current.href} as current`, async ({
    page,
  }) => {
    await page.goto(current.href);
    const nav = page.getByRole("navigation", { name: "Main" });
    const database = nav.getByRole("link", { name: "Database", exact: true });

    // The game's items are in the Database menu (ADR 0027), whose item opens the
    // database page (ADR 0034): marked as the page there, as the section while one of
    // the items is the page shown.
    await measured(nav);
    await expect(database).toHaveAttribute("href", "/database");
    if (current.group === undefined) {
      await expect(database).not.toHaveAttribute("aria-current");
    } else {
      await expect(database).toHaveAttribute(
        "aria-current",
        current.href === "/database" ? "page" : "true",
      );
    }
    await database.hover();
    await expect(database).toHaveAttribute("aria-expanded", "true");
    for (const { href, label } of navbarPages) {
      if (href === "/database") {
        continue;
      }
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      if (href === current.href) {
        await expect(link).toHaveAttribute("aria-current", "page");
      } else {
        await expect(link).not.toHaveAttribute("aria-current");
      }
    }
  });
}

for (const [path, section] of [
  ["/descendants/raven", "Descendants"],
  ["/weapons/monster-hunter", "Weapons"],
] as const) {
  test(`on ${path} the navbar marks ${section} as its section`, async ({
    page,
  }) => {
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: "Main" });
    const database = nav.getByRole("link", { name: "Database", exact: true });
    await measured(nav);
    await expect(database).toHaveAttribute("aria-current", "true");
    await database.hover();
    const current = nav.getByRole("link", { name: section, exact: true });
    await expect(current).toHaveAttribute("aria-current", "true");
    for (const { label } of navbarPages) {
      if (label !== section && label !== "Database") {
        await expect(
          nav.getByRole("link", { name: label, exact: true }),
        ).not.toHaveAttribute("aria-current");
      }
    }

    // Folded, the menu row is marked the same way, its section open.
    await measured(nav);
    await page.setViewportSize({ width: 260, height: 700 });
    await nav.getByRole("button", { name: "Open menu" }).click();
    await expect(
      nav.getByRole("button", { name: "Equipment", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(current).toHaveAttribute("aria-current", "true");
  });
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`the navbar's logo links home and ${reducedMotion === "reduce" ? "stays still" : "spins once"} on hover with ${reducedMotion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/tools/chat");
    // Hovering before hydration would start nothing.
    await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Main" });
    const logo = nav.getByRole("link", { name: "ArcheLab", exact: true });
    await expect(logo).toHaveAttribute("href", "/");
    // The logo is the only way home: no Home link (T7SEN, 2026-10-17).
    await expect(
      nav.getByRole("link", { name: "Home", exact: true }),
    ).toHaveCount(0);
    const turning = () =>
      logo.evaluate(
        (link) => link.firstElementChild?.getAnimations().length ?? 0,
      );

    await logo.hover();
    if (reducedMotion === "reduce") {
      await page.waitForTimeout(300);
      expect(await turning()).toBe(0);
    } else {
      await expect.poll(turning).toBe(1);
      // One turn, then it stops.
      await expect.poll(turning, { timeout: 3000 }).toBe(0);
    }
  });
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(
    javaScriptEnabled ? "with JavaScript" : "without JavaScript",
    () => {
      test.use({ javaScriptEnabled });

      test("no page scrolls sideways on a 390px phone", async ({ page }) => {
        // The navbar's hidden measuring copy once widened every page (ADR 0024), and its
        // links did until PillNav measured them, before CSS folded the first paint
        // (ADR 0010). Without Home the links fit at 390px; whether they fold is the
        // first-paint test's job, this one checks nothing sticks out.
        const width = 390;
        await page.setViewportSize({ width, height: 844 });
        for (const path of [
          "/",
          "/tools/chat",
          "/descendants",
          "/descendants/raven",
          "/weapons",
          "/weapons/monster-hunter",
          "/modules",
          "/reactors",
          "/external-components",
        ]) {
          await page.goto(path);
          const nav = page.getByRole("navigation", { name: "Main" });
          if (javaScriptEnabled) await measured(nav);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
            path,
          ).toBeLessThanOrEqual(width);
        }
      });
    },
  );
}

test("the navbar's first paint folds and lays out as PillNav measures it", async ({
  browser,
  baseURL,
}) => {
  // Before its script runs, CSS folds the navbar below navbarFoldBelow. A change to the
  // page list moves PillNav's measured fold, and this fails until the two agree, on
  // either side of the fold. The fold depends on the system's fonts, and
  // navbarFoldBelow is CI's (Linux), so the widths either side of it are checked there;
  // elsewhere, widths clear of it.
  const widths =
    process.platform === "linux"
      ? [390, navbarFoldBelow - 1, navbarFoldBelow, 1280]
      : [320, 400, 1280];
  const layouts = async (javaScriptEnabled: boolean) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled,
      // No intro: the pills are where they settle.
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const seen = [];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const nav = page.getByRole("navigation", { name: "Main" });
      if (javaScriptEnabled) await measured(nav);
      const controls = await nav.locator("a:visible, button:visible").all();
      seen.push({
        width,
        controls: await Promise.all(
          controls.map(async (control) => ({
            name:
              (await control.getAttribute("aria-label")) ??
              (await control.textContent()),
            box: await control.boundingBox(),
          })),
        ),
      });
    }
    await context.close();
    return seen;
  };

  expect(await layouts(false)).toEqual(await layouts(true));
});

test("the Database item opens its page, and its menu on hover or keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const database = nav.getByRole("link", { name: "Database", exact: true });
  const reactors = nav.getByRole("link", { name: "Reactors", exact: true });
  await measured(nav);
  await expect(reactors).toHaveCount(0);

  // Hover opens it (ADR 0034); it stays open while the pointer crosses into it, and
  // closes a moment after the pointer leaves both. Its rows leave out the database
  // page, which the item itself opens.
  await database.hover();
  await expect(database).toHaveAttribute("aria-expanded", "true");
  await reactors.hover();
  await page.waitForTimeout(400);
  await expect(reactors).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Database", exact: true }),
  ).toHaveCount(1);
  await page.mouse.move(8, 600);
  await expect(reactors).toHaveCount(0);

  // Escape closes it and gives focus to the item, without opening it again.
  await database.hover();
  await expect(reactors).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(reactors).toHaveCount(0);
  await expect(database).toBeFocused();
  await expect(database).toHaveAttribute("aria-expanded", "false");
  await page.mouse.move(8, 600);

  // A press outside closes it: the page's left edge, clear of the menu, which covers
  // the middle of the hero.
  await database.hover();
  await expect(reactors).toBeVisible();
  await page.mouse.click(8, 600);
  await expect(reactors).toHaveCount(0);

  // Tab onto the item opens it, then runs through its links; leaving them closes it.
  await nav.getByRole("link", { name: "Chat builder", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(database).toBeFocused();
  await expect(database).toHaveAttribute("aria-expanded", "true");
  for (let step = 0; step < 8; step++) {
    await page.keyboard.press("Tab");
  }
  await expect(
    nav.getByRole("link", { name: "Mutant Cells", exact: true }),
  ).toBeFocused();
  // Column by column (T7SEN, 2026-10-19).
  for (const label of [
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
  ]) {
    await page.keyboard.press("Tab");
    await expect(
      nav.getByRole("link", { name: label, exact: true }),
    ).toBeFocused();
  }
  await page.keyboard.press("Tab");
  await expect(reactors).toHaveCount(0);

  // A link opens its page and closes the menu.
  await database.hover();
  await reactors.click();
  await expect(page).toHaveURL("/reactors");
  await expect(reactors).toHaveCount(0);
  await expect(database).toHaveAttribute("aria-current", "true");

  // A click on the item opens the database page.
  await page.mouse.move(8, 600);
  await database.click();
  await expect(page).toHaveURL("/database");
  await expect(database).toHaveAttribute("aria-current", "page");
});

test("on a narrow screen the navbar links fold into a menu", async ({
  page,
}) => {
  // Chat builder, Database and the search pill fold below navbarFoldBelow (383px in CI)
  // (ADR 0027).
  await page.setViewportSize({ width: 260, height: 700 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const toggle = nav.getByRole("button", { name: "Open menu" });

  await measured(nav);
  await toggle.click();
  const builder = nav.getByRole("link", { name: "Chat builder", exact: true });
  await expect(builder).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(builder).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Open menu" })).toBeFocused();

  await nav.getByRole("button", { name: "Open menu" }).click();
  await builder.click();
  await expect(page).toHaveURL("/tools/chat");
  await expect(builder).toHaveCount(0);

  // Folded, the Database group is its label over its own page, then a button per
  // section that shows or hides its links (T7SEN, 2026-10-19), all closed on a page
  // outside them.
  await nav.getByRole("button", { name: "Open menu" }).click();
  const database = nav.getByRole("list", { name: "Database" });
  await expect(
    database.getByRole("link", { name: "Database", exact: true }),
  ).toBeVisible();
  const sections = database.getByRole("button");
  await expect(sections).toHaveText([...menuSections]);
  for (const section of await sections.all()) {
    await expect(section).toHaveAttribute("aria-expanded", "false");
  }
  const consumable = database.getByRole("button", { name: "Consumable" });
  const links = page.locator(
    `[id="${String(await consumable.getAttribute("aria-controls"))}"]`,
  );
  await expect(links).toHaveAttribute("inert", "");
  await consumable.click();
  await expect(consumable).toHaveAttribute("aria-expanded", "true");
  await expect(links).not.toHaveAttribute("inert");
  await expect(links.getByRole("link")).toHaveText([
    "Amorphous Materials",
    "Enhancement Materials",
    "Basic Materials",
    "Core Materials",
    "Cores",
    "Miscellaneous",
  ]);
  await consumable.click();
  await expect(consumable).toHaveAttribute("aria-expanded", "false");
  await expect(links).toHaveAttribute("inert", "");

  await nav.getByRole("button", { name: "Game info" }).click();
  await nav
    .getByRole("link", { name: "400% Infiltration Operations", exact: true })
    .click();
  await expect(page).toHaveURL("/infiltration-400");
});

test("the Database menu gives each section a column, fewer on a narrow screen, and scrolls on a short one", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const database = nav.getByRole("link", { name: "Database", exact: true });
  await measured(nav);
  const list = (section: string) =>
    nav.getByRole("list", { name: section, exact: true });
  const lefts = () =>
    Promise.all(
      menuSections.map(async (section) => {
        const box = await list(section).boundingBox();
        return box?.x ?? Number.NaN;
      }),
    );

  // A column each, side by side, each a heading over its pages (T7SEN, 2026-10-19).
  await database.hover();
  for (const [section, first] of [
    ["Equipment", "Descendants"],
    ["Consumable", "Amorphous Materials"],
    ["Collection", "Cosmetics"],
    ["Game info", "Difficulty Level Rewards"],
  ] as const) {
    // Its name: a row's text holds its label twice, the second rolling in on hover.
    await expect(list(section).getByRole("link").first()).toHaveAccessibleName(
      first,
    );
  }
  const wide = await lefts();
  expect(wide).toEqual([...wide].sort((a, b) => a - b));
  expect(new Set(wide).size).toBe(menuSections.length);

  // Narrower and short, the sections after Equipment share a column; the menu stays
  // on the screen and scrolls to its last page.
  await page.mouse.move(8, 600);
  await page.setViewportSize({ width: 600, height: 520 });
  await database.hover();
  const [equipment = 0, consumable = 0, collection, gameInfo] = await lefts();
  expect(consumable).toBeGreaterThan(equipment);
  expect(collection).toBe(consumable);
  expect(gameInfo).toBe(consumable);
  const menu = page.locator(
    `[id="${String(await database.getAttribute("aria-controls"))}"]`,
  );
  const box = await menu.boundingBox();
  const screen = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
  }));
  expect(box?.x).toBeGreaterThanOrEqual(16);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    screen.width - 16,
  );
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    screen.height - 16,
  );
  const cosmetics = nav.getByRole("link", { name: "Cosmetics", exact: true });
  await cosmetics.scrollIntoViewIfNeeded();
  await cosmetics.click();
  await expect(page).toHaveURL("/cosmetics");
});

test("the navbar menu also closes with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Chat builder, Database and the search pill fold below navbarFoldBelow (383px in CI)
  // (ADR 0027).
  await page.setViewportSize({ width: 260, height: 700 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });

  await measured(nav);
  await nav.getByRole("button", { name: "Open menu" }).click();
  const builder = nav.getByRole("link", { name: "Chat builder", exact: true });
  await expect(builder).toBeVisible();

  await nav.getByRole("button", { name: "Close menu" }).click();
  await expect(builder).toHaveCount(0);
});
