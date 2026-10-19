import { expect, test, type Page } from "@playwright/test";

// The Axion Operational Areas page (ADR 0052): tfdhub.gg's seven-pair cycle, two hours a
// pair from 2026-10-18 21:00 UTC (src/data). The browser runs in UTC and the clock is
// fixed at Monday 19 October 2026, 09:30 UTC, whose pair is AX Power Converter Station
// and First Crater, 09:00–11:00.

test.use({ timezoneId: "UTC" });

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the page mounts follows the plain link instead.
  await page.waitForLoadState("networkidle");
};

const details = (page: Page, name: string) =>
  page.getByRole("heading", { level: 2, name: new RegExp(`${name}$`) });

test.describe("at 09:30 UTC", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-19T09:30:00Z"));
  });

  test("the two missions active now, the time to the next change and the next two", async ({
    page,
  }) => {
    await open(page, "/axion-operational-areas");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Axion Operational Areas",
    );
    // tfdhub's cycle is a valid source, not provisional (T7SEN, 2026-10-19).
    await expect(page.getByText(/Provisional/)).toHaveCount(0);
    const now = page.getByRole("region", { name: "Active now" });
    await expect(now).toContainText("09:00–11:00");
    await expect(now).toContainText("AX Power Converter Station");
    await expect(now).toContainText("First Crater");
    // The clock stands still.
    await expect(
      page.getByRole("region", { name: "Changes in" }),
    ).toContainText("01:30:00");
    const next = page.getByRole("region", { name: "Next rotation" });
    await expect(next).toContainText("11:00–13:00");
    await expect(next).toContainText("AX Refinery");
    await expect(next).toContainText("Liquefied AX Vault");

    // The first active mission's rewards are open, and a plain visit doesn't scroll.
    await expect(details(page, "AX Power Converter Station")).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("a day's rotations, today and the six days after it", async ({
    page,
  }) => {
    await open(page, "/axion-operational-areas");
    const today = page.getByRole("list", {
      name: "Rotations on Monday 19 October",
    });
    // The one running at midnight, then twelve more.
    const cards = today.locator(":scope > li");
    await expect(cards).toHaveCount(13);
    await expect(cards.first()).toContainText("23:00–01:00");
    await expect(today.locator("[data-active]")).toContainText("Active now");
    await expect(today.locator("[data-active]")).toContainText("09:00–11:00");

    const days = page.getByRole("group", { name: "Day" });
    await expect(days.getByRole("button")).toHaveCount(7);
    await days.getByRole("button", { name: /Tomorrow/ }).click();
    await expect(page).toHaveURL("/axion-operational-areas?day=2026-10-20");
    await expect(
      page.getByRole("list", { name: "Rotations on Tuesday 20 October" }),
    ).toBeVisible();
  });

  test("picking a mission brings its rewards into view", async ({ page }) => {
    await open(page, "/axion-operational-areas");
    await page
      .getByRole("region", { name: "Next rotation" })
      .getByRole("link", { name: /AX Refinery/ })
      .click();
    await expect(page).toHaveURL(
      "/axion-operational-areas?mission=ax-refinery",
    );
    const heading = details(page, "AX Refinery");
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();

    const panel = page.getByRole("region", { name: /AX Refinery$/ });
    await expect(panel).toContainText("Amorphous Material Pattern: Shadow");
    await expect(
      panel.getByRole("link", { name: /^Transcendent 2\.97%/ }),
    ).toHaveAttribute("href", "/weapons?tier=Transcendent");
    // Its next turns, from the one after the active rotation.
    await expect(panel).toContainText("Today 11:00");
  });

  test("a link that names a mission opens on its rewards", async ({ page }) => {
    await open(
      page,
      "/axion-operational-areas?mission=sealed-residential-district",
    );
    const heading = details(page, "Sealed Residential District");
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    await expect(
      page.getByRole("region", { name: /Sealed Residential District$/ }),
    ).toContainText("Amorphous Material Pattern: Ultimate Sharen");
  });

  test("favorites last in this browser and show by the mission", async ({
    page,
  }) => {
    await open(page, "/axion-operational-areas");
    const missions = page.getByRole("region", { name: "Missions" });
    const favorite = missions.getByRole("button", {
      // Chrome puts a space before the screen-reader text's colon.
      name: /^Favorite ?: First Crater$/,
    });
    await expect(favorite).toHaveAttribute("aria-pressed", "false");
    await favorite.click();
    await expect(favorite).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("region", { name: "Active now" }),
    ).toContainText("First Crater, a favorite");

    await open(page, "/axion-operational-areas");
    await expect(
      missions.getByRole("button", { name: /^Favorite ?: First Crater$/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("the navbar, the Database page, drop places, weapons and the search lead to a mission", async ({
    page,
  }) => {
    await open(page, "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Database", exact: true }).hover();
    await expect(
      nav
        .getByRole("list", { name: "Game info", exact: true })
        .getByRole("link", { name: "Axion Operational Areas" }),
    ).toHaveAttribute("href", "/axion-operational-areas");

    await open(page, "/database");
    await expect(
      page
        .getByRole("region", { name: "Game info", exact: true })
        .locator('a[href="/axion-operational-areas"]'),
    ).toContainText("7 missions");

    // A drop place in a mission opens it.
    await open(page, "/miscellaneous?item=collectible-coin");
    await expect(
      page
        .locator('a[href="/axion-operational-areas?mission=first-crater"]')
        .first(),
    ).toBeVisible();

    // A Transcendent weapon's row for the mission.
    await open(page, "/weapons/sparky#obtain");
    await expect(
      page.getByRole("link", { name: "First Crater", exact: true }),
    ).toHaveAttribute("href", "/axion-operational-areas?mission=first-crater");

    await open(page, "/database?q=first%20crater");
    const result = page
      .getByRole("region", { name: "Search results" })
      .locator('a[href="/axion-operational-areas?mission=first-crater"]');
    await expect(result).toContainText("First Crater");
    await result.click();
    await expect(details(page, "First Crater")).toBeFocused();
  });
});

test("an alert sends a notice from the browser when a followed mission's turn starts", async ({
  page,
}) => {
  // A stand-in for the browser's notices that records them, already allowed.
  await page.addInitScript(() => {
    const shown: string[] = [];
    Object.assign(window, { shownNotices: shown });
    // A plain function, so the page can call it with `new`.
    const standIn = Object.assign(
      function StandIn(title: string) {
        shown.push(title);
      },
      {
        permission: "granted",
        requestPermission: () => Promise.resolve("granted"),
      },
    );
    Object.defineProperty(window, "Notification", {
      value: standIn,
      configurable: true,
    });
  });
  await page.clock.install({ time: new Date("2026-10-19T10:59:00Z") });
  await open(page, "/axion-operational-areas");
  await page
    .getByRole("region", { name: "Missions" })
    .getByRole("button", { name: /^Alert ?: AX Refinery$/ })
    .click();
  // Past 11:00, when AX Refinery and Liquefied AX Vault start.
  await page.clock.runFor("02:00");
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { shownNotices: string[] }).shownNotices,
      ),
    )
    .toEqual(["AX Refinery is active"]);
});
