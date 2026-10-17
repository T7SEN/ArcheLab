import { expect, test, type Page } from "@playwright/test";

// The Amorphous Materials index (ADR 0041): the Amorphous Material Patterns in the game
// (T7SEN's list), each with its tier and what it opens into at what chance, a filter by
// what a pattern is for (Descendants, weapons, Fellows, vehicles) and each pattern's
// details under its row. Names are the game's on 2026-10-17.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) =>
  page.getByRole("list", { name: "Amorphous Material Patterns" });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", {
    name: `Amorphous Material Pattern ${name}`,
    exact: true,
  });
const count = (page: Page) => page.getByText(/^\d+( of \d+)? patterns$/);

test("every pattern in the game is listed with its tier, Ultimate first", async ({
  page,
}) => {
  await open(page, "/amorphous-materials");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Amorphous Materials",
  );
  await expect(count(page)).toHaveText(/^\d+ patterns$/);
  const total = Number(
    /\d+/.exec((await count(page).textContent()) ?? "")?.[0],
  );
  // All of them at once: fewer than a batch.
  const items = cards(page).locator(":scope > li");
  await expect(items).toHaveCount(total);
  await expect(items.first()).toContainText("Ultimate");
  await expect(items.first()).toContainText("%");
  await expect(items.last()).toContainText("Rare");
  await expect(items.first().locator("img")).toHaveAttribute(
    "src",
    /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\/[0-9a-f]{32}$/,
  );
  await expect(cards(page).getByRole("link", { name: /^001\b/ })).toHaveCount(
    0,
  );
});

test("For keeps the patterns for Descendants, weapons, Fellows or vehicles", async ({
  page,
}) => {
  await open(page, "/amorphous-materials");
  const forGroup = page.getByRole("group", { name: "For" });
  await forGroup.getByRole("button", { name: "Vehicles" }).click();
  await expect(page).toHaveURL(/\?for=vehicle$/);
  await expect(count(page)).toHaveText(/^\d+ of \d+ patterns$/);
  await expect(
    cards(page).getByRole("link", { name: /^Orca\b/ }),
  ).toBeVisible();
  await expect(cards(page).getByRole("link", { name: /^Bunny\b/ })).toHaveCount(
    0,
  );

  await forGroup.getByRole("button", { name: "Descendants" }).click();
  await expect(page).toHaveURL(/\?for=descendant$/);
  await expect(
    cards(page).getByRole("link", { name: /^Bunny\b/ }),
  ).toBeVisible();
  await expect(cards(page).getByRole("link", { name: /^Orca\b/ })).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/amorphous-materials$/);
});

test("a card opens what the pattern opens into, and Escape closes it", async ({
  page,
}) => {
  await open(page, "/amorphous-materials?pattern=albion-cavalry-gun");
  const shown = details(page, "Albion Cavalry Gun");
  await expect(shown).toBeInViewport();
  await expect(
    shown.getByRole("heading", {
      name: "Amorphous Material Pattern Albion Cavalry Gun",
    }),
  ).toBeFocused();
  await expect(shown.getByText("Ultimate", { exact: true })).toBeVisible();
  await expect(shown.getByText("Drops from")).toBeVisible();
  const rewards = shown.getByRole("listitem").filter({ hasText: "%" });
  await expect(rewards).toHaveCount(5);
  await expect(
    shown
      .getByRole("link", { name: "Albion Cavalry Gun", exact: true })
      .first(),
  ).toHaveAttribute("href", "/weapons/albion-cavalry-gun");

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/amorphous-materials$/);
  await expect(details(page, "Albion Cavalry Gun")).toHaveCount(0);
  await expect(page.locator("#pattern-card-albion-cavalry-gun")).toBeFocused();
});

test("the search finds a pattern by its rewards", async ({ page }) => {
  await open(page, "/amorphous-materials");
  await page
    .getByRole("searchbox", { name: "Search Amorphous Material Patterns" })
    .fill("bunny code");
  await expect(count(page)).toHaveText(/^\d+ of \d+ patterns$/);
  const bunny = cards(page).getByRole("link", { name: /^Bunny\b/ });
  await expect(bunny).toContainText("Rare");
  await expect(bunny).toContainText("100%");
});

test("the Database menu and search lead to the patterns", async ({ page }) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Database", exact: true }).hover();
  await nav
    .getByRole("link", { name: "Amorphous Materials", exact: true })
    .click();
  await expect(page).toHaveURL("/amorphous-materials");

  await open(page, "/database?q=pattern%3A%20bunny");
  const result = page
    .getByRole("region", { name: "Search results" })
    .locator('a[href="/amorphous-materials?pattern=bunny"]');
  await expect(result).toContainText("Amorphous Material Pattern: Bunny");
  await result.click();
  await expect(details(page, "Bunny")).toBeVisible();
});
