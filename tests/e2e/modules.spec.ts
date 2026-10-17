import { expect, test, type Page } from "@playwright/test";
import { siteUrl } from "../../src/lib/site-metadata";

// The modules index (ADR 0025): one card per module name, from NEXON's metadata at build
// time. A card opens the module's details in the grid, in a row under its own row, and
// the details load the module's levels on opening.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the grid mounts follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const grid = (page: Page) => page.getByRole("list", { name: "Modules" });
const card = (page: Page, name: string) =>
  grid(page).getByRole("link", { name: new RegExp(`^${name}\\b`) });
const details = (page: Page, name: string) =>
  grid(page).getByRole("region", { name, exact: true });
/**
 * A card, once drawn: the grid draws 60 cards, then a batch more each time the page
 * nears the last one (ADR 0031), so a card further down needs some scrolling first.
 */
const drawnCard = async (page: Page, name: string) => {
  const found = card(page, name);
  await expect(async () => {
    if ((await found.count()) === 0) {
      await page.evaluate(() => {
        window.scrollBy({ top: 3000, behavior: "instant" });
      });
    }
    expect(await found.count()).toBe(1);
  }).toPass();
  return found;
};
/** The total the index states: "573 modules". */
const statedTotal = async (page: Page) =>
  Number(
    (await page.getByText(/^\d+ modules$/).innerText()).replace(" modules", ""),
  );
/** The details row, whatever module it shows. */
const anyDetails = (page: Page) =>
  grid(page)
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Close details" }) });

test("lists every module by name, with its own address", async ({ page }) => {
  await open(page, "/modules");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Modules");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteUrl}/modules`,
  );
  // 573 names on 2026-10-16; NEXON adds more with updates.
  expect(await statedTotal(page)).toBeGreaterThan(500);
  // Same-name modules share a card: one Multi-Trigger Rifling, with its versions.
  const rifling = await drawnCard(page, "Multi-Trigger Rifling");
  await expect(rifling).toContainText("6 versions");
});

test("draws the cards a batch at a time as the page scrolls", async ({
  page,
}) => {
  // 573 cards at once made the page lag (T7SEN, 2026-10-17; ADR 0031).
  await open(page, "/modules");
  const total = await statedTotal(page);
  const cards = grid(page).getByRole("listitem");
  await expect(cards).toHaveCount(60);
  // Scrolling on draws them all, and the loading strip goes.
  await expect(async () => {
    await page.evaluate(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      });
    });
    expect(await cards.count()).toBe(total);
  }).toPass({ timeout: 20_000 });
  await expect(page.getByText(/^Showing \d+ of \d+ modules/)).toHaveCount(0);

  // A filter starts again from one batch.
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Rare" })
    .click();
  await expect(page.getByText(/^\d+ of \d+ modules$/)).toBeVisible();
  await expect(cards).toHaveCount(60);
});

test("a shared link to a card far down draws through it, and keeps it drawn", async ({
  page,
}) => {
  await open(page, "/modules");
  const slugs = await grid(page)
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) =>
        new URL((link as HTMLAnchorElement).href).searchParams.get("module"),
      ),
    );
  expect(slugs).toHaveLength(60);
  // The 61st card or later: scroll once to draw the next batch, and take one from it.
  await page.evaluate(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    });
  });
  await expect(grid(page).getByRole("link")).not.toHaveCount(60);
  const far = await grid(page)
    .getByRole("link")
    .nth(100)
    .evaluate((link) =>
      new URL((link as HTMLAnchorElement).href).searchParams.get("module"),
    );

  await open(page, `/modules?module=${String(far)}`);
  // The details scroll into view once the cards above them have their heights.
  await expect(anyDetails(page)).toBeInViewport({ timeout: 10_000 });
  // Cards only: the details hold links of their own ("Equipped by").
  const cards = grid(page)
    .getByRole("listitem")
    .filter({ hasNot: page.getByRole("button", { name: "Close details" }) });
  const drawn = await cards.count();
  expect(drawn).toBeGreaterThan(100);
  await anyDetails(page).getByRole("button", { name: "Close details" }).click();
  await expect(anyDetails(page)).toHaveCount(0);
  // Closing doesn't undraw the cards above the reader.
  expect(await cards.count()).toBeGreaterThanOrEqual(drawn);
});

test("Ancestors and Trigger are tiers of their own, first in the order", async ({
  page,
}) => {
  await open(page, "/modules");
  const tiers = page.getByRole("group", { name: "Tier" }).getByRole("button");
  // T7SEN, 2026-10-16: tiers of their own, before the four rarities.
  await expect(tiers).toHaveText([
    "All",
    "Ancestors",
    "Trigger",
    "Transcendent",
    "Ultimate",
    "Rare",
    "Normal",
  ]);
  await expect(grid(page).getByRole("link").first()).toContainText("Ancestors");

  await tiers.filter({ hasText: "Trigger" }).click();
  await expect(page).toHaveURL(/\?tier=Trigger$/);
  const leak = await drawnCard(page, "Arche Leak");
  await expect(leak).toContainText("Trigger");
  await expect(leak).not.toContainText("Ultimate");
});

