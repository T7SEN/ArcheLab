import { expect, test, type Page } from "@playwright/test";

// The Core Materials index (ADR 0047): every part that researches a Descendant, weapon,
// Fellow, vehicle or Enhancement Material, drawn 60 at a time, with its tier, what it
// goes into, how it's researched, the patterns that give it and where it drops. Names
// are the game's on 2026-10-18.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) =>
  page.getByRole("list", { name: "Core Materials" });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });
const count = (page: Page) =>
  page.getByText(/^[\d,]+( of [\d,]+)? Core Materials$/);

test("every Core Material is listed, Ultimate first, more drawn as the page scrolls", async ({
  page,
}) => {
  await open(page, "/core-materials");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Core Materials",
  );
  await expect(count(page)).toHaveText("469 Core Materials");
  const items = cards(page).locator(":scope > li");
  // A batch of 60 at first (`cardBatch`).
  await expect(items).toHaveCount(60);
  await expect(items.first()).toContainText("A-TAMS Blueprint");
  await expect(items.first()).toContainText("Ultimate");
  await expect(items.first()).toContainText("For A-TAMS");
  await expect(items.first().locator("img")).toHaveAttribute(
    "src",
    /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\/[0-9a-f]{32}$/,
  );

  await page.keyboard.press("End");
  await expect.poll(() => items.count()).toBeGreaterThan(60);
});

test("Tier, For and the search keep the materials asked for", async ({
  page,
}) => {
  await open(page, "/core-materials");
  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Ultimate" })
    .click();
  await expect(page).toHaveURL(/\?tier=ultimate$/);
  await expect(count(page)).toHaveText("162 of 469 Core Materials");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("group", { name: "For" })
    .getByRole("button", { name: "Fellows" })
    .click();
  await expect(page).toHaveURL(/\?for=fellow$/);
  await expect(
    cards(page).getByRole("link", { name: /^Hagios Sheepdog Code\b/ }),
  ).toBeVisible();
  await expect(
    cards(page).getByRole("link", { name: /^A-TAMS Blueprint\b/ }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("searchbox", { name: "Search Core Materials" })
    .fill("thunder cage");
  await expect(
    cards(page).getByRole("link", { name: /^Thunder Cage Blueprint\b/ }),
  ).toBeVisible();
});

test("a card opens what it's for, its recipe and where it drops, each linked", async ({
  page,
}) => {
  await open(page, "/core-materials?material=thunder-cage-blueprint");
  const shown = details(page, "Thunder Cage Blueprint");
  await expect(shown).toBeInViewport();
  await expect(
    shown.getByRole("heading", { name: "Thunder Cage Blueprint", level: 2 }),
  ).toBeFocused();
  await expect(
    shown.getByRole("link", { name: "Thunder Cage", exact: true }),
  ).toHaveAttribute("href", "/weapons/thunder-cage");
  await expect(
    shown.getByRole("heading", { name: "Research Thunder Cage Blueprint" }),
  ).toBeVisible();
  await expect(
    shown.getByRole("link", { name: "Archive Shard" }).first(),
  ).toHaveAttribute("href", "/basic-materials?material=archive-shard");
  await expect(
    shown.getByRole("heading", { name: "Where to find it" }),
  ).toBeVisible();
  await expect(
    shown.locator('a[href^="/difficulty-level-rewards?battlefield="]').first(),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/core-materials$/);
  await expect(details(page, "Thunder Cage Blueprint")).toHaveCount(0);
});

test("an Enhancement Material's Blueprint lists the patterns that give it", async ({
  page,
}) => {
  await open(page, "/core-materials?material=energy-activator-blueprint");
  const shown = details(page, "Energy Activator Blueprint");
  await expect(
    shown.getByRole("heading", { name: "From Amorphous Material Patterns" }),
  ).toBeVisible();
  await expect(shown.getByRole("link", { name: /^Dia\b/ })).toHaveAttribute(
    "href",
    "/amorphous-materials?pattern=dia",
  );
  await expect(shown.getByRole("link", { name: /^Dia\b/ })).toContainText("%");
});

test("recipes, pattern rewards and the database search lead to a material", async ({
  page,
}) => {
  await open(page, "/descendants/ultimate-bunny#obtain");
  const code = page
    .getByRole("tabpanel", { name: "How to obtain" })
    .getByRole("link", { name: "Ultimate Bunny Code", exact: true });
  await expect(code).toHaveAttribute(
    "href",
    "/core-materials?material=ultimate-bunny-code",
  );
  await code.click();
  await expect(page).toHaveURL("/core-materials?material=ultimate-bunny-code");
  await expect(details(page, "Ultimate Bunny Code")).toBeVisible();

  await open(page, "/amorphous-materials?pattern=dia");
  await expect(
    page
      .locator('a[href="/core-materials?material=energy-activator-blueprint"]')
      .first(),
  ).toBeVisible();

  await open(page, "/database?q=thunder%20cage%20blueprint");
  const result = page
    .getByRole("region", { name: "Search results" })
    .locator('a[href="/core-materials?material=thunder-cage-blueprint"]');
  await expect(result).toContainText("Thunder Cage Blueprint");
  await result.click();
  await expect(details(page, "Thunder Cage Blueprint")).toBeVisible();
});
