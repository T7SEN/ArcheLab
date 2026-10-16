import { expect, test, type Locator } from "@playwright/test";
import { navbarFoldBelow, sitePages } from "../../src/data/site-pages";

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

for (const current of sitePages) {
  test(`navbar links every page and marks ${current.href} as current`, async ({
    page,
  }) => {
    await page.goto(current.href);
    const nav = page.getByRole("navigation", { name: "Main" });

    for (const { href, label } of sitePages) {
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
    const current = nav.getByRole("link", { name: section, exact: true });
    await expect(current).toHaveAttribute("aria-current", "true");
    for (const { label } of sitePages) {
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

test("on a narrow screen the navbar links fold into a menu", async ({
  page,
}) => {
  // Today's six links and the search pill fold at 735px and below (ADR 0026).
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
});

test("the navbar menu also closes with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Today's six links and the search pill fold at 735px and below (ADR 0026).
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
