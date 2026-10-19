import { expect, test, type Page } from "@playwright/test";
import { siteUrl } from "../../src/lib/site-metadata";

// The weapon pages and their index (ADR 0024), from NEXON's metadata at build time.
// Monster Hunter (Transcendent) and Thunder Cage (Ultimate, with core slots and a
// recipe) were the approved examples.

/** The page's sections, as its tabs name them, in order (ADR 0029). */
const tabOrder = (page: Page) =>
  page.getByRole("tablist").getByRole("tab").allInnerTexts();

/** Opens one of the page's tabs and returns its panel. */
const openTab = async (page: Page, name: string) => {
  await page.getByRole("tab", { name, exact: true }).click();
  return page.getByRole("tabpanel", { name, exact: true });
};

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

  // The unique ability leads (T7SEN, 2026-10-16), so its tab opens first.
  const ability = page.getByRole("tabpanel", { name: "Unique ability" });
  await expect(
    ability.getByRole("heading", { name: "Hunter's Sense" }),
  ).toBeVisible();
  // Its How to obtain tab: Update 1.4.5 put it in every Transcendent Weapon Loot.
  expect(await tabOrder(page)).toEqual([
    "Unique ability",
    "ATK",
    "Stats",
    "How to obtain",
    "Builds",
  ]);

  const stats = await openTab(page, "Stats");
  for (const group of ["Damage", "Handling", "Range", "Movement"]) {
    await expect(stats.getByRole("heading", { name: group })).toBeVisible();
  }
  await expect(stats.getByText("Fire Rate", { exact: true })).toBeVisible();

  // A Transcendent weapon has no core slot in NEXON's data.
  await expect(page.getByRole("tab", { name: "Core slots" })).toHaveCount(0);
  const obtain = await openTab(page, "How to obtain");
  await expect(obtain.getByRole("note")).toContainText(
    "not Monster Hunter specifically",
  );
});

