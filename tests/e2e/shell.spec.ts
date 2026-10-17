import { expect, test, type Locator } from "@playwright/test";
import { navbarFoldBelow, sitePages } from "../../src/data/site-pages";

/** The pages the navbar links: all but the footer-only ones (ADR 0028). */
const navbarPages = sitePages.filter((page) => page.footerOnly !== true);

const disclaimer =
  "ArcheLab is a community fan site and is not affiliated with Nexon.";
const attribution = "Data based on NEXON Open API.";

/**
 * Waits until PillNav has measured its fold. Before that, CSS alone folds the navbar
 * (ADR 0010): the menu button shows on phones, but opens nothing until hydration.
 */
const measured = (nav: Locator) =>
  expect(nav).not.toHaveAttribute("data-fold-below");

for (const path of ["/", "/tools/chat", "/this-page-does-not-exist"]) {
  test(`footer shows the disclaimer and attribution on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");

    await expect(footer).toContainText(
      "Made with ❤️ by T7SEN. © 2026 ArcheLab",
    );
    await expect(footer).toContainText(disclaimer);
    await expect(footer).toContainText(attribution);
  });
}

for (const current of navbarPages) {
  test(`navbar links every page and marks ${current.href} as current`, async ({
    page,
  }) => {
    await page.goto(current.href);
    const nav = page.getByRole("navigation", { name: "Main" });
    const database = nav.getByRole("button", { name: "Database" });

    // The game's items are in the Database menu (ADR 0027), marked while one is the
    // page shown.
    await measured(nav);
    if (current.group === undefined) {
      await expect(database).not.toHaveAttribute("aria-current");
    } else {
      await expect(database).toHaveAttribute("aria-current", "true");
    }
    await database.click();
    await expect(database).toHaveAttribute("aria-expanded", "true");
    for (const { href, label } of navbarPages) {
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
    const database = nav.getByRole("button", { name: "Database" });
    await measured(nav);
    await expect(database).toHaveAttribute("aria-current", "true");
    await database.click();
    const current = nav.getByRole("link", { name: section, exact: true });
    await expect(current).toHaveAttribute("aria-current", "true");
    for (const { label } of navbarPages) {
      if (label !== section) {
        await expect(
          nav.getByRole("link", { name: label, exact: true }),
        ).not.toHaveAttribute("aria-current");
      }
    }

    // Folded, the menu row is marked the same way.
    await measured(nav);
    await page.setViewportSize({ width: 260, height: 700 });
    await nav.getByRole("button", { name: "Open menu" }).click();
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
    const logo = page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "ArcheLab", exact: true });
    await expect(logo).toHaveAttribute("href", "/");
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
        // (ADR 0010).
        await page.setViewportSize({ width: 390, height: 844 });
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
          await expect(
            nav.getByRole("button", { name: "Open menu" }),
          ).toBeVisible();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
            path,
          ).toBeLessThanOrEqual(390);
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
  // either side of the fold.
  const widths = [390, navbarFoldBelow - 1, navbarFoldBelow, 1280];
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

test("the Database menu links the game's items and closes as a menu should", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const database = nav.getByRole("button", { name: "Database" });
  const reactors = nav.getByRole("link", { name: "Reactors", exact: true });
  await measured(nav);
  await expect(reactors).toHaveCount(0);

  // Escape closes it and gives focus back to its button.
  await database.click();
  await expect(reactors).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(reactors).toHaveCount(0);
  await expect(database).toBeFocused();
  await expect(database).toHaveAttribute("aria-expanded", "false");

  // A press outside closes it: the page's left edge, clear of the menu, which covers
  // the middle of the hero.
  await database.click();
  await expect(reactors).toBeVisible();
  await page.mouse.click(8, 600);
  await expect(reactors).toHaveCount(0);

  // Tab runs from its button through its links; leaving them closes it.
  await database.click();
  await database.focus();
  for (let step = 0; step < 5; step++) {
    await page.keyboard.press("Tab");
  }
  await expect(
    nav.getByRole("link", { name: "External Components", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(reactors).toHaveCount(0);

  // A link opens its page and closes the menu.
  await database.click();
  await reactors.click();
  await expect(page).toHaveURL("/reactors");
  await expect(reactors).toHaveCount(0);
  await expect(database).toHaveAttribute("aria-current", "true");
});

test("on a narrow screen the navbar links fold into a menu", async ({
  page,
}) => {
  // Home, Chat builder, Database and the search pill fold at 447px and below
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

  // Folded, the Database group is its label over its links.
  await nav.getByRole("button", { name: "Open menu" }).click();
  const database = nav.getByRole("list", { name: "Database" });
  await expect(database.getByRole("link")).toHaveText([
    "Descendants",
    "Weapons",
    "Modules",
    "Reactors",
    "External Components",
  ]);
});

test("the navbar menu also closes with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Home, Chat builder, Database and the search pill fold at 447px and below
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
