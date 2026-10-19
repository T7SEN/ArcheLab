import { expect, test, type Page } from "@playwright/test";

// The Difficulty Level Rewards page (ADR 0048): every battlefield with its reward this
// week and each published week after it, worked out in the browser, the filters by
// reward, and each battlefield's details with what drops there. The clock is fixed in
// the build's own week (Sunday 18 October 2026, rotation 116).

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-18T12:00:00Z"));
});

const cards = (page: Page) => page.locator('a[id^="battlefield-card-"]');

test("every battlefield of the eight regions, with this week's reward", async ({
  page,
}) => {
  await open(page, "/difficulty-level-rewards");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Difficulty Level Rewards",
  );
  await expect(cards(page)).toHaveCount(37);
  await expect(
    page.getByRole("list", { name: "Kingston battlefields" }).getByRole("link"),
  ).not.toHaveCount(0);
  await expect(
    page.getByText("Provisional: not verified in game yet").first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "Week" })
      .getByRole("button", { name: "This week" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("an attribute and Arche type list their battlefields week by week", async ({
  page,
}) => {
  await open(page, "/difficulty-level-rewards");
  await page
    .getByRole("group", { name: "Attribute" })
    .getByRole("button", { name: "Fire" })
    .click();
  await page
    .getByRole("group", { name: "Arche type" })
    .getByRole("button", { name: "Tech" })
    .click();
  await expect(page).toHaveURL(/\?attribute=Fire&type=Tech$/);
  await expect(page.locator('dl[aria-label="Published weeks"]')).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Reactors with this attribute and Arche type",
    }),
  ).toHaveAttribute("href", "/reactors?attribute=Fire&type=Tech");
});

test("a component slot links the external components", async ({ page }) => {
  await open(page, "/difficulty-level-rewards?slot=auxiliary-power");
  await expect(
    page.getByRole("link", { name: "All external components" }).first(),
  ).toHaveAttribute("href", "/external-components");
});

test("a battlefield opens its rewards by week and what drops there", async ({
  page,
}) => {
  await open(page, "/difficulty-level-rewards?battlefield=the-mountaintops");
  const details = page
    .getByRole("region", { name: /The Mountaintops/ })
    .first();
  await expect(details).toBeVisible();
  await expect(
    details.getByRole("heading", { name: "Rewards by week" }),
  ).toBeVisible();
  await expect(
    details.getByRole("heading", { name: "What drops here" }),
  ).toBeVisible();
  const difficulty = details.getByRole("group", { name: "Difficulty" });
  await expect(difficulty.getByRole("button")).toHaveText(["Normal", "Hard"]);
  // Code Breaker drops in its missions and opens its card.
  await expect(
    details.locator('a[href="/miscellaneous?item=code-breaker"]').first(),
  ).toBeVisible();
});

test("reactors, components, Descendants and drop places lead here", async ({
  page,
}) => {
  // A reactor's "Where to get it".
  await open(page, "/reactors?reactor=burning-mechanics-reactor");
  const reactor = page.getByRole("region", {
    name: "Burning Mechanics Reactor",
  });
  await expect(
    reactor.getByRole("link", { name: "Difficulty Level Rewards" }),
  ).toHaveAttribute(
    "href",
    "/difficulty-level-rewards?attribute=Fire&type=Tech",
  );
  await expect(
    reactor.getByRole("link", {
      name: "400% Infiltration Operations, as a Descendant it suits",
    }),
  ).toHaveAttribute("href", "/infiltration-400");

  // An external component piece's slot.
  await open(page, "/external-components?component=active-volcano");
  await expect(
    page.getByRole("link", { name: "Where Auxiliary Power is the reward" }),
  ).toHaveAttribute("href", "/difficulty-level-rewards?slot=auxiliary-power");

  // A Descendant's reactors.
  await open(page, "/descendants/bunny#reactors");
  const where = page
    .getByRole("tabpanel")
    .getByRole("link", { name: "Difficulty Level Rewards" });
  await expect(where).toHaveAttribute(
    "href",
    "/difficulty-level-rewards?descendant=bunny",
  );
  await where.click();
  await expect(page).toHaveURL("/difficulty-level-rewards?descendant=bunny");
  await expect(
    page.getByRole("heading", { name: "Reactors that suit Bunny" }),
  ).toBeVisible();

  // A drop place in a battlefield.
  await open(page, "/miscellaneous?item=code-breaker");
  await expect(
    page
      .getByRole("region", { name: "Code Breaker" })
      .locator('a[href^="/difficulty-level-rewards?battlefield="]')
      .first(),
  ).toBeVisible();
});
