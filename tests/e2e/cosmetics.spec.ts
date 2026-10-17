import { expect, test, type Page } from "@playwright/test";

// The Cosmetics index (ADR 0039): every cosmetic in NEXON's data, one card per cosmetic
// with its versions inside, drawn in batches as the page scrolls, with filters by type,
// tier and Descendant. Names and counts are NEXON's on 2026-10-17; counts may grow.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) => page.getByRole("list", { name: "Cosmetics" });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });
const count = (page: Page) => page.getByText(/^([\d,]+ of )?[\d,]+ cosmetics$/);
const nexonArt =
  /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\/[0-9a-f]{32}$/;

test("cosmetics are listed highest tier first, more drawn as the page scrolls", async ({
  page,
}) => {
  await open(page, "/cosmetics");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cosmetics");
  await expect(count(page)).toHaveText(/^[\d,]+ cosmetics$/);
  const items = cards(page).locator(":scope > li");
  // A batch of 60 at first (`cardBatch`), not over a thousand at once.
  await expect(items).toHaveCount(60);
  await expect(items.first()).toContainText("Ultimate");
  await expect(items.first().locator("img")).toHaveAttribute("src", nexonArt);

  await page.keyboard.press("End");
  await expect.poll(() => items.count()).toBeGreaterThan(60);
});

test("a card opens its versions and who can use each", async ({ page }) => {
  // Searched first: unfiltered, a Normal cosmetic sits about 900 cards down, and
  // drawing them all made this test outlast its waits when specs ran side by side.
  await open(page, "/cosmetics?q=pajamas&cosmetic=dinosaur-pajamas-body-skin");
  const shown = details(page, "Dinosaur Pajamas");
  await expect(shown).toBeInViewport();
  await expect(
    shown.getByRole("heading", { name: "Dinosaur Pajamas", level: 2 }),
  ).toBeFocused();
  await expect(shown.getByText("Body Skin", { exact: true })).toBeVisible();
  await expect(shown.getByText("Normal", { exact: true })).toBeVisible();

  const versions = shown.getByRole("group", { name: /^\d+ versions$/ });
  const art = shown.locator("img").first();
  const before = await art.getAttribute("src");
  await versions
    .getByRole("button", { name: "Bunny, Ultimate Bunny", exact: true })
    .click();
  await expect(art).not.toHaveAttribute("src", before ?? "");
  await expect(art).toHaveAttribute("src", nexonArt);
  await expect(
    shown.getByRole("heading", { name: "Who can use this version" }),
  ).toBeVisible();
  const bunny = shown.getByRole("link", { name: "Bunny", exact: true });
  await expect(bunny).toHaveAttribute("href", "/descendants/bunny");
  await expect(
    shown.getByRole("link", { name: "Ultimate Bunny", exact: true }),
  ).toBeVisible();

  // Escape closes it and gives focus back to the card.
  await expect(
    versions.getByRole("button", {
      name: "Bunny, Ultimate Bunny",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/cosmetics\?q=pajamas$/);
  await expect(details(page, "Dinosaur Pajamas")).toHaveCount(0);
  await expect(
    page.locator("#cosmetic-card-dinosaur-pajamas-body-skin"),
  ).toBeFocused();
});

test("an evolving skin shows each stage", async ({ page }) => {
  await open(page, "/cosmetics?cosmetic=bizarre-watcher-head-skin");
  const shown = details(page, "Bizarre Watcher");
  const stages = shown.getByRole("group", { name: "3 stages" });
  await expect(stages.getByRole("button")).toHaveText([
    "Stage 1",
    "Stage 2",
    "Stage 3",
  ]);
  const art = shown.locator("img").first();
  const before = await art.getAttribute("src");
  await stages.getByRole("button", { name: "Stage 2" }).click();
  await expect(art).not.toHaveAttribute("src", before ?? "");
  await expect(
    shown.getByRole("link", { name: "Sharen", exact: true }),
  ).toBeVisible();
});

test("the filters narrow the cosmetics, and a Descendant sees what everyone can use", async ({
  page,
}) => {
  await open(page, "/cosmetics");
  await page.getByRole("combobox", { name: "Descendant" }).click();
  await page.getByRole("option", { name: "Bunny", exact: true }).click();
  await expect(page).toHaveURL(/\?descendant=bunny$/);
  await expect(count(page)).toHaveText(/^[\d,]+ of [\d,]+ cosmetics$/);

  // Attachments, paints and spawns are for every Descendant (T7SEN, 2026-10-17).
  await page
    .getByRole("group", { name: "Type" })
    .getByRole("button", { name: "Back Attachment" })
    .click();
  await expect(page).toHaveURL(/\?type=back-attachment&descendant=bunny$/);
  await expect(cards(page).getByRole("link").first()).toContainText(
    "Every Descendant",
  );

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/cosmetics$/);
  await page
    .getByRole("searchbox", { name: "Search cosmetics" })
    .fill("bunny pajamas");
  await expect(cards(page).getByRole("link")).toHaveText([
    /^Dinosaur Pajamas.*Head Skin/,
    /^Dinosaur Pajamas.*Body Skin/,
  ]);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Ultimate" })
    .click();
  await expect(page).toHaveURL(/\?tier=ultimate$/);
  // Text, not innerText: cards off screen skip rendering (`content-visibility`).
  for (const text of await cards(page).getByRole("link").allTextContents()) {
    expect(text).toContain("Ultimate");
  }
});

test("the Database menu and search lead to the cosmetics", async ({ page }) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Database", exact: true }).hover();
  await nav.getByRole("link", { name: "Cosmetics", exact: true }).click();
  await expect(page).toHaveURL("/cosmetics");

  // An Ultimate cosmetic, first in the index's order, so its card draws at once.
  await open(page, "/database?q=absolute-zero");
  const body = page
    .getByRole("region", { name: "Search results" })
    .locator('a[href="/cosmetics?cosmetic=absolute-zero-body-skin"]');
  await expect(body).toContainText("Body Skin");
  await body.click();
  await expect(details(page, "Absolute-Zero")).toBeVisible();
});
