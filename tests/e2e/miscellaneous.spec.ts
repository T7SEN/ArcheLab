import { expect, test, type Page } from "@playwright/test";

// The Miscellaneous index (ADR 0050): the 58 items of NEXON's Library's Miscellaneous
// list, each with its tier and where it drops, a tier filter, a search, and each item's
// details under its row with links both ways. Names are the game's on 2026-10-18.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) =>
  page.getByRole("list", { name: "Miscellaneous items" });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });
const count = (page: Page) =>
  page.getByText(/^\d+( of \d+)? Miscellaneous items$/);

test("all 58 items are listed, Ultimate first", async ({ page }) => {
  await open(page, "/miscellaneous");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Miscellaneous",
  );
  await expect(count(page)).toHaveText("58 Miscellaneous items");
  const items = cards(page).locator(":scope > li");
  await expect(items).toHaveCount(58);
  await expect(items.first()).toContainText("Ancestors Module Loot");
  await expect(items.first()).toContainText("Ultimate");
  await expect(items.first()).toContainText(/Found in \d+ places/);
  await expect(items.last()).toContainText("Void Organism");
  await expect(items.last()).toContainText("Normal");
  // Transcendent Weapon Loot's 32 boxes are one card.
  await expect(
    cards(page).getByRole("link", { name: /^Transcendent Weapon Loot\b/ }),
  ).toHaveCount(1);
});

test("Tier and the search keep the items asked for", async ({ page }) => {
  await open(page, "/miscellaneous");
  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Normal" })
    .click();
  await expect(page).toHaveURL(/\?tier=normal$/);
  await expect(count(page)).toHaveText("6 of 58 Miscellaneous items");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("searchbox", { name: "Search Miscellaneous items" })
    .fill("bounty operations");
  await expect(
    cards(page).getByRole("link", { name: /^Collectible Coin\b/ }),
  ).toBeVisible();
  await expect(
    cards(page).getByRole("link", { name: /^Trade Permit\b/ }),
  ).toHaveCount(0);
});

test("an item opens where it drops, its places linking their pages", async ({
  page,
}) => {
  await open(page, "/miscellaneous?item=collectible-coin");
  const shown = details(page, "Collectible Coin");
  await expect(shown).toBeInViewport();
  await expect(
    shown.getByRole("heading", { name: "Collectible Coin" }),
  ).toBeFocused();
  await expect(
    shown.getByRole("heading", { name: "Where to find it" }),
  ).toBeVisible();
  await expect(shown.getByText("[Bounty Operations]").first()).toBeVisible();
  await expect(
    shown.getByRole("link", { name: "[The Shelter]" }),
  ).toHaveAttribute("href", "/infiltration-400?operation=the-shelter");

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/miscellaneous$/);
  await expect(page.locator("#misc-card-collectible-coin")).toBeFocused();
});

test("Transcendent Weapon Loot and the Transcendent weapons link each other", async ({
  page,
}) => {
  await open(page, "/miscellaneous?item=transcendent-weapon-loot");
  const loot = details(page, "Transcendent Weapon Loot");
  await expect(
    loot.getByRole("link", { name: "Transcendent weapons" }),
  ).toHaveAttribute("href", "/weapons?tier=Transcendent");

  await open(page, "/weapons/sparky#obtain");
  const back = page.getByRole("link", { name: "Transcendent Weapon Loot" });
  await expect(back).toHaveCount(2);
  await back.first().click();
  await expect(page).toHaveURL("/miscellaneous?item=transcendent-weapon-loot");
  await expect(details(page, "Transcendent Weapon Loot")).toBeVisible();
});

test("an item and the Basic Material of the same name link each other", async ({
  page,
}) => {
  await open(page, "/miscellaneous?item=xeno-fluid");
  const twin = details(page, "Xeno Fluid").getByRole("link", {
    name: "Xeno Fluid",
  });
  await expect(twin).toHaveAttribute(
    "href",
    "/basic-materials?material=xeno-fluid",
  );
  await twin.click();
  await expect(page).toHaveURL("/basic-materials?material=xeno-fluid");
  const basic = page
    .getByRole("list", { name: "Basic Materials" })
    .getByRole("region", { name: "Xeno Fluid", exact: true });
  await expect(
    basic.getByRole("heading", { name: "Miscellaneous item of the same name" }),
  ).toBeVisible();
  await expect(basic.getByRole("link", { name: "Xeno Fluid" })).toHaveAttribute(
    "href",
    "/miscellaneous?item=xeno-fluid",
  );
});

test("drops on other pages and the database lead to an item", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-18T12:00:00Z"));
  await open(page, "/infiltration-400?operation=the-shelter");
  await page.getByRole("button", { name: /^Show all \d+ rewards$/ }).click();
  const coin = page.locator('a[href="/miscellaneous?item=collectible-coin"]');
  await expect(coin).toContainText("Collectible Coin");
  await coin.click();
  await expect(page).toHaveURL("/miscellaneous?item=collectible-coin");
  await expect(details(page, "Collectible Coin")).toBeVisible();

  await open(page, "/database?q=code%20breaker");
  const result = page
    .getByRole("region", { name: "Search results" })
    .locator('a[href="/miscellaneous?item=code-breaker"]');
  await expect(result).toContainText("Code Breaker");
});
