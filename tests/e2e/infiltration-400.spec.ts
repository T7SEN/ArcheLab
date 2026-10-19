import { expect, test, type Page } from "@playwright/test";

// The 400% Infiltration Operations page (ADR 0049), in tfdhub.gg's layout: today worked
// out in the browser, the reset countdown, the rotation by week and day, the day's two
// operations, and the chosen one's rewards. The clock is fixed at Sunday 18 October 2026,
// 12:00 UTC, whose pair is The Shelter and Caligo Ossuary (the cycle in src/data).

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the page mounts follows the plain link instead.
  await page.waitForLoadState("networkidle");
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-18T12:00:00Z"));
});

const panel = (page: Page, name: RegExp) => page.getByRole("region", { name });

test("today's two operations, and when they reset", async ({ page }) => {
  await open(page, "/infiltration-400");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "400% Infiltration Operations",
  );
  await expect(
    page.getByText("Provisional: not verified in game yet"),
  ).toBeVisible();
  // 19 hours to 07:00 UTC; the clock stands still.
  await expect(page.getByText("Resets in")).toContainText("19:00:00");

  const today = panel(page, /Current rotation/);
  await expect(today).toContainText("The Shelter");
  await expect(today).toContainText("Caligo Ossuary");
  // The day's first is open, and pressed in its day's column.
  await expect(
    page.getByRole("heading", { level: 2, name: /The Shelter$/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Days" }).locator('a[aria-current="true"]'),
  ).toContainText("The Shelter");
});

test("the week tabs and a later day's operation", async ({ page }) => {
  await open(page, "/infiltration-400");
  const weeks = page.getByRole("group", { name: "Week" });
  await expect(weeks.getByRole("button")).toHaveCount(7);
  const week2 = weeks.getByRole("button", { name: /Week 2/ });
  await week2.click();
  await expect(week2).toHaveAttribute("aria-pressed", "true");

  // Week 2 starts a week from today: Sunday 25 October.
  const days = page.getByRole("list", { name: "Days" });
  await days.getByRole("link").first().click();
  await expect(page).toHaveURL(
    /\/infiltration-400\?day=2026-10-25&operation=[a-z-]+$/,
  );
  await expect(panel(page, /^Rotation$/)).toBeVisible();
});

test("an operation's rewards, each linking its page", async ({ page }) => {
  await open(page, "/infiltration-400?operation=the-shelter");
  const shelter = panel(page, /The Shelter$/);
  await expect(
    shelter.getByRole("link", { name: /^Transcendent / }),
  ).toHaveAttribute("href", "/weapons?tier=Transcendent");
  await expect(
    shelter.getByRole("link", { name: "reactor", exact: true }),
  ).toHaveAttribute("href", "/reactors");

  await shelter.getByRole("button", { name: /^Show all \d+ rewards$/ }).click();
  await expect(
    shelter.getByRole("button", { name: "Show fewer" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    shelter.locator('a[href="/miscellaneous?item=collectible-coin"]'),
  ).toContainText("Collectible Coin");
  await expect(
    shelter.locator('a[href="/cores?core=defense"]').first(),
  ).toContainText("Defense Augmentation Core");

  await shelter
    .getByRole("group", { name: "Rewards" })
    .getByRole("button", { name: /^Cores/ })
    .click();
  const tiles = shelter.locator("ul").last().locator(":scope > li");
  await expect(tiles.first()).toContainText("Augmentation Core");
  await expect(
    shelter.locator('a[href="/miscellaneous?item=collectible-coin"]'),
  ).toHaveCount(0);
});

test("weapons, drop places and the database lead to an operation", async ({
  page,
}) => {
  // A Transcendent weapon's Hard 400% mission row.
  await open(page, "/weapons/sparky#obtain");
  const row = page.getByRole("link", { name: "The Shelter - Hard 400%" });
  await expect(row).toHaveAttribute(
    "href",
    "/infiltration-400?operation=the-shelter",
  );
  await expect(
    page.getByRole("link", { name: "Asylum - Hard 400%" }),
  ).toHaveAttribute("href", "/infiltration-400?operation=the-asylum");
  await row.click();
  await expect(page).toHaveURL("/infiltration-400?operation=the-shelter");
  await expect(panel(page, /The Shelter$/)).toBeVisible();

  // A drop place at 400%.
  await open(page, "/miscellaneous?item=collectible-coin");
  await expect(
    page
      .getByRole("region", { name: "Collectible Coin" })
      .getByRole("link", { name: "[The Shelter]" }),
  ).toHaveAttribute("href", "/infiltration-400?operation=the-shelter");

  await open(page, "/database");
  await expect(
    page.getByRole("listitem").filter({
      has: page.getByRole("heading", {
        level: 3,
        name: "400% Infiltration Operations",
      }),
    }),
  ).toContainText("13 operations");
});
