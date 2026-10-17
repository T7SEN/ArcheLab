import { expect, test, type Page } from "@playwright/test";
import { siteUrl } from "../../src/lib/site-metadata";

// The reactors index (ADR 0026): one card per reactor name, from NEXON's metadata at
// build time. A card opens the reactor's details in the grid, in a row under its own
// row, and the details load the reactor's levels on opening.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the grid mounts follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const grid = (page: Page) => page.getByRole("list", { name: "Reactors" });
const card = (page: Page, name: string) =>
  grid(page).getByRole("link", { name: new RegExp(`^${name}\\b`) });
const details = (page: Page, name: string) =>
  grid(page).getByRole("region", { name, exact: true });
const anyDetails = (page: Page) =>
  grid(page)
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Close details" }) });

test("lists every reactor once, with its attribute and Arche type", async ({
  page,
}) => {
  await open(page, "/reactors");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reactors");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteUrl}/reactors`,
  );
  // 20 names in three tiers each on 2026-10-16.
  const count = await grid(page).getByRole("listitem").count();
  expect(count).toBeGreaterThanOrEqual(20);
  await expect(
    page.getByText(`${String(count)} reactors`, { exact: true }),
  ).toBeVisible();
  const phase = card(page, "Burning Phase Reactor");
  await expect(phase).toHaveCount(1);
  await expect(phase).toContainText("Fire");
  await expect(phase).toContainText("Dimension");
});

test("filters by attribute and Arche type, in the URL", async ({ page }) => {
  await open(page, "/reactors");
  await page
    .getByRole("group", { name: "Attribute" })
    .getByRole("button", { name: "Fire" })
    .click();
  await page
    .getByRole("group", { name: "Arche type" })
    .getByRole("button", { name: "Dimension" })
    .click();
  await expect(page).toHaveURL(/\?attribute=Fire&type=Dimension$/);
  await expect(grid(page).getByRole("listitem")).toHaveCount(1);
  await expect(card(page, "Burning Phase Reactor")).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/reactors$/);
});

test("a card opens its details: tiers, levels and the Descendants it suits", async ({
  page,
}) => {
  await open(page, "/reactors");
  const phase = card(page, "Burning Phase Reactor");
  await phase.click();
  await expect(page).toHaveURL(/\?reactor=burning-phase-reactor$/);
  const shown = details(page, "Burning Phase Reactor");
  await expect(
    shown.getByRole("heading", { name: "Burning Phase Reactor", level: 2 }),
  ).toBeFocused();

  // Highest tier first, at its highest level.
  const tiers = shown.getByRole("group", { name: "Tier" });
  await expect(tiers.getByRole("button")).toHaveText([
    "Ultimate",
    "Rare",
    "Normal",
  ]);
  await expect(tiers.getByRole("button", { name: "Ultimate" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const slider = shown.getByRole("slider", { name: "Level" });
  await expect(slider).toHaveAttribute("aria-valuetext", "100");
  const numbers = shown.getByLabel(
    "Burning Phase Reactor, Ultimate at level 100",
  );
  await expect(numbers).toContainText("Skill Power");
  await expect(numbers).toContainText("Sub Attack Power");
  await slider.fill("0");
  await expect(
    shown.getByLabel("Burning Phase Reactor, Ultimate at level 1"),
  ).toBeVisible();

  await tiers.getByRole("button", { name: "Normal" }).click();
  await expect(
    shown.getByLabel("Burning Phase Reactor, Normal at level 100"),
  ).toBeVisible();

  await expect(shown.getByText("Fire Skill Power Boost Ratio")).toBeVisible();
  await expect(
    shown.getByRole("link", { name: "Blair", exact: true }),
  ).toHaveAttribute("href", "/descendants/blair");

  await page.keyboard.press("Escape");
  await expect(anyDetails(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/reactors$/);
  await expect(phase).toBeFocused();
});

test("a Descendant's page lists the reactors that match its skills", async ({
  page,
}) => {
  await page.goto("/descendants/blair");
  // Reactors is one of the page's tabs (ADR 0029).
  await page.getByRole("tab", { name: "Reactors" }).click();
  const reactors = page.getByRole("tabpanel", { name: "Reactors" });
  const phase = reactors.getByRole("link", {
    name: "Burning Phase Reactor",
    exact: true,
  });
  await expect(phase).toHaveAttribute(
    "href",
    "/reactors?reactor=burning-phase-reactor",
  );
  await phase.click();
  await expect(page).toHaveURL(/\/reactors\?reactor=burning-phase-reactor$/);
  await expect(details(page, "Burning Phase Reactor")).toBeVisible();
});

test("Raven's Singular counts for Non-Attribute Singular, like any other Arche type", async ({
  page,
}) => {
  // NEXON lists her skills as Non-Attribute Fusion; T7SEN found she is Singular too
  // (arche-types.ts), and all her skills are Non-Attribute. No page notes how
  // (T7SEN, 2026-10-16).
  await page.goto("/descendants/raven#reactors");
  const reactors = page.getByRole("tabpanel", { name: "Reactors" });
  await expect(
    reactors.getByRole("link", {
      name: "Materialized Singularity Reactor",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Nightfall equipped|with Nightfall/)).toHaveCount(
    0,
  );

  await open(page, "/reactors?reactor=materialized-singularity-reactor");
  await expect(
    details(page, "Materialized Singularity Reactor").getByRole("link", {
      name: "Raven",
      exact: true,
    }),
  ).toHaveAttribute("href", "/descendants/raven");
});
