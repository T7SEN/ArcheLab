import { expect, test, type Page } from "@playwright/test";

// The Mutant Cells index (ADR 0038, ADR 0040): every cell in NEXON's node-item.json,
// checked against the update notes at build, a card each by socket with its icon, drawn
// 20 at a time as the page scrolls, opening its effects in a row under its own.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) => page.getByRole("list", { name: "Mutant Cells" });
const card = (page: Page, name: string) =>
  cards(page).getByRole("link", { name: new RegExp(`^${name}\\b`) });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });

test("every cell is listed, the last ones drawn as the page scrolls", async ({
  page,
}) => {
  await open(page, "/mutant-cells");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Mutant Cells",
  );
  await expect(
    page.getByText("64 Mutant Cells", { exact: true }),
  ).toBeVisible();
  const items = cards(page).locator(":scope > li");
  // 20 at a time, a screen ahead of the reader (`mutantCellBatch`): not all 64 at once.
  await expect(items.first()).toContainText("Activate Thrust");
  await expect(items.first()).toContainText("Almandine");
  expect(await items.count()).toBeLessThan(64);
  // Each card leads with its own icon, from NEXON's image host.
  await expect(items.first().locator("img").first()).toHaveAttribute(
    "src",
    /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\/[0-9a-f]{32}$/,
  );

  await page.keyboard.press("End");
  await expect(items).toHaveCount(64);
  await expect(items.last()).toContainText("Venomous Spike");
});

test("a card opens its effects with their numbers", async ({ page }) => {
  await open(page, "/mutant-cells");
  const tuning = card(page, "Singular Fusion Tuning");
  await tuning.click();
  await expect(page).toHaveURL(/\?cell=singular-fusion-tuning$/);
  await expect(tuning).toHaveAttribute("aria-expanded", "true");
  const shown = details(page, "Singular Fusion Tuning");
  await expect(
    shown.getByRole("heading", { name: "Singular Fusion Tuning", level: 2 }),
  ).toBeFocused();
  await expect(shown.getByText("Cerulean socket")).toBeVisible();
  await expect(shown.getByRole("heading", { level: 3 })).toHaveText([
    "Singular Tuning",
    "Fusion Tuning",
  ]);
  await expect(shown.getByRole("definition")).toHaveText([
    "10s",
    "34.2%[+]",
    "10s",
    "13.5%[+]",
  ]);
  // Nothing on the page is provisional: NEXON's numbers agree with the notes'.
  await expect(page.getByText(/Provisional/)).toHaveCount(0);

  // Escape closes it and gives focus back to the card.
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/mutant-cells$/);
  await expect(details(page, "Singular Fusion Tuning")).toHaveCount(0);
  await expect(tuning).toBeFocused();
});

test("the socket filter and the search narrow the cells", async ({ page }) => {
  await open(page, "/mutant-cells");
  await page
    .getByRole("group", { name: "Socket" })
    .getByRole("button", { name: "Xantic" })
    .click();
  await expect(page).toHaveURL(/\?socket=Xantic$/);
  await expect(page.getByText("14 of 64 Mutant Cells")).toBeVisible();

  await page
    .getByRole("searchbox", { name: "Search Mutant Cells" })
    .fill("clash");
  await expect(cards(page).getByRole("link")).toHaveText([/^Venomous Spike/]);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/mutant-cells$/);
  await expect(
    page.getByText("64 Mutant Cells", { exact: true }),
  ).toBeVisible();
});

test("a cell reads as the game words it", async ({ page }) => {
  await open(page, "/mutant-cells?cell=singular-damage-conversion");
  const shown = details(page, "Singular Damage Conversion");
  await expect(shown.getByRole("heading", { level: 3 })).toHaveText([
    "Basic Info",
  ]);
  await expect(shown.getByRole("definition")).toHaveText([
    "Missing HP Ratio x 32.5%",
    "17.1%",
  ]);
});

test("a shared link opens a cell past the first batch", async ({ page }) => {
  await open(page, "/mutant-cells?cell=venomous-spike");
  const shown = details(page, "Venomous Spike");
  await expect(shown).toBeInViewport();
  await expect(shown.getByRole("definition")).toHaveText(["3s", "12%[+]"]);
});

test("the Database menu and the palette lead to the cells", async ({
  page,
}) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Database", exact: true }).hover();
  await nav.getByRole("link", { name: "Mutant Cells", exact: true }).click();
  await expect(page).toHaveURL("/mutant-cells");

  await page.keyboard.press("Control+k");
  await page.keyboard.type("arche concentration");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/mutant-cells?cell=arche-concentration");
  await expect(details(page, "Arche Concentration")).toBeVisible();
});
