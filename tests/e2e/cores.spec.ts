import { expect, test, type Page } from "@playwright/test";

// The Cores index (ADR 0044): a card per kind of core, what goes in Ultimate weapons'
// and external components' slots, with a For filter, a weapon type and a search, and
// each kind's details under its row: what it rolls at grades I to X on each weapon type,
// where each grade drops, and the weapons and external components that take it, linked
// both ways. Names are the game's on 2026-10-18.

const open = async (page: Page, url: string) => {
  await page.goto(url);
  // Hydrated: a click before the cards mount follows the card's plain link instead.
  await page.waitForLoadState("networkidle");
};
const cards = (page: Page) => page.getByRole("list", { name: "Cores" });
const details = (page: Page, name: string) =>
  cards(page).getByRole("region", { name, exact: true });
const count = (page: Page) => page.getByText(/^\d+( of \d+)? cores$/);

test("every kind of core is listed with what it can roll", async ({ page }) => {
  await open(page, "/cores");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cores");
  await expect(count(page)).toHaveText("8 cores");
  const items = cards(page).locator(":scope > li");
  await expect(items).toHaveCount(8);
  await expect(items.first()).toContainText("Firepower Augmentation");
  await expect(items.first()).toContainText("Explosive ATK");
  await expect(items.first()).toContainText(/Fits \d+ Ultimate weapons/);
  await expect(items.last()).toContainText("Defense Augmentation");
  await expect(items.last()).toContainText(
    /Fits \d+ Ultimate external components/,
  );
  await expect(items.first().locator("img")).toHaveAttribute(
    "src",
    /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\/[0-9a-f]{32}$/,
  );
});

