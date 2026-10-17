import { expect, test, type Page } from "@playwright/test";

// The Vehicles page (ADR 0037): a big card per vehicle with its art, kind and four key
// numbers at level 20, opening every stat at a level in its group, and its research,
// in a row under it.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) => page.getByRole("list", { name: "Vehicles" });
const card = (page: Page, name: string) =>
  cards(page).getByRole("link", { name: new RegExp(`^${name}\\b`) });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });

test("every vehicle has a big card with its art, tier, kind and key numbers", async ({
  page,
}) => {
  await open(page, "/vehicles");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vehicles");
  for (const [name, slug, tier, kind, maxSpeed] of [
    ["GLIDE-4", "glide-4", "Normal", "Basic Hover Bike", "2,000"],
    ["Vortex", "vortex", "Rare", "Speed Hover Bike", "2,500"],
    ["Orca", "orca", "Rare", "Balanced Hover Bike", "2,300"],
  ] as const) {
    const link = card(page, name);
    await expect(link).toHaveAttribute("href", `/vehicles?vehicle=${slug}`);
    await expect(link.locator("img")).toHaveAttribute(
      "src",
      /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\//,
    );
    await expect(link).toContainText(tier);
    await expect(link).toContainText(kind);
    await expect(link).toContainText(`Max Speed${maxSpeed}`);
    await expect(link).toContainText("At level 20");
  }
});

test("a card opens its details, with every stat at a level", async ({
  page,
}) => {
  await open(page, "/vehicles");
  const vortex = card(page, "Vortex");
  await vortex.click();
  await expect(page).toHaveURL(/\?vehicle=vortex$/);
  const shown = details(page, "Vortex");
  await expect(
    shown.getByRole("heading", { name: "Vortex", level: 2 }),
  ).toBeFocused();
  await expect(shown.getByText("Speed Hover Bike, Vortex")).toBeVisible();

  // Level 20 first; the groups hold both kinds of stat.
  const level = shown.getByRole("slider", { name: "Level" });
  await expect(level).toHaveAttribute("aria-valuetext", "20");
  const speed = shown.getByRole("region", { name: "Speed" });
  await expect(speed.getByRole("definition").first()).toHaveText("2,500");
  // A Modifier shows as a percentage.
  await expect(speed.getByRole("definition").nth(4)).toHaveText("15%");
  await level.focus();
  await page.keyboard.press("Home");
  await expect(level).toHaveAttribute("aria-valuetext", "1");
  await expect(speed.getByRole("definition").first()).toHaveText("2,000");
  await expect(shown.getByRole("region", { name: "Turning" })).toBeVisible();
  await expect(shown.getByRole("region", { name: "Boost" })).toBeVisible();
  await expect(
    shown.getByRole("heading", { name: "Research Vortex" }),
  ).toBeVisible();

  // Escape closes it and gives focus back to the card.
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/vehicles$/);
  await expect(details(page, "Vortex")).toHaveCount(0);
  await expect(vortex).toBeFocused();
});

test("GLIDE-4 has no research, and a shared link opens it", async ({
  page,
}) => {
  await open(page, "/vehicles?vehicle=glide-4");
  const shown = details(page, "GLIDE-4");
  await expect(shown).toBeInViewport();
  await expect(shown.getByRole("heading", { name: /^Research/ })).toHaveCount(
    0,
  );
});

test("the Database menu and the palette lead to the vehicles", async ({
  page,
}) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Database", exact: true }).hover();
  await nav.getByRole("link", { name: "Vehicles", exact: true }).click();
  await expect(page).toHaveURL("/vehicles");

  await page.keyboard.press("Control+k");
  await page.keyboard.type("orca");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/vehicles?vehicle=orca");
  await expect(details(page, "Orca")).toBeVisible();
});
