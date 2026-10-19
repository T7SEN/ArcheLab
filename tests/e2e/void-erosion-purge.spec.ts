import { expect, test, type Page } from "@playwright/test";

// The Void Erosion Purge page (ADR 0053): tfdhub.gg's five-map cycle for Normal Stage 10,
// a day each from 2026-10-18 07:00 UTC (src/data). The browser runs in UTC and the clock
// is fixed at Monday 19 October 2026, 09:30 UTC, whose map is Amorphous Contamination
// Zone, until 07:00 tomorrow.

test.use({ timezoneId: "UTC" });

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the page mounts follows the plain link instead.
  await page.waitForLoadState("networkidle");
};

const mapHeading = (page: Page, name: string) =>
  page.getByRole("heading", { level: 2, name: new RegExp(`${name}$`) });

test.describe("at 09:30 UTC", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-19T09:30:00Z"));
  });

  test("today's map, the time to the reset and tomorrow's map", async ({
    page,
  }) => {
    await open(page, "/void-erosion-purge");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Void Erosion Purge",
    );
    // tfdhub's cycle is a valid source, not provisional (T7SEN, 2026-10-19).
    await expect(page.getByText(/Provisional/)).toHaveCount(0);
    const today = page.getByRole("region", { name: "Today's map" });
    await expect(today).toContainText("Amorphous Contamination Zone");
    await expect(today).toContainText("Until 07:00");
    // The clock stands still.
    await expect(page.getByRole("region", { name: "Resets in" })).toContainText(
      "21:30:00",
    );
    const tomorrow = page.getByRole("region", { name: "Tomorrow's map" });
    await expect(tomorrow).toContainText("Twisted Ancestors' Facility");
    await expect(tomorrow).toContainText("From 07:00");

    // Today's map and Normal Stage 10's rewards are open, and a plain visit doesn't
    // scroll.
    await expect(
      mapHeading(page, "Amorphous Contamination Zone"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: /^Normal Stage 10/ }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("yesterday, today and the days ahead, and the five-map cycle", async ({
    page,
  }) => {
    await open(page, "/void-erosion-purge");
    const days = page
      .getByRole("list", { name: "Days" })
      .locator(":scope > li");
    await expect(days).toHaveCount(7);
    await expect(days.first()).toContainText("Yesterday");
    await expect(days.first()).toContainText("Eroded Ancestors Ruins");
    await expect(days.first()).toContainText("Ended");
    const today = page.locator("[data-today]");
    await expect(today).toContainText("Today");
    await expect(today).toContainText("Amorphous Contamination Zone");
    await expect(today).toContainText("Active");
    await expect(days.nth(2)).toContainText("Twisted Ancestors' Facility");
    await expect(days.nth(3)).toContainText("Wed 21 Oct");
    await expect(days.nth(3)).toContainText("Eroded Vulgus Reactor");

    const cycle = page
      .getByRole("region", { name: "Five-map cycle" })
      .locator("ol > li");
    await expect(cycle).toHaveCount(5);
    await expect(cycle.first()).toContainText("Eroded Ancestors Ruins");
    await expect(cycle.first()).toContainText("Next Fri 23 Oct");
    await expect(cycle.nth(1)).toContainText("Active");
    await expect(cycle.nth(2)).toContainText("Tomorrow");
  });

  test("picking a map brings it into view, and its picture opens bigger on the page", async ({
    page,
  }) => {
    await open(page, "/void-erosion-purge");
    await page
      .getByRole("list", { name: "Days" })
      .locator(":scope > li")
      .nth(3)
      .getByRole("link")
      .click();
    await expect(page).toHaveURL(
      "/void-erosion-purge?map=eroded-vulgus-reactor",
    );
    const heading = mapHeading(page, "Eroded Vulgus Reactor");
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    const panel = page.getByRole("region", { name: /Eroded Vulgus Reactor$/ });
    await expect(panel).toContainText("Map 4 of 5");
    await expect(panel).toContainText("Wed 21 Oct");

    // In the same tab, over the page (T7SEN, 2026-10-19).
    const enlarge = panel.getByRole("button", {
      // Chrome puts a space before the screen-reader text's colon.
      name: /^Enlarge ?: Eroded Vulgus Reactor$/,
    });
    await enlarge.click();
    const zoom = page.getByRole("dialog", { name: /Eroded Vulgus Reactor$/ });
    await expect(zoom).toBeVisible();
    await expect(
      zoom.getByRole("img", { name: "The map of Eroded Vulgus Reactor" }),
    ).toHaveAttribute(
      "src",
      "/art/void-erosion-purge/eroded-vulgus-reactor.webp",
    );
    await expect(page).toHaveURL(
      "/void-erosion-purge?map=eroded-vulgus-reactor",
    );
    expect(page.context().pages()).toHaveLength(1);
    await page.keyboard.press("Escape");
    await expect(zoom).toHaveCount(0);
    await expect(enlarge).toBeFocused();
  });

  test("each stage's rewards, by difficulty and stage", async ({ page }) => {
    // A link that names a stage opens on its rewards.
    await open(page, "/void-erosion-purge?stage=normal-5");
    const stages = page.getByRole("region", { name: "Stage rewards" });
    const heading = stages.getByRole("heading", { level: 2 });
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    await expect(
      stages.getByRole("heading", { level: 3, name: /^Normal Stage 5/ }),
    ).toBeVisible();
    await expect(
      stages
        .getByRole("group", { name: "Stage", exact: true })
        .getByRole("button", { name: "Stage 5", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(stages).toContainText("Collectible Coin");
    await expect(
      stages.locator('a[href^="/cores?core="]').first(),
    ).toBeVisible();

    // Challenge has five stages; the same stage opens there.
    await stages
      .getByRole("group", { name: "Difficulty" })
      .getByRole("button", { name: "Challenge" })
      .click();
    await expect(page).toHaveURL("/void-erosion-purge?stage=challenge-5");
    await expect(
      stages
        .getByRole("group", { name: "Stage", exact: true })
        .getByRole("button"),
    ).toHaveCount(5);
    await stages
      .getByRole("group", { name: "Stage", exact: true })
      .getByRole("button", { name: "Stage 1", exact: true })
      .click();
    await expect(page).toHaveURL("/void-erosion-purge?stage=challenge-1");
    await expect(
      stages.getByRole("heading", { level: 3, name: /^Challenge Stage 1/ }),
    ).toBeVisible();
    await expect(stages).toContainText("Core Amplifier");
  });

  test("the navbar, the Database page, drop places and the search lead to the page", async ({
    page,
  }) => {
    await open(page, "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Database", exact: true }).hover();
    await expect(
      nav
        .getByRole("list", { name: "Game info", exact: true })
        .getByRole("link", { name: "Void Erosion Purge" }),
    ).toHaveAttribute("href", "/void-erosion-purge");

    await open(page, "/database");
    await expect(
      page
        .getByRole("region", { name: "Game info", exact: true })
        .locator('a[href="/void-erosion-purge"]'),
    ).toContainText("5 maps");

    // A drop place in a stage opens it.
    await open(page, "/cores?core=defense");
    await expect(
      page.locator('a[href="/void-erosion-purge?stage=normal-10"]').first(),
    ).toBeVisible();

    await open(page, "/database?q=eroded%20vulgus%20reactor");
    const result = page
      .getByRole("region", { name: "Search results" })
      .locator('a[href="/void-erosion-purge?map=eroded-vulgus-reactor"]');
    await expect(result).toContainText("Eroded Vulgus Reactor");
    await result.click();
    await expect(mapHeading(page, "Eroded Vulgus Reactor")).toBeFocused();
  });
});

test("an alert sends a notice from the browser when a followed map's day starts", async ({
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
  await page.clock.install({ time: new Date("2026-10-20T06:59:00Z") });
  await open(page, "/void-erosion-purge");
  await page
    .getByRole("region", { name: "Five-map cycle" })
    .getByRole("button", {
      name: /^Alert ?: Twisted Ancestors' Facility$/,
    })
    .click();
  // Past 07:00, when Twisted Ancestors' Facility's day starts.
  await page.clock.runFor("02:00");
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { shownNotices: string[] }).shownNotices,
      ),
    )
    .toEqual(["Twisted Ancestors' Facility is Stage 10's map today"]);
});
