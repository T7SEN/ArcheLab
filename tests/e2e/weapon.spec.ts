import { expect, test, type Page } from "@playwright/test";
import { siteUrl } from "../../src/lib/site-metadata";

// The weapon pages and their index (ADR 0024), from NEXON's metadata at build time.
// Monster Hunter (Transcendent) and Thunder Cage (Ultimate, with a core slot and a
// recipe) were the approved examples.

/** The page's sections, top level only, in order. */
const sectionOrder = (page: Page) =>
  page
    .locator("main > section[id]")
    .evaluateAll((sections) => sections.map((section) => section.id));

test("Monster Hunter's page shows the hero, ATK, stats and unique ability", async ({
  page,
}) => {
  await page.goto("/weapons/monster-hunter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Monster Hunter",
  );
  // The art's name doesn't repeat the heading's (Lighthouse can't see this).
  await expect(
    page.getByRole("img", { name: "Monster Hunter's art", exact: true }),
  ).toHaveAttribute(
    "src",
    /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\//,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteUrl}/weapons/monster-hunter`,
  );
  await expect(page.getByText("Transcendent", { exact: true })).toBeVisible();
  await expect(page.getByText("Assault Rifle", { exact: true })).toBeVisible();
  // The hero's stat list is named through a group: a `<dl>`'s own name is dropped.
  const keyStats = page.getByRole("group", { name: "Key stats", exact: true });
  await expect(keyStats.getByRole("term")).toHaveCount(3);
  await expect(keyStats.getByRole("term").first()).toHaveText(/, level 100$/);
  await expect(keyStats.getByRole("definition")).toHaveCount(3);
  // Each rounds type shows NEXON's Library icon beside its name.
  await expect(
    page.locator('dd img[src$="icon_bullet--GeneralRounds.png"]').first(),
  ).toBeVisible();

  const stats = page.getByRole("region", { name: "Stats" });
  for (const group of ["Damage", "Handling", "Range", "Movement"]) {
    await expect(stats.getByRole("heading", { name: group })).toBeVisible();
  }
  await expect(stats.getByText("Fire Rate", { exact: true })).toBeVisible();

  const ability = page.getByRole("region", { name: "Unique ability" });
  await expect(
    ability.getByRole("heading", { name: "Hunter's Sense" }),
  ).toBeVisible();

  // The unique ability leads (T7SEN, 2026-10-16), and every section stands on its own.
  expect(await sectionOrder(page)).toEqual([
    "ability",
    "atk",
    "stats",
    "builds",
  ]);

  // A Transcendent weapon has no core slot or research in NEXON's data.
  await expect(page.getByRole("region", { name: "Core slot" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Research" })).toHaveCount(0);
});

test("the level slider changes the ATK", async ({ page }) => {
  await page.goto("/weapons/monster-hunter");
  const atk = page.getByRole("region", { name: "ATK" });
  await expect(
    atk.getByRole("list", { name: /ATK at level 100$/ }),
  ).toBeVisible();
  const firearm = atk.getByRole("listitem").filter({ hasText: "Firearm ATK" });
  const atHundred = await firearm.innerText();

  // Named once, "Level", with the level as its value text.
  const slider = atk.getByRole("slider", { name: "Level", exact: true });
  await expect(slider).toHaveAttribute("aria-valuetext", "100");
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(
    atk.getByRole("list", { name: /ATK at level 1$/ }),
  ).toBeVisible();
  await expect(slider).toHaveAttribute("aria-valuetext", "1");
  await expect(firearm).not.toHaveText(atHundred);
});

test("an Ultimate weapon's page shows its core slot and research recipe", async ({
  page,
}) => {
  await page.goto("/weapons/thunder-cage");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Thunder Cage",
  );
  await expect(page.getByText("Ultimate", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Core slot" })).toContainText(
    "Thunder Cage has one core slot.",
  );

  expect(await sectionOrder(page)).toEqual([
    "ability",
    "atk",
    "stats",
    "core",
    "research",
    "builds",
  ]);

  const research = page.getByRole("region", { name: "Research" });
  await expect(
    research.getByRole("heading", { name: "Research Thunder Cage" }),
  ).toBeVisible();
  await research.getByText("How it's researched").first().click();
  await expect(research.getByText(/Gold/).first()).toBeVisible();
});

test("its links lead back to the index and on to the next weapon", async ({
  page,
}) => {
  await page.goto("/weapons/monster-hunter");
  const next = page
    .getByRole("navigation", { name: "More weapons" })
    .getByRole("link", { name: /^Next/ });
  await expect(next).toHaveAttribute("rel", "next");
  const href = await next.getAttribute("href");
  await next.click();
  await expect(page).toHaveURL(new RegExp(`${String(href)}$`));
  await page
    .getByRole("navigation", { name: "More weapons" })
    .getByRole("link", { name: /^Previous/ })
    .click();
  await expect(page).toHaveURL(/\/weapons\/monster-hunter$/);

  await page.getByRole("link", { name: "All weapons" }).click();
  await expect(page).toHaveURL(/\/weapons$/);
});

test("a weapon NEXON doesn't list is a 404", async ({ page }) => {
  const response = await page.goto("/weapons/nothing");
  expect(response?.status()).toBe(404);
});

test.describe("the index", () => {
  /** Opens an index once hydrated: typing before the grid mounts is lost. */
  const open = async (page: Page, url: string) => {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
  };
  const grid = (page: Page) => page.getByRole("list", { name: "Weapons" });
  /** The cards' names, in the order shown. */
  const names = (page: Page) =>
    grid(page).getByRole("link").locator(".font-display").allTextContents();
  const cardTexts = (page: Page) =>
    grid(page).getByRole("link").allInnerTexts();

  test("lists every weapon and opens their pages", async ({ page }) => {
    await open(page, "/weapons");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Weapons");
    const count = await grid(page).getByRole("listitem").count();
    expect(count).toBeGreaterThan(100);
    await expect(
      page.getByText(`${String(count)} weapons`, { exact: true }),
    ).toBeVisible();
    // Highest tier first.
    expect((await cardTexts(page)).at(0)).toContain("Transcendent");
    await grid(page)
      .getByRole("link", { name: /^Monster Hunter\b/ })
      .click();
    await expect(page).toHaveURL(/\/weapons\/monster-hunter$/);
  });

  test("filters narrow the grid and live in the URL", async ({ page }) => {
    await open(page, "/weapons");
    const total = await grid(page).getByRole("listitem").count();
    await page
      .getByRole("group", { name: "Tier" })
      .getByRole("button", { name: "Transcendent" })
      .click();
    await expect(page).toHaveURL(/\/weapons\?tier=Transcendent$/);
    // A loop over no cards would pass whatever the filter did.
    const seenTexts = await cardTexts(page);
    expect(seenTexts.length).toBeGreaterThan(0);
    for (const text of seenTexts) {
      expect(text).toContain("Transcendent");
    }

    const rounds = page.getByRole("group", { name: "Rounds" });
    // Each rounds chip shows its Library icon.
    await expect(rounds.locator("img")).toHaveCount(4);
    await rounds.getByRole("button", { name: "Impact Rounds" }).click();
    await expect(page).toHaveURL(/\?tier=Transcendent&rounds=Impact\+Rounds$/);
    const shown = await cardTexts(page);
    expect(shown.length).toBeGreaterThan(0);
    for (const text of shown) {
      expect(text).toContain("Impact Rounds");
    }

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/weapons$/);
    await expect(grid(page).getByRole("listitem")).toHaveCount(total);

    await page
      .getByRole("group", { name: "Type" })
      .getByRole("button", { name: "Hand Cannon" })
      .click();
    await expect(page).toHaveURL(/\?type=Hand\+Cannon$/);
    // A loop over no cards would pass whatever the filter did.
    const seenTexts2 = await cardTexts(page);
    expect(seenTexts2.length).toBeGreaterThan(0);
    for (const text of seenTexts2) {
      expect(text).toContain("Hand Cannon");
    }
  });

  test("search and sort, with an empty state", async ({ page }) => {
    await open(page, "/weapons");
    const search = page.getByRole("searchbox", {
      name: "Search weapons by name",
    });
    await search.fill("thunder");
    await expect(page).toHaveURL(/\?q=thunder$/);
    await expect(
      grid(page).getByRole("link", { name: /^Thunder Cage\b/ }),
    ).toBeVisible();
    for (const name of await names(page)) {
      expect(name.toLowerCase()).toContain("thunder");
    }

    await search.fill("zzzz");
    await expect(
      page.getByText("No weapon matches these filters."),
    ).toBeVisible();
    await search.fill("");
    await expect(page).toHaveURL(/\/weapons$/);

    await page.getByRole("combobox", { name: "Order" }).click();
    await page.getByRole("option", { name: "A–Z" }).click();
    await expect(page).toHaveURL(/\?sort=az$/);
    const sorted = await names(page);
    expect(sorted).toEqual(sorted.toSorted((a, b) => a.localeCompare(b)));
  });

  test("a shared link opens filtered, ignoring values it doesn't know", async ({
    page,
  }) => {
    await open(page, "/weapons?rounds=Enhanced+Ammo&tier=Mythic");
    await expect(
      page
        .getByRole("group", { name: "Rounds" })
        .getByRole("button", { name: "Enhanced Ammo" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page
        .getByRole("group", { name: "Tier" })
        .getByRole("button", { name: "All" }),
    ).toHaveAttribute("aria-pressed", "true");
    // A loop over no cards would pass whatever the filter did.
    const seenTexts3 = await cardTexts(page);
    expect(seenTexts3.length).toBeGreaterThan(0);
    for (const text of seenTexts3) {
      expect(text).toContain("Enhanced Ammo");
    }
  });
});
