import { expect, test, type Page } from "@playwright/test";

// The Basic Materials index (ADR 0045): the 65 materials of the game's Basic tab, each
// with its tier, what it goes into and where it drops, a tier and a For filter, a search
// and each material's details under its row. Names are the game's on 2026-10-18.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) =>
  page.getByRole("list", { name: "Basic Materials" });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });
const count = (page: Page) => page.getByText(/^\d+( of \d+)? Basic Materials$/);

test("all 65 basic materials are listed, Ultimate first", async ({ page }) => {
  await open(page, "/basic-materials");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Basic Materials",
  );
  await expect(count(page)).toHaveText("65 Basic Materials");
  const items = cards(page).locator(":scope > li");
  await expect(items).toHaveCount(65);
  await expect(items.first()).toContainText("Transcendent Trait Element");
  await expect(items.first()).toContainText("Ultimate");
  await expect(items.last()).toContainText("Repton");
  await expect(items.last()).toContainText("Normal");
  await expect(items.first().locator("img")).toHaveAttribute(
    "src",
    /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\/[0-9a-f]{32}$/,
  );
});

test("Tier and For keep the materials asked for", async ({ page }) => {
  await open(page, "/basic-materials");
  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Ultimate" })
    .click();
  await expect(page).toHaveURL(/\?tier=ultimate$/);
  await expect(count(page)).toHaveText("4 of 65 Basic Materials");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("group", { name: "For" })
    .getByRole("button", { name: "Vehicles" })
    .click();
  await expect(page).toHaveURL(/\?for=vehicle$/);
  await expect(
    cards(page).getByRole("link", { name: /^Silentra\b/ }),
  ).toBeVisible();
  await expect(
    cards(page).getByRole("link", { name: /^Repton\b/ }),
  ).toHaveCount(0);
});

test("a card opens what the material goes into and where it drops", async ({
  page,
}) => {
  await open(page, "/basic-materials?material=archive-shard");
  const shown = details(page, "Archive Shard");
  await expect(shown).toBeInViewport();
  await expect(
    shown.getByRole("heading", { name: "Archive Shard" }),
  ).toBeFocused();
  await expect(shown.getByRole("heading", { name: "Used for" })).toBeVisible();
  await expect(
    shown.getByRole("link", { name: "Ultimate Bunny", exact: true }),
  ).toHaveAttribute("href", "/descendants/ultimate-bunny");
  await expect(
    shown.getByRole("link", { name: "Ion Accelerator", exact: true }),
  ).toHaveAttribute("href", "/enhancement-materials?material=ion-accelerator");
  // Drop places in boxes by shared place, each way its own tag.
  await expect(
    shown.getByRole("heading", { name: "Where to find it" }),
  ).toBeVisible();
  await expect(shown.getByText("[Kingston] [Hard]")).toBeVisible();
  const hardKingston = shown
    .getByRole("listitem")
    .filter({ hasText: /^\[Kingston\] \[Hard\]/ });
  await expect(
    hardKingston.getByRole("listitem").filter({ hasText: /^\[Magister Lab\]/ }),
  ).toHaveText("[Magister Lab] complete Mission Monster");

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/basic-materials$/);
  await expect(details(page, "Archive Shard")).toHaveCount(0);
  await expect(page.locator("#basic-card-archive-shard")).toBeFocused();
});

test("the search finds a material by what it goes into or where it drops", async ({
  page,
}) => {
  await open(page, "/basic-materials");
  const search = page.getByRole("searchbox", {
    name: "Search Basic Materials",
  });
  await search.fill("orca");
  await expect(
    cards(page).getByRole("link", { name: /^Silentra\b/ }),
  ).toBeVisible();
  await search.fill("resource box");
  await expect(
    cards(page).getByRole("link", { name: /^Repton\b/ }),
  ).toBeVisible();
});

test("research recipes and the database search lead to a material", async ({
  page,
}) => {
  await open(page, "/enhancement-materials?material=ion-accelerator");
  const solenoid = page.getByRole("link", { name: "Solenoid", exact: true });
  await expect(solenoid).toHaveAttribute(
    "href",
    "/basic-materials?material=solenoid",
  );
  await solenoid.click();
  await expect(page).toHaveURL("/basic-materials?material=solenoid");
  await expect(details(page, "Solenoid")).toBeVisible();

  await open(page, "/database?q=archive%20shard");
  const result = page
    .getByRole("region", { name: "Search results" })
    .locator('a[href="/basic-materials?material=archive-shard"]');
  await expect(result).toContainText("Archive Shard");
  await result.click();
  await expect(details(page, "Archive Shard")).toBeVisible();
});