test("the level slider changes the ATK", async ({ page }) => {
  await page.goto("/weapons/monster-hunter");
  const atk = await openTab(page, "ATK");
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

test("an Ultimate weapon's page shows its core slots and research recipe", async ({
  page,
}) => {
  await page.goto("/weapons/thunder-cage");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Thunder Cage",
  );
  await expect(page.getByText("Ultimate", { exact: true })).toBeVisible();
  // Five in game for the one NEXON lists (T7SEN, 2026-10-17).
  expect(await tabOrder(page)).toEqual([
    "Unique ability",
    "ATK",
    "Stats",
    "Core slots",
    "How to obtain",
    "Builds",
  ]);
  const cores = await openTab(page, "Core slots");
  await expect(cores).toContainText("Thunder Cage has 5 core slots.");
  // Its own slots, read from T7SEN's tooltip (2026-10-17): they differ by weapon.
  await expect(
    cores.getByRole("list", { name: "Slots" }).getByRole("listitem"),
  ).toHaveText([/^Free/, /^Firepower/, /^Hit/, /^Tactical/, /^Precision/]);
  await expect(cores.getByRole("heading", { level: 3 })).toHaveText([
    "Firepower Augmentation",
    "Attribute Augmentation",
    "Hit Augmentation",
    "Tactical Augmentation",
    "Precision Augmentation",
    "Special Augmentation",
  ]);
  // At grade X, in the game's words: both Hit cores, and Fire Rate shown positive.
  await expect(cores.getByRole("button", { name: "Grade 10" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(cores).toContainText("Hit Augmentation Core (Variant AB) X");
  await expect(cores).toContainText("Hit Augmentation Core X");
  await expect(cores).toContainText("Multi-Hit Chance(+)");
  await expect(cores).toContainText("Fits the Free and Firepower slots");
  // Special isn't one of Thunder Cage's slots, so only its Free slot takes those cores.
  // The name is a link to its core on the Cores index (ADR 0044), in the type's heading.
  await expect(
    cores
      .getByRole("heading", { name: "Special Augmentation", exact: true })
      .locator(".."),
  ).toContainText("Fits the Free slot");

  const research = await openTab(page, "How to obtain");
  await expect(
    research.getByRole("heading", { name: "Research Thunder Cage" }),
  ).toBeVisible();
  await research.getByText("How it's researched").first().click();
  await expect(research.getByText(/Gold/).first()).toBeVisible();
});

test("a Transcendent weapon's How to obtain tab lists where it comes from", async ({
  page,
}) => {
  // From the Update 1.4.0 notes T7SEN pointed to (2026-10-17, ADR 0032).
  await page.goto("/weapons/storm-cage#obtain");
  const obtain = page.getByRole("tabpanel", { name: "How to obtain" });
  await expect(obtain).toBeVisible();
  const drops = obtain.getByRole("table").first();
  // Update 1.4.0's 71 contents, and three added by 1.4.3 and 1.4.5.
  await expect(drops.getByRole("row")).toHaveCount(75);
  for (const added of [
    "Breach Tracking",
    "Cradle of Evolution",
    "Onslaught - Stage 5",
  ]) {
    await expect(drops.getByRole("rowheader", { name: added })).toBeVisible();
  }
  await expect(obtain).toContainText("As of Update 1.4.5.");
  // The long list scrolls inside its card, and takes focus so keys can scroll it.
  const scroller = obtain.getByRole("region", { name: "Mission rewards" });
  expect(
    await scroller.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  await expect(scroller).toHaveAttribute("tabindex", "0");
  // Trials: a row per round, a column per build, with no sideways scroll.
  const trials = obtain.getByRole("table").filter({
    has: page.getByRole("columnheader", { name: "Rotational Build" }),
  });
  await expect(trials.getByRole("row")).toHaveCount(5);
  await expect(
    drops.getByRole("row", { name: /^Onslaught - Stage 1 / }),
  ).toContainText("261–400");
  for (const heading of [
    "Mission rewards",
    "First clear",
    "Karel's Mothership",
    "Trials",
    "Deslin in Albion",
  ]) {
    await expect(
      obtain.getByRole("heading", { name: heading, level: 3 }),
    ).toBeVisible();
  }
  await expect(obtain).toContainText("[Range 4] Transcendent Weapon Box");
  // The chances are for a random one, and bonuses raise them (T7SEN, 2026-10-17).
  const note = obtain.getByRole("note");
  await expect(note.getByRole("paragraph")).toHaveText([
    "Chances are for a random Transcendent weapon, not Storm Cage specifically. Drop-rate bonuses raise them.",
    "One-time first-clear guarantees aren't in the mission rewards.",
  ]);
});

test("every Ultimate weapon shows its own core slots", async ({ page }) => {
  // They differ by weapon: NEXON's core-slot.json, cross-checked against tfdhub.gg's,
  // confirmed by T7SEN (2026-10-17; ADR 0042). Links to #core open the Core slots tab.
  await page.goto("/weapons/python#core");
  const cores = page.getByRole("tabpanel", { name: "Core slots" });
  await expect(cores).toContainText("Python has 5 core slots.");
  await expect(cores).not.toContainText("Provisional");
  await expect(
    cores.getByRole("list", { name: "Slots" }).getByRole("listitem"),
  ).toHaveText([
    /^Free/,
    /^Firepower/,
    /^Tactical/,
    /^Precision/,
    /^Precision/,
  ]);

  // A Launcher's Firepower cores roll Explosive ATK.
  await page.goto("/weapons/sigvores-proof#core");
  await expect(
    page.getByRole("tabpanel", { name: "Core slots" }),
  ).toContainText("Explosive ATK");

  // A melee weapon has no Free slot, and shows only its slots' melee cores.
  await page.goto("/weapons/shadow#core");
  const melee = page.getByRole("tabpanel", { name: "Core slots" });
  await expect(
    melee.getByRole("list", { name: "Slots" }).getByRole("listitem"),
  ).toHaveText([/^Firepower/, /^Attribute/, /^Hit/, /^Hit/, /^Hit/]);
  await expect(melee.getByRole("heading", { level: 3 })).toHaveText([
    "Firepower Augmentation",
    "Attribute Augmentation",
    "Hit Augmentation",
  ]);
  await expect(melee).toContainText("Melee Weapon ATK");
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
      name: "Search weapons",
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
