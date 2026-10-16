import { expect, test } from "@playwright/test";

// The indexes keep their filters in the URL (ADR 0023, ADR 0024). Safari throws after 100
// history updates in 10 seconds and Firefox ignores them past its limit, which once froze
// the search box, so this spec runs in Chromium, Firefox and WebKit.

for (const [path, name, label, match] of [
  ["/weapons", "Weapons", "Search weapons by name", /^Thunder Cage\b/],
  ["/descendants", "Descendants", "Search Descendants by name", /^Raven$/],
] as const) {
  test(`fast typing on ${path} keeps filtering, and the URL catches up`, async ({
    page,
  }) => {
    await page.goto(path);
    // Hydrated: typing before the grid mounts is lost.
    await page.waitForLoadState("networkidle");
    const search = page.getByRole("searchbox", { name: label });
    test.setTimeout(60_000);
    // 240 edits, well past Safari's 100 history updates in 10 seconds when each
    // edit wrote the URL.
    for (let i = 0; i < 240; i += 1) {
      await search.fill(i % 2 === 0 ? "a" : "");
    }
    const query = path === "/weapons" ? "thunder" : "raven";
    await search.pressSequentially(query);
    await expect(search).toHaveValue(query);
    await expect(
      page.getByRole("list", { name }).getByRole("link", { name: match }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`\\?q=${query}$`));
  });
}

for (const [path, label, query] of [
  ["/weapons", "Search weapons by name", "thunder"],
  ["/descendants", "Search Descendants by name", "raven"],
] as const) {
  test(`a space typed first on ${path} stays in the box and out of the URL`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const search = page.getByRole("searchbox", { name: label });
    await search.pressSequentially(" ");
    // Past the URL's wait: dropping the blank search from the URL once erased it here.
    await page.waitForTimeout(1000);
    await expect(search).toHaveValue(" ");
    expect(new URL(page.url()).search).toBe("");
    // A blank search filters nothing, so there is nothing to clear.
    await expect(
      page.getByRole("button", { name: "Clear filters" }),
    ).toHaveCount(0);
    await search.pressSequentially(query);
    await expect(search).toHaveValue(` ${query}`);
    await expect(page).toHaveURL(new RegExp(`\\?q=\\+${query}$`));
  });
}

test("a link to the same index clears its filters", async ({ page }) => {
  await page.goto("/descendants");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("group", { name: "Attribute" })
    .getByRole("button", { name: "Fire" })
    .click();
  await expect(page).toHaveURL(/\?attribute=Fire$/);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Descendants", exact: true })
    .click();
  await expect(page).toHaveURL(/\/descendants$/);
  await expect(page.getByText(/^\d+ Descendants$/)).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "Attribute" })
      .getByRole("button", { name: "All" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("leaving an index right after a filter works on a slow connection", async ({
  page,
}) => {
  await page.goto("/weapons");
  await page.waitForLoadState("networkidle");
  // Every page-data request takes a while, as on a slow phone: a URL write timed for
  // the index once landed mid-navigation, and the link did nothing.
  await page.route(
    (url) => url.searchParams.has("_rsc"),
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    },
  );
  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Ultimate" })
    .click();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Descendants", exact: true })
    .click();
  await expect(page).toHaveURL(/\/descendants$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Descendants",
  );
  // The filter reached the index's URL before it left, so Back finds it.
  await page.goBack();
  await expect(page).toHaveURL(/\/weapons\?tier=Ultimate$/);
});

test("a filter the URL hasn't caught up with stays on its page", async ({
  page,
}) => {
  await page.goto("/weapons");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Ultimate" })
    .click();
  // Leave at once, before the URL follows, through the navbar.
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Descendants", exact: true })
    .click();
  await expect(page).toHaveURL(/\/descendants$/);
  await expect(
    page
      .getByRole("group", { name: "Ultimate", exact: true })
      .getByRole("button", {
        name: "All",
      }),
  ).toHaveAttribute("aria-pressed", "true");
});
