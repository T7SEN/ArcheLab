import { expect, test, type Page } from "@playwright/test";

// The Fellows page (ADR 0035): a big card per Fellow with its art, passive and four
// numbers at level 40, opening its effects, every level and its research in a row under
// it.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) => page.getByRole("list", { name: "Fellows" });
// The card itself: an open card's research links its Core Materials, which share its
// name ("Hagios Sheepdog Code").
const card = (page: Page, name: string) =>
  cards(page)
    .locator('a[id^="fellow-card-"]')
    .and(page.getByRole("link", { name: new RegExp(`^${name}\\b`) }));
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });

test("every Fellow has a big card with its art, passive and numbers", async ({
  page,
}) => {
  await open(page, "/fellows");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fellows");
  for (const [name, passive, interval] of [
    ["Hagios Sheepdog", "Auto HP Recovery", "17s"],
    ["Vespers Hunting Dog", "Auto Refill Rounds", "22.5s"],
    ["Snowy Sled Dog", "Auto MP Recovery", "15s"],
  ] as const) {
    const link = card(page, name);
    const slug = name.toLowerCase().replaceAll(" ", "-");
    await expect(link).toHaveAttribute("href", `/fellows?fellow=${slug}`);
    // The art T7SEN supplied, from the site's own files (ADR 0035).
    await expect(link.locator("img")).toHaveAttribute(
      "src",
      `/art/fellows/${slug}.webp`,
    );
    await expect(link).toContainText("Normal");
    await expect(link).toContainText(passive);
    await expect(link).toContainText("25%");
    await expect(link).toContainText(interval);
    await expect(link).toContainText("At level 40");
  }
});

test("a card opens its details, with numbers at every level", async ({
  page,
}) => {
  await open(page, "/fellows");
  const sheepdog = card(page, "Hagios Sheepdog");
  await sheepdog.click();
  await expect(page).toHaveURL(/\?fellow=hagios-sheepdog$/);
  await expect(sheepdog).toHaveAttribute("aria-expanded", "true");
  const shown = details(page, "Hagios Sheepdog");
  await expect(
    shown.getByRole("heading", { name: "Hagios Sheepdog", level: 2 }),
  ).toBeFocused();
  // T7SEN confirmed every passive in game (2026-10-17): no provisional mark.
  await expect(shown.getByText(/Provisional/)).toHaveCount(0);
  // The effects' names also appear in their conditions ("…grants … Enhancement").
  await expect(
    shown.getByText("Hagios Sheepdog Enhancement", { exact: true }),
  ).toBeVisible();
  await expect(
    shown.getByText("Emergency Purification Kit", { exact: true }),
  ).toBeVisible();

  // Level 40 first, from NEXON's data and the Update 1.4.0 notes.
  const level = shown.getByRole("slider", { name: "Level" });
  await expect(level).toHaveAttribute("aria-valuetext", "40");
  const numbers = shown.getByRole("definition");
  await expect(numbers).toHaveText(["25%", "60s", "17s", "35.8%"]);
  await level.focus();
  await page.keyboard.press("Home");
  await expect(level).toHaveAttribute("aria-valuetext", "1");
  await expect(numbers).toHaveText(["1%", "60s", "30s", "16%"]);
  await expect(
    shown.getByRole("heading", { name: "Research Hagios Sheepdog" }),
  ).toBeVisible();

  // Escape closes it and gives focus back to the card.
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/fellows$/);
  await expect(details(page, "Hagios Sheepdog")).toHaveCount(0);
  await expect(sheepdog).toBeFocused();
});

test("on a phone the details open right under their card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/fellows?fellow=hagios-sheepdog");
  // The first card, then its details, then the other two.
  const items = cards(page).locator(":scope > li");
  await expect(
    items.nth(1).getByRole("region", { name: "Hagios Sheepdog", exact: true }),
  ).toBeVisible();
  await expect(items.nth(2)).toContainText("Vespers Hunting Dog");
});

test("the Database menu and the palette lead to the Fellows", async ({
  page,
}) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Database", exact: true }).hover();
  await nav.getByRole("link", { name: "Fellows", exact: true }).click();
  await expect(page).toHaveURL("/fellows");

  await page.keyboard.press("Control+k");
  await page.keyboard.type("vespers");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/fellows?fellow=vespers-hunting-dog");
  await expect(details(page, "Vespers Hunting Dog")).toBeVisible();
});