test("a card opens its details under its row, and Escape closes them", async ({
  page,
}) => {
  await open(page, "/modules");
  const rifling = await drawnCard(page, "Multi-Trigger Rifling");
  await rifling.click();
  await expect(page).toHaveURL(/\?module=multi-trigger-rifling$/);
  await expect(rifling).toHaveAttribute("aria-expanded", "true");
  const shown = details(page, "Multi-Trigger Rifling");
  await expect(shown).toBeVisible();
  // Opening focuses the module's name, not the first control in the details.
  await expect(
    shown.getByRole("heading", { name: "Multi-Trigger Rifling", level: 2 }),
  ).toBeFocused();

  // The row: the card before it shares the opened card's row, the next starts below.
  const layout = await grid(page).evaluate((list, name) => {
    const items = [...list.children];
    const at = items.findIndex(
      (item) => item.querySelector("section") !== null,
    );
    const opened = items.findIndex((item) => item.textContent.startsWith(name));
    const rect = (index: number) =>
      index < 0 ? undefined : items.at(index)?.getBoundingClientRect();
    return {
      at,
      before: rect(at - 1)?.top,
      opened: rect(opened)?.top,
      detailsBottom: rect(at)?.bottom,
      after: rect(at + 1)?.top,
    };
  }, "Multi-Trigger Rifling");
  expect(layout.at).toBeGreaterThan(0);
  expect(layout.before).toBe(layout.opened);
  expect(layout.after).toBeGreaterThanOrEqual(layout.detailsBottom ?? Infinity);

  // The levels load from the module's data file; the slider starts at the top level.
  const slider = shown.getByRole("slider", { name: "Level" });
  await expect(slider).toHaveAttribute("aria-valuetext", "10");
  await expect(
    shown.getByRole("group", { name: "Multi-Trigger Rifling at level 10" }),
  ).toContainText("Multi-Hit Chance");
  await slider.fill("0");
  await expect(
    shown.getByRole("group", { name: "Multi-Trigger Rifling at level 0" }),
  ).toBeVisible();

  // Each version has its own facts.
  const versions = shown.getByRole("group", { name: "6 versions" });
  await expect(versions.getByRole("button")).toHaveCount(6);
  await versions
    .getByRole("button", { name: "High-Power Rounds · Sniper Rifle" })
    .click();
  await expect(shown.getByText("Sniper Rifle", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(anyDetails(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/modules$/);
  // Focus goes back to the card that opened them.
  await expect(rifling).toBeFocused();
  await expect(rifling).toHaveAttribute("aria-expanded", "false");
});

test("clicking an open card again closes its details", async ({ page }) => {
  await open(page, "/modules");
  const rifling = await drawnCard(page, "Multi-Trigger Rifling");
  await rifling.click();
  await expect(details(page, "Multi-Trigger Rifling")).toBeVisible();
  await rifling.click();
  await expect(anyDetails(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/modules$/);

  await rifling.click();
  await anyDetails(page).getByRole("button", { name: "Close details" }).click();
  await expect(anyDetails(page)).toHaveCount(0);
});

test("a shared link opens a Trigger module's table of effects in view", async ({
  page,
}) => {
  await open(page, "/modules?module=arche-leak");
  const shown = details(page, "Arche Leak");
  await expect(shown).toBeInViewport();
  // Trigger modules take no capacity and have one level, so there is no slider.
  await expect(shown.getByRole("slider")).toHaveCount(0);
  await expect(shown.getByText("Capacity", { exact: true })).toHaveCount(0);
  await expect(
    shown.getByRole("heading", { name: "Basic Info" }),
  ).toBeVisible();
  await expect(
    shown.getByRole("term").filter({ hasText: "Cooldown" }),
  ).toBeVisible();
});

test("filters narrow the grid and live in the URL", async ({ page }) => {
  await open(page, "/modules");
  await page
    .getByRole("group", { name: "Class" })
    .getByRole("button", { name: "Melee Weapon" })
    .click();
  await expect(page).toHaveURL(/\?class=Melee\+Weapon$/);
  await expect(page.getByText(/^\d+ of \d+ modules$/)).toBeVisible();
  // Melee modules share names with firearm ones; the card stays, and its details open
  // on the melee version.
  await (await drawnCard(page, "Heat Incinerator")).click();
  await expect(
    details(page, "Heat Incinerator")
      .getByRole("button", { name: "Melee Weapon · Impact Rounds" })
      .first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/modules$/);
});

test("a Descendant's module links to their page, and Back reopens it", async ({
  page,
}) => {
  await open(page, "/modules?owner=raven");
  await expect(page.getByText(/^\d+ of \d+ modules$/)).toBeVisible();
  const first = grid(page).getByRole("link").first();
  const name = (await first.locator(".font-display").textContent()) ?? "";
  await first.click();
  await details(page, name)
    .getByRole("link", { name: "Raven", exact: true })
    .click();
  await expect(page).toHaveURL(/\/descendants\/raven$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/modules\?owner=raven&module=/);
  await expect(details(page, name)).toBeVisible();
});

test("an unknown module or filter in a link is ignored", async ({ page }) => {
  await open(page, "/modules?module=no-such-module&class=Arrows");
  await expect(anyDetails(page)).toHaveCount(0);
  // Every module, unfiltered.
  expect(await statedTotal(page)).toBeGreaterThan(500);
});

test("no page prefetches the modules index's data", async ({ page }) => {
  // It is about 35 KB compressed and 368 KB to parse, so the navbar, the footer and the
  // home page link to it without prefetching (ADR 0025).
  const prefetched: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/modules" && url.searchParams.has("_rsc")) {
      prefetched.push(url.href);
    }
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForLoadState("networkidle");
  expect(prefetched).toEqual([]);
});
