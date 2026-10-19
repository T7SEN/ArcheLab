import { expect, test, type Page } from "@playwright/test";

// The Enhancement Materials index (ADR 0043): the 23 items NEXON's UpgradeMaterial
// research makes, each with its tier, description and every way to research it, a
// tier filter, a search and each item's details under its row.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) =>
  page.getByRole("list", { name: "Enhancement Materials" });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });
const count = (page: Page) =>
  page.getByText(/^\d+( of \d+)? Enhancement Materials$/);

test("all 23 items are listed, Ultimate first", async ({ page }) => {
  await open(page, "/enhancement-materials");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Enhancement Materials",
  );
  await expect(count(page)).toHaveText("23 Enhancement Materials");
  const items = cards(page).locator(":scope > li");
  await expect(items).toHaveCount(23);
  await expect(items.first()).toContainText("Ultimate");
  await expect(items.last()).toContainText("Normal");

  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Rare" })
    .click();
  await expect(page).toHaveURL(/\?tier=rare$/);
  await expect(count(page)).toHaveText("4 of 23 Enhancement Materials");
});

test("a card opens every way to research the item, and Escape closes it", async ({
  page,
}) => {
  await open(page, "/enhancement-materials?material=ion-accelerator");
  const shown = details(page, "Ion Accelerator");
  await expect(shown).toBeInViewport();
  await expect(
    shown.getByRole("heading", { name: "Ion Accelerator", level: 2 }),
  ).toBeFocused();
  await expect(shown.getByText("3 ways to research it")).toBeVisible();
  for (const way of [
    "From Solenoid",
    "From Nano Compound",
    "From Archive Shard",
  ]) {
    await expect(shown.getByRole("heading", { name: way })).toBeVisible();
  }
  // Where it also drops, without the "Obtainable through Research" every item has.
  await expect(shown.getByText("[The Stance of the Magisters]")).toBeVisible();
  await expect(shown.getByText("Obtainable through Research")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/enhancement-materials$/);
  await expect(details(page, "Ion Accelerator")).toHaveCount(0);
  await expect(page.locator("#material-card-ion-accelerator")).toBeFocused();
});

test("Core Binder takes the game's 20,000 Void Abyss Metal Fragments", async ({
  page,
}) => {
  await open(page, "/enhancement-materials?material=core-binder");
  const shown = details(page, "Core Binder");
  await expect(
    shown
      .getByRole("listitem")
      .filter({ hasText: "Void Abyss Metal Fragment" }),
  ).toContainText("×20,000");
});

test("the search finds an item by its ingredients, and the database leads to it", async ({
  page,
}) => {
  await open(page, "/enhancement-materials");
  await page
    .getByRole("searchbox", { name: "Search Enhancement Materials" })
    .fill("archive shard");
  await expect(count(page)).toHaveText(/^\d+ of 23 Enhancement Materials$/);
  await expect(
    cards(page).getByRole("link", { name: /^Ion Accelerator\b/ }),
  ).toBeVisible();

  await open(page, "/database?q=ion%20accelerator");
  const result = page
    .getByRole("region", { name: "Search results" })
    .locator('a[href="/enhancement-materials?material=ion-accelerator"]');
  await expect(result).toContainText("Ion Accelerator");
  await result.click();
  await expect(details(page, "Ion Accelerator")).toBeVisible();
});
