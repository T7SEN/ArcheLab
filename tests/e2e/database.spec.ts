import { expect, test, type Page } from "@playwright/test";
import { databaseCategories } from "../../src/features/database/database-items";

// The database page (ADR 0034): one search over every item, loaded from a static file
// once someone searches, and a card per category linking its index.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: typing before the search mounts would be lost.
  await page.waitForLoadState("networkidle");
};
const searchBox = (page: Page) =>
  page.getByRole("searchbox", { name: "Search the database" });
const results = (page: Page) =>
  page.getByRole("region", { name: "Search results" });

test("the search finds items across categories and opens one's page", async ({
  page,
}) => {
  const loads: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/database/items") {
      loads.push(request.url());
    }
  });
  await open(page, "/database");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Explore the database",
  );
  await expect(page.getByText(/^Search all [\d,]+ Descendants/)).toBeVisible();
  // The list loads only once someone searches.
  expect(loads).toEqual([]);

  await searchBox(page).fill("cage");
  await expect(page).toHaveURL(/\/database\?q=cage$/);
  await expect(results(page).getByRole("status")).toHaveText(/^\d+ results?$/);
  const storm = results(page).getByRole("link", { name: /^Storm Cage\b/ });
  await expect(storm).toHaveAttribute("href", "/weapons/storm-cage");
  await expect(
    results(page).getByRole("link", { name: /^Thunder Cage\b/ }),
  ).toBeVisible();
  expect(loads).toHaveLength(1);

  await storm.click();
  await expect(page).toHaveURL("/weapons/storm-cage");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Storm Cage",
  );
});

test("a shared search opens with its results, best match first", async ({
  page,
}) => {
  await open(page, "/database?q=raven");
  await expect(searchBox(page)).toHaveValue("raven");
  await expect(results(page).getByRole("link").first()).toHaveAttribute(
    "href",
    "/descendants/raven",
  );

  // Too short, nothing found, and cleared.
  await searchBox(page).fill("r");
  await expect(page.getByText(/^Keep typing/)).toBeVisible();
  await expect(results(page)).toHaveCount(0);
  await searchBox(page).fill("zzzz");
  await expect(results(page).getByRole("status")).toHaveText(
    "Nothing matches “zzzz”",
  );
  await searchBox(page).fill("");
  await expect(page).toHaveURL(/\/database$/);
  await expect(page.getByText(/^Type at least 2 characters/)).toBeVisible();
});

test("a module result opens its details on the modules index", async ({
  page,
}) => {
  await open(page, "/database?q=absolute%20curse");
  const result = results(page).getByRole("link", { name: /^Absolute Curse\b/ });
  await expect(result).toHaveAttribute(
    "href",
    "/modules?module=absolute-curse",
  );
  await result.click();
  await expect(page).toHaveURL("/modules?module=absolute-curse");
  await expect(
    page
      .getByRole("list", { name: "Modules" })
      .getByRole("region", { name: "Absolute Curse", exact: true }),
  ).toBeVisible({ timeout: 10_000 });
});

test("a failed load offers to try again", async ({ page }) => {
  await page.route("**/database/items", (route) => route.abort());
  await open(page, "/database");
  await searchBox(page).fill("cage");
  await expect(
    page.getByText("The database couldn't be loaded."),
  ).toBeVisible();

  await page.unroute("**/database/items");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    results(page).getByRole("link", { name: /^Storm Cage\b/ }),
  ).toBeVisible();
});

test("each category's card links its index and counts its items", async ({
  page,
}) => {
  await open(page, "/database");
  const section = page.getByRole("region", { name: "Browse by category" });
  const cards = section.getByRole("listitem");
  await expect(cards).toHaveCount(databaseCategories.length);
  for (const [index, category] of databaseCategories.entries()) {
    const card = cards.nth(index);
    await expect(card.getByRole("heading", { level: 3 })).toHaveText(
      category.name,
    );
    await expect(card.getByRole("link")).toHaveAttribute("href", category.href);
    await expect(card).toContainText(/\b[1-9][\d,]* [A-Za-z ]+$/);
  }

  await cards.nth(1).getByRole("link").click();
  await expect(page).toHaveURL("/weapons");
});

test("the navbar's Database item opens the database page", async ({ page }) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Database", exact: true }).click();
  await expect(page).toHaveURL("/database");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Explore the database",
  );
});