test("For and Weapon type keep the cores they take", async ({ page }) => {
  await open(page, "/cores");
  const forGroup = page.getByRole("group", { name: "For" });
  await forGroup.getByRole("button", { name: "External Components" }).click();
  await expect(page).toHaveURL(/\?for=components$/);
  await expect(count(page)).toHaveText("2 of 8 cores");
  await expect(
    cards(page).getByRole("link", { name: /^Recovery Augmentation/ }),
  ).toBeVisible();

  // A weapon type leaves the external components behind: they take none of its cores.
  await page.getByRole("combobox", { name: "Weapon type" }).click();
  await page.getByRole("option", { name: "Launcher", exact: true }).click();
  await expect(page).toHaveURL(/\?type=launcher$/);
  const firepower = cards(page).getByRole("link", {
    name: /^Firepower Augmentation/,
  });
  // What it rolls on a Launcher only.
  await expect(firepower).toContainText("Explosive ATK");
  await expect(firepower).not.toContainText("Firearm ATK");
  await expect(firepower).toContainText("Fits 3 Ultimate weapons");
  await expect(
    cards(page).getByRole("link", { name: /^Recovery Augmentation/ }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/cores$/);
  await expect(count(page)).toHaveText("8 cores");
});

test("a card opens its rolls by grade, drops and weapons, and Escape closes it", async ({
  page,
}) => {
  await open(page, "/cores?core=firepower");
  const shown = details(page, "Firepower Augmentation");
  await expect(shown).toBeInViewport();
  await expect(
    shown.getByRole("heading", { name: "Firepower Augmentation" }),
  ).toBeFocused();
  // Its versions side by side: Launchers and melee weapons roll their own.
  await expect(shown.getByRole("heading", { level: 4 })).toContainText([
    /Assault Rifle/,
    "Launcher",
    /Melee Weapon/,
  ]);
  await expect(shown.getByRole("button", { name: "Grade 10" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(shown).toContainText("What it rolls at grade X");
  await expect(shown).toContainText("Explosive ATK");
  await shown.getByRole("button", { name: "Grade 1", exact: true }).click();
  await expect(shown).toContainText("What it rolls at grade I");
  await expect(shown).toContainText("Where to find grade I");
  await expect(shown).toContainText("[Learning to equip Cores] Quest");

  // Every Ultimate weapon that takes it, linking its page.
  const weapon = shown.getByRole("link", { name: "Sigvore's Proof" });
  await expect(weapon).toHaveAttribute("href", "/weapons/sigvores-proof");
  await expect(weapon.locator("..")).toContainText("Free ×2, Firepower");

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/cores$/);
  await expect(details(page, "Firepower Augmentation")).toHaveCount(0);
  await expect(page.locator("#core-card-firepower")).toBeFocused();
});

test("an external component core links the cards that take it, and back", async ({
  page,
}) => {
  await open(page, "/cores?core=recovery");
  const shown = details(page, "Recovery Augmentation");
  // Under "Applies to", as every core's list of what takes it is headed (T7SEN).
  const applies = shown.getByRole("heading", { name: "Applies to" });
  await expect(applies).toBeVisible();
  await expect(shown.getByText("Sets", { exact: true })).toBeVisible();
  await expect(
    shown.getByText("Components with no set", { exact: true }),
  ).toBeVisible();
  const card = shown.getByRole("link", { name: "Shell Crusher" });
  await expect(card).toHaveAttribute(
    "href",
    "/external-components?tier=Ultimate&component=shell-crusher",
  );
  await card.click();
  await expect(page).toHaveURL(
    "/external-components?tier=Ultimate&component=shell-crusher",
  );

  // The component's core names open their core on the Cores index.
  const core = page
    .getByRole("region", { name: "Core slots (2)" })
    .first()
    .getByRole("link", { name: "Recovery Augmentation" });
  await expect(core).toHaveAttribute("href", "/cores?core=recovery");
  await core.click();
  await expect(details(page, "Recovery Augmentation")).toBeVisible();
});

test("a weapon's core names open what they roll on its type", async ({
  page,
}) => {
  await open(page, "/weapons/sigvores-proof");
  await page.getByRole("tab", { name: "Core slots", exact: true }).click();
  const core = page
    .getByRole("tabpanel", { name: "Core slots" })
    .getByRole("link", { name: "Firepower Augmentation" });
  await expect(core).toHaveAttribute(
    "href",
    "/cores?type=launcher&core=firepower",
  );
  await core.click();
  const shown = details(page, "Firepower Augmentation");
  await expect(shown).toBeVisible();
  await expect(shown).toContainText("Explosive ATK");
  await expect(shown).not.toContainText("Firearm ATK");
});

test("the Database menu and search lead to the cores", async ({ page }) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Database", exact: true }).hover();
  await nav.getByRole("link", { name: "Cores", exact: true }).click();
  await expect(page).toHaveURL("/cores");

  await open(page, "/database?q=explosive%20atk");
  const result = page
    .getByRole("region", { name: "Search results" })
    .locator('a[href="/cores?core=firepower"]');
  await expect(result).toContainText("Firepower Augmentation");
  await result.click();
  await expect(details(page, "Firepower Augmentation")).toBeVisible();
});

// The plain Defense and Recovery cores (ADR 0049, ADR 0050): drop lists open these
// cards, which list them under each grade with where they drop.
test("Defense lists its plain core beside the Variant AB one, its 400% places linked", async ({
  page,
}) => {
  await page.goto("/cores?core=defense");
  await page.waitForLoadState("networkidle");
  const defense = page
    .getByRole("region", { name: /Defense Augmentation/ })
    .first();
  await expect(
    defense.getByRole("heading", { name: "Where to find grade X" }),
  ).toBeVisible();
  await expect(
    defense.getByRole("heading", {
      name: "Defense Augmentation Core (Variant AB) X",
      level: 4,
    }),
  ).toBeVisible();
  await expect(
    defense.getByRole("heading", {
      name: "Defense Augmentation Core X",
      level: 4,
    }),
  ).toBeVisible();
  await expect(
    defense.locator('a[href^="/infiltration-400?operation="]').first(),
  ).toBeVisible();
});
