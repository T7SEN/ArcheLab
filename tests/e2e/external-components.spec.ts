import { expect, test, type Page } from "@playwright/test";
import { siteUrl } from "../../src/lib/site-metadata";

// The external components index (ADR 0027): one card per set, and one per name for the
// components with no set, from NEXON's metadata at build time. A card opens its details
// in the grid, in a row under its own row, and the details load its pieces' levels on
// opening.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the grid mounts follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const grid = (page: Page) =>
  page.getByRole("list", { name: "External Components" });
const card = (page: Page, name: string) =>
  grid(page).getByRole("link", { name: new RegExp(`^${name}\\b`) });
const details = (page: Page, name: string) =>
  grid(page).getByRole("region", { name, exact: true });
const anyDetails = (page: Page) =>
  grid(page)
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Close details" }) });

test("lists every set and every component with no set once", async ({
  page,
}) => {
  await open(page, "/external-components");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "External Components",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteUrl}/external-components`,
  );
  // 36 sets and 3 components with no set on 2026-10-16.
  const count = await grid(page).getByRole("listitem").count();
  expect(count).toBeGreaterThanOrEqual(39);
  await expect(
    page.getByText(`${String(count)} external components`, { exact: true }),
  ).toBeVisible();
  await expect(card(page, "Active Volcano")).toContainText("Set of 4");
  await expect(card(page, "HP Support")).toContainText("4 slots, 3 tiers");
});

test("filters by tier and searches pieces and set effects, in the URL", async ({
  page,
}) => {
  await open(page, "/external-components");
  await page
    .getByRole("group", { name: "Tier" })
    .getByRole("button", { name: "Normal" })
    .click();
  await expect(page).toHaveURL(/\?tier=Normal$/);
  // Only the components with no set come in Normal.
  await expect(card(page, "HP Support")).toBeVisible();
  await expect(card(page, "Active Volcano")).toHaveCount(0);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/external-components$/);

  const search = page.getByRole("searchbox", {
    name: "Search external components",
  });
  await search.fill("volcanic sensor");
  await expect(grid(page).getByRole("listitem")).toHaveCount(1);
  await expect(card(page, "Active Volcano")).toBeVisible();
  await expect(page).toHaveURL(/\?q=volcanic\+sensor$/);
});

test("a set's card opens its set effect, and each piece on its own", async ({
  page,
}) => {
  await open(page, "/external-components");
  const volcano = card(page, "Active Volcano");
  await volcano.click();
  await expect(page).toHaveURL(/\?component=active-volcano$/);
  const shown = details(page, "Active Volcano");
  await expect(
    shown.getByRole("heading", { name: "Active Volcano", level: 2 }),
  ).toBeFocused();

  // In the game's words: "Set Effect", "2 Set", "4 Set".
  const bonuses = shown.getByRole("region", { name: "Set effect" });
  await expect(bonuses.getByRole("term")).toHaveText(["2 Set", "4 Set"]);
  // One tier: no tier switch.
  await expect(shown.getByRole("group", { name: "Tier" })).toHaveCount(0);

  // The pieces to pick from, each with its base stat at the level shown, the first
  // shown on the right.
  const pieces = shown.getByRole("group", { name: "Pieces" });
  await expect(pieces.getByRole("button")).toContainText([
    "Volcanic Auxiliary Power",
    "Volcanic Sensor",
    "Volcanic Memory",
    "Volcanic Processor",
  ]);
  await expect(pieces.getByRole("button", { name: "Sensor" })).toContainText(
    "Max HP",
  );
  await expect(
    shown.getByText("Base stat at level 100", { exact: true }),
  ).toBeVisible();
  await expect(
    pieces.getByRole("button", { name: "Auxiliary Power" }),
  ).toHaveAttribute("aria-pressed", "true");
  const auxiliary = shown.getByRole("region", {
    name: "Volcanic Auxiliary Power",
  });
  // Two in game for the one NEXON lists (T7SEN, 2026-10-17).
  await expect(auxiliary).toContainText("2 core slots");
  await expect(auxiliary.getByRole("term").first()).toHaveText("DEF");
  const slider = auxiliary.getByRole("slider", { name: "Level" });
  await expect(slider).toHaveAttribute("aria-valuetext", "100");

  // What its two core slots take, at the highest core grade first (T7SEN, 2026-10-17):
  // the ranges of a built piece's tooltip, "Max HP X [28.2-37.5]%" and "DEF X
  // [5,625-7,500]".
  const cores = auxiliary.getByRole("region", { name: "Core slots (2)" });
  await expect(cores.getByRole("heading", { level: 5 })).toHaveText([
    "Recovery Augmentation",
    "Defense Augmentation",
  ]);
  await expect(cores.getByRole("button", { name: "Grade 10" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(cores).toContainText("28.2–37.5% [x]");
  await expect(cores).toContainText("5,625–7,500 [+]");
  await cores.getByRole("button", { name: "Grade 1", exact: true }).click();
  await expect(cores).toContainText("423–564 [+]");

  // Possible sub-stats, checked in game by T7SEN (2026-10-17): no provisional mark.
  const auxiliarySubStats = auxiliary.getByRole("region", {
    name: "Possible sub-stats (6)",
  });
  await expect(auxiliarySubStats.getByRole("listitem")).toHaveCount(6);
  await expect(auxiliarySubStats).toContainText("Max HP");
  await expect(auxiliarySubStats).not.toContainText("Provisional");

  // Another piece shows in its place, at the same level.
  await slider.fill("0");
  await expect(
    shown.getByText("Base stat at level 1", { exact: true }),
  ).toBeVisible();
  await pieces.getByRole("button", { name: "Sensor" }).click();
  const sensor = shown.getByRole("region", { name: "Volcanic Sensor" });
  await expect(sensor.getByRole("term").first()).toHaveText("Max HP");
  await expect(sensor.getByRole("slider", { name: "Level" })).toHaveAttribute(
    "aria-valuetext",
    "1",
  );
  await expect(
    sensor.getByRole("region", { name: "Possible sub-stats (6)" }),
  ).toContainText("Max MP");
  await expect(auxiliary).toHaveCount(0);

  await pieces.getByRole("button", { name: "Processor" }).click();
  await expect(
    shown
      .getByRole("region", { name: "Volcanic Processor" })
      .getByRole("region", { name: "Possible sub-stats (8)" })
      .getByRole("listitem"),
  ).toHaveCount(8);

  await page.keyboard.press("Escape");
  await expect(anyDetails(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/external-components$/);
  await expect(volcano).toBeFocused();
});

test("a component with no set switches between its tiers, keeping the piece", async ({
  page,
}) => {
  await open(page, "/external-components?component=hp-support");
  const shown = details(page, "HP Support");
  await expect(shown.getByRole("region", { name: "Set effect" })).toHaveCount(
    0,
  );
  const tiers = shown.getByRole("group", { name: "Tier" });
  await expect(tiers.getByRole("button")).toHaveText([
    "Ultimate",
    "Rare",
    "Normal",
  ]);
  await shown
    .getByRole("group", { name: "Pieces" })
    .getByRole("button", { name: "Sensor" })
    .click();
  const sensor = shown.getByRole("region", { name: "HP Support Sensor" });
  await expect(sensor).toContainText("2 core slots");
  await tiers.getByRole("button", { name: "Rare" }).click();
  await expect(tiers.getByRole("button", { name: "Rare" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // The Rare Sensor: no core slot.
  await expect(sensor).toBeVisible();
  await expect(sensor).not.toContainText("core slot");
  await expect(sensor.getByRole("region", { name: /Core slots/ })).toHaveCount(
    0,
  );
});

test("the tier filter opens a card at that tier", async ({ page }) => {
  await open(page, "/external-components?tier=Rare&component=hp-support");
  await expect(
    details(page, "HP Support")
      .getByRole("group", { name: "Tier" })
      .getByRole("button", { name: "Rare" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("the External Components carousel opens a card and links to the index", async ({
  page,
}) => {
  // Reduced motion keeps the carousel from turning under the pointer.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const first = page
    .getByRole("list", { name: "External Components" })
    .getByRole("link")
    .first();
  await first.click();
  await expect(page).toHaveURL(/\/external-components\?component=[a-z-]+$/);
  await page.goBack();
  await page.getByRole("link", { name: "All external components" }).click();
  await expect(page).toHaveURL(/\/external-components$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "External Components",
  );
});
