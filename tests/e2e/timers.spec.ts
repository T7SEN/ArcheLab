import { expect, test, type Page } from "@playwright/test";

// The Timers page (ADR 0054): every time worked out in the browser from one clock. The
// browser runs in UTC and the clock is fixed at Monday 19 October 2026, 12:37 UTC: Wall
// Crasher at 13:00, ETA-0 open until Tuesday 07:00, the weekly reset on Thursday, and
// Resurrected Immortality Obliviant the day's bounty (src/data/timers.ts).

test.use({ timezoneId: "UTC" });

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the page mounts follows the plain link instead.
  await page.waitForLoadState("networkidle");
};

test.describe("at 12:37 UTC", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-19T12:37:00Z"));
  });

  test("Wall Crasher, ETA-0, the resets and Trials", async ({ page }) => {
    await open(page, "/timers");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Timers");

    const wallCrasher = page.locator("#wall-crasher");
    await expect(wallCrasher).toContainText("Next spawn");
    // The clock stands still.
    await expect(wallCrasher).toContainText("23m 00s");
    await expect(wallCrasher).toContainText("13:00 UTC");

    const eta0 = page.locator("#eta-0");
    await expect(eta0).toContainText("Open now");
    await expect(eta0).toContainText("Closes in");
    await expect(eta0).toContainText("18h 23m");
    await expect(page.locator("#daily-reset")).toContainText("18h 23m");
    await expect(page.locator("#weekly-reset")).toContainText("2d 18h 23m");
    await expect(page.locator("#trials")).toContainText("Trials: Protocol 002");
  });

  test("Bounty Operations: today's target and the week", async ({ page }) => {
    await open(page, "/timers");
    const bounty = page.locator("#bounty-operations");
    await expect(bounty).toContainText("Today's target");
    await expect(bounty).toContainText("Resurrected Immortality Obliviant");
    const today = bounty
      .getByRole("list", { name: "Week" })
      .locator('[aria-current="date"]');
    await expect(today).toContainText("Mon");
    await expect(today).toContainText("Fire");
    // A plain visit doesn't scroll.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the rotation pages, each linking its page", async ({ page }) => {
    await open(page, "/timers");
    const rotations = page.locator("#rotations");
    const card = (href: string) => rotations.locator(`a[href="${href}"]`);
    await expect(card("/infiltration-400")).toContainText("Seed Vault");
    await expect(card("/axion-operational-areas")).toContainText("AX Refinery");
    await expect(card("/axion-operational-areas")).toContainText("23m 00s");
    await expect(card("/void-erosion-purge")).toContainText(
      "Amorphous Contamination Zone",
    );
    await expect(card("/difficulty-level-rewards")).toContainText(
      "Provisional",
    );
  });

  test("HQ Special Orders by cycle, rewards linking their pages", async ({
    page,
  }) => {
    await open(page, "/timers");
    const orders = page.locator("#hq-special-orders");
    const cycles = orders.getByRole("group", { name: "Orders" });
    await expect(cycles.getByRole("button", { name: "Now" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(orders).toContainText("Ends in 1d 18h 23m");
    await expect(
      orders.getByRole("link", { name: "Snowy Sled Dog Code" }),
    ).toHaveAttribute("href", "/core-materials?material=snowy-sled-dog-code");

    await cycles.getByRole("button", { name: "Wed 21 Oct" }).click();
    await expect(orders).toContainText("Starts in 1d 18h 23m");
    await expect(orders).toContainText(
      "Complete Infiltration Operations on any difficulty 4 times",
    );
  });

  test("events in tabs, each opening its details", async ({ page }) => {
    await open(page, "/timers");
    const events = page.locator("#events");
    await expect(events).toContainText("13 running");
    await events
      .getByRole("group", { name: "Event type" })
      .getByRole("button", { name: /^Boosts/ })
      .click();
    const rows = events.getByRole("listitem");
    await expect(rows).toHaveCount(3);
    const weekend = rows
      .filter({ hasText: "Descendant's Weekend" })
      .getByRole("button");
    await expect(weekend).toContainText("Next in 3d 18h 23m");
    await expect(weekend).toHaveAttribute("aria-expanded", "false");
    await weekend.click();
    await expect(weekend).toHaveAttribute("aria-expanded", "true");
    await expect(events).toContainText("Every Friday, Saturday and Sunday.");
  });

  test("a bounty target's link opens on the week, the target marked", async ({
    page,
  }) => {
    await open(page, "/timers?bounty=soul-reaper-gruncah");
    const heading = page.getByRole("heading", {
      level: 2,
      name: "Bounty Operations",
    });
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    await expect(
      page
        .getByRole("list", { name: "Week" })
        .getByRole("listitem")
        .filter({ hasText: "Soul Reaper Gruncah" }),
    ).toHaveClass(/ring-2/);
  });

  test("the navbar, the Database page, drop places and the search lead here", async ({
    page,
  }) => {
    await open(page, "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Database", exact: true }).hover();
    await expect(
      nav
        .getByRole("list", { name: "Game info", exact: true })
        .getByRole("link", { name: "Timers" }),
    ).toHaveAttribute("href", "/timers");

    await open(page, "/database");
    await expect(
      page
        .getByRole("region", { name: "Game info", exact: true })
        .locator('a[href="/timers"]'),
    ).toContainText("7 timers");

    // Drop places: a bounty target's, and Wall Crasher's.
    await open(page, "/miscellaneous?item=ancestors-module-loot-e");
    await expect(
      page.locator('a[href="/timers?bounty=hungry-abyss-scarab"]').first(),
    ).toBeVisible();
    await open(page, "/miscellaneous?item=trigger-module-loot-d");
    await expect(
      page.locator('a[href="/timers#wall-crasher"]').first(),
    ).toBeVisible();

    await open(page, "/database?q=wall%20crasher");
    await expect(
      page
        .getByRole("region", { name: "Search results" })
        .locator('a[href="/timers#wall-crasher"]'),
    ).toContainText("Wall Crasher");
  });
});

test("the Wall Crasher alert sends a notice before the spawn", async ({
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
  // Close to the alert: the page re-renders every second, so a long run of fake time
  // takes long in real time.
  await page.clock.install({ time: new Date("2026-10-19T12:54:00Z") });
  await open(page, "/timers");
  const wallCrasher = page.locator("#wall-crasher");
  // 5 minutes before is the default.
  await expect(
    wallCrasher
      .getByRole("group", { name: "Minutes before" })
      .getByRole("button", { name: "5 min before" }),
  ).toHaveAttribute("aria-pressed", "true");
  await wallCrasher.getByRole("button", { name: "Alert off" }).click();
  await expect(
    wallCrasher.getByRole("button", { name: "Alert on" }),
  ).toHaveAttribute("aria-pressed", "true");
  // Past 12:55, five minutes before the 13:00 spawn.
  await page.clock.runFor("01:30");
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { shownNotices: string[] }).shownNotices,
      ),
    )
    .toEqual(["Wall Crasher at 13:00"]);
});
