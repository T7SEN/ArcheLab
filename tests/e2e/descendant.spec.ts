import { expect, test, type Page } from "@playwright/test";
import { siteUrl } from "../../src/lib/site-metadata";

// The Descendant pages and their index (ADR 0023), from NEXON's metadata at build time,
// like the home page's carousels. Raven's page was the approved example.

const path = "/descendants/raven";

test("Raven's page shows the hero, stats, skills, modules and research", async ({
  page,
}) => {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Raven");
  await expect(
    page.getByRole("img", { name: "Raven's portrait" }),
  ).toHaveAttribute(
    "src",
    /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\//,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteUrl}${path}`,
  );
  // The hero's stat list is named through a group: a `<dl>`'s own name is dropped.
  const atTop = page.getByRole("group", { name: "At level 40", exact: true });
  await expect(atTop.getByRole("term")).toHaveCount(3);
  await expect(atTop.getByRole("term").first()).toHaveText("Max HP");
  await expect(atTop.getByRole("definition")).toHaveCount(3);

  const skills = page.getByRole("region", { name: "Skills" });
  await expect(skills.getByRole("heading", { level: 3 })).toHaveCount(5);
  await expect(
    skills.getByRole("heading", { name: "Queen of Darkness" }),
  ).toBeVisible();

  const modules = page.getByRole("region", { name: "Exclusive modules" });
  await expect(
    modules.getByRole("heading", { name: "Nightfall" }),
  ).toBeVisible();
  await expect(modules.getByText("Transcendent").first()).toBeVisible();
  // Ancestor modules are a tier of their own, not Transcendent (T7SEN, 2026-10-16).
  const resolve = modules
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Shadow's Resolve" }) });
  await expect(
    resolve.getByText("Ancestors", { exact: true }).first(),
  ).toBeVisible();
  await expect(resolve.getByText("Transcendent", { exact: true })).toHaveCount(
    0,
  );
  // Each module's name opens its details on the modules index (ADR 0025).
  await expect(
    modules.getByRole("link", { name: "Nightfall", exact: true }),
  ).toHaveAttribute("href", "/modules?module=nightfall");

  const research = page.getByRole("region", { name: "Research" });
  await expect(
    research.getByRole("heading", { name: "Research Raven" }),
  ).toBeVisible();
  // Research times, in seconds in NEXON's data: 16 hours for Raven, 8 for each part,
  // as T7SEN saw in game (2026-10-17).
  await expect(research.getByText("16 hours", { exact: true })).toBeVisible();
  await expect(research.getByText("8 hours", { exact: true })).toHaveCount(3);
  await research.getByText("How it's researched").first().click();
  await expect(research.getByText("Carbon Crystal")).toBeVisible();
});

test("the level slider changes the stats", async ({ page }) => {
  await page.goto(path);
  const stats = page.getByRole("region", { name: "Stats" });
  // Named once, "Level", with the level as its value text.
  const slider = stats.getByRole("slider", { name: "Level", exact: true });
  await expect(slider).toHaveAttribute("aria-valuetext", "40");
  await expect(stats.getByRole("list", { name: /at level 40$/ })).toBeVisible();
  const maxHp = stats.getByRole("listitem").filter({ hasText: "Max HP" });
  const atForty = await maxHp.innerText();

  await slider.focus();
  await page.keyboard.press("Home");
  await expect(stats.getByRole("list", { name: /at level 1$/ })).toBeVisible();
  await expect(slider).toHaveAttribute("aria-valuetext", "1");
  await expect(maxHp).not.toHaveText(atForty);
});

test("its chat button opens the builder with Raven's icon", async ({
  page,
}) => {
  await page.goto(path);
  await page.getByRole("link", { name: "Use Raven's icon in chat" }).click();
  await expect(page).toHaveURL(/\/tools\/chat$/);
  await expect(page.getByText("Opened a shared message.")).toBeVisible();
  await page.getByRole("button", { name: "Markup", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Markup", exact: true }),
  ).toHaveValue('<img id="IconRaven1"/>');
});

test("attributes show NEXON's icon and Arche types ArcheLab's symbol", async ({
  page,
}) => {
  await page.goto(path);
  const attribute = page.locator("dl").filter({ hasText: "Attribute" }).first();
  await expect(attribute.locator("img").first()).toHaveAttribute(
    "src",
    /^https:\/\/tfdvod\.dn\.nexoncdn\.co\.kr\/img\/cbt\/library\/icons\/icon_elemental--Plain\.png$/,
  );
  // Fusion from NEXON's skills, Singular from T7SEN's in-game check (arche-types.ts).
  const archeTypes = attribute.locator("div").filter({ hasText: "Arche type" });
  await expect(archeTypes.locator("svg")).toHaveCount(2);
  await expect(archeTypes).toContainText("Fusion");
  await expect(archeTypes).toContainText("Singular");
});

test("the Transcendent module switch marks the skills a module names", async ({
  page,
}) => {
  await page.goto(path);
  const skills = page.getByRole("region", { name: "Skills" });
  const switcher = skills.getByRole("combobox", {
    name: "Transcendent module",
  });
  await expect(skills.locator("li[data-changed]")).toHaveCount(0);

  await switcher.click();
  await page.getByRole("option", { name: "Nightfall" }).click();
  await expect(skills.getByText("Nightfall equipped")).toBeVisible();
  const marked = skills.locator("li[data-changed]");
  await expect(marked).toHaveCount(1);
  await expect(marked.getByRole("heading")).toHaveText("Raven Feather");
  await expect(marked.getByText("Changed by Nightfall")).toBeVisible();

  // Its effect names no skill, so nothing is marked, and the panel says so.
  await switcher.click();
  await page.getByRole("option", { name: "Law of the Back Alley" }).click();
  await expect(skills.locator("li[data-changed]")).toHaveCount(0);
  await expect(skills.getByText("Its effect names no skill")).toBeVisible();

  await switcher.click();
  await page.getByRole("option", { name: "None" }).click();
  await expect(skills.getByText(/ equipped$/)).toHaveCount(0);
});

test("section links glide to their section, and jump under reduced motion", async ({
  page,
}) => {
  await page.goto(path);
  const behavior = () =>
    page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
  expect(await behavior()).toBe("smooth");
  await page.getByRole("link", { name: "Skills", exact: true }).click();
  await expect(page).toHaveURL(/#skills$/);
  // It lands just under the floating navbar.
  await expect(async () => {
    const top = await page
      .locator("#skills")
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(80);
  }).toPass();

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await behavior()).toBe("auto");
});

test("an Ultimate's page pairs with its base and compares the stats", async ({
  page,
}) => {
  await page.goto("/descendants/ultimate-bunny");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Ultimate Bunny",
  );
  const pair = page.getByRole("navigation", {
    name: "Bunny and Ultimate Bunny",
  });
  await expect(
    pair.getByRole("link", { name: "Ultimate Bunny" }),
  ).toHaveAttribute("aria-current", "page");
  const stats = page.getByRole("region", { name: "Stats" });
  await expect(stats.getByText(/vs Bunny$/).first()).toBeVisible();
  const modules = page.getByRole("region", { name: "Exclusive modules" });
  await expect(modules.getByText("Ultimate only").first()).toBeVisible();

  await pair.getByRole("link", { name: "Bunny", exact: true }).click();
  await expect(page).toHaveURL(/\/descendants\/bunny$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bunny");
  await expect(
    page.getByRole("region", { name: "Stats" }).getByText(/vs Bunny$/),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("region", { name: "Exclusive modules" })
      .getByText("Ultimate only"),
  ).toHaveCount(0);
});

test("previous and next walk through every Descendant", async ({ page }) => {
  await page.goto(path);
  const next = page
    .getByRole("navigation", { name: "More Descendants" })
    .getByRole("link", { name: /^Next/ });
  await expect(next).toHaveAttribute("rel", "next");
  const href = await next.getAttribute("href");
  await next.click();
  await expect(page).toHaveURL(new RegExp(`${String(href)}$`));
  await page
    .getByRole("navigation", { name: "More Descendants" })
    .getByRole("link", { name: /^Previous/ })
    .click();
  await expect(page).toHaveURL(/\/descendants\/raven$/);
});

test("Back after a section jump returns to the page it left", async ({
  page,
}) => {
  await page.goto(path);
  await page.getByRole("link", { name: "Skills", exact: true }).click();
  await expect(page).toHaveURL(/#skills$/);
  await page
    .getByRole("navigation", { name: "More Descendants" })
    .getByRole("link", { name: /^Next/ })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Raven");
  await page.goBack();
  await expect(page).toHaveURL(/\/descendants\/raven#skills$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Raven");
});

test("a Descendant NEXON doesn't list is a 404", async ({ page }) => {
  const response = await page.goto("/descendants/nobody");
  expect(response?.status()).toBe(404);
});

test.describe("the index", () => {
  /** Opens an index once hydrated: typing before the grid mounts is lost. */
  const open = async (page: Page, url: string) => {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
  };
  const grid = (page: Page) => page.getByRole("list", { name: "Descendants" });
  /** The cards' names, in the order shown. */
  const names = async (page: Page) =>
    (await grid(page).getByRole("link").allInnerTexts()).map(
      (text) => text.split("\n").at(0)?.trim() ?? "",
    );

  test("lists every Descendant and opens their pages", async ({ page }) => {
    await open(page, "/descendants");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Descendants",
    );
    const count = await grid(page).getByRole("listitem").count();
    expect(count).toBeGreaterThan(20);
    await expect(
      page.getByText(`${String(count)} Descendants`, { exact: true }),
    ).toBeVisible();
    await grid(page).getByRole("link", { name: "Raven", exact: true }).click();
    await expect(page).toHaveURL(/\/descendants\/raven$/);
  });

  test("filters narrow the grid and live in the URL", async ({ page }) => {
    await open(page, "/descendants");
    const total = await grid(page).getByRole("listitem").count();
    await page
      .getByRole("group", { name: "Attribute" })
      .getByRole("button", { name: "Electric" })
      .click();
    await expect(page).toHaveURL(/\/descendants\?attribute=Electric$/);
    await expect(
      grid(page).getByRole("link", { name: "Bunny", exact: true }),
    ).toBeVisible();
    await expect(
      grid(page).getByRole("link", { name: "Raven", exact: true }),
    ).toHaveCount(0);

    await page
      .getByRole("group", { name: "Ultimate", exact: true })
      .getByRole("button", { name: "Ultimate", exact: true })
      .click();
    await expect(page).toHaveURL(/\?attribute=Electric&kind=ultimate$/);
    const shown = await names(page);
    expect(shown.length).toBeGreaterThan(0);
    for (const name of shown) {
      expect(name).toMatch(/^Ultimate /);
    }

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/descendants$/);
    await expect(grid(page).getByRole("listitem")).toHaveCount(total);
  });

  test("search and sort, with an empty state", async ({ page }) => {
    await open(page, "/descendants");
    const search = page.getByRole("searchbox", {
      name: "Search Descendants by name",
    });
    await search.fill("bunny");
    await expect(page).toHaveURL(/\?q=bunny$/);
    await expect(grid(page).getByRole("listitem")).toHaveCount(2);
    expect((await names(page)).toSorted()).toEqual(["Bunny", "Ultimate Bunny"]);

    await search.fill("zzzz");
    await expect(
      page.getByText("No Descendant matches these filters."),
    ).toBeVisible();
    await search.fill("");
    await expect(page).toHaveURL(/\/descendants$/);

    await page.getByRole("combobox", { name: "Order" }).click();
    await page.getByRole("option", { name: "A–Z" }).click();
    await expect(page).toHaveURL(/\?sort=az$/);
    const sorted = await names(page);
    expect(sorted).toEqual(sorted.toSorted((a, b) => a.localeCompare(b)));
  });

  test("Raven counts as Singular, as in game", async ({ page }) => {
    await open(page, "/descendants?arche=Singular");
    // Filtered once hydrated: the server's HTML lists every Descendant.
    await expect(
      page
        .getByRole("group", { name: "Arche type" })
        .getByRole("button", { name: "Singular" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/^\d+ of \d+ Descendants$/)).toBeVisible();
    await expect(
      grid(page).getByRole("link", { name: "Raven", exact: true }),
    ).toBeVisible();
  });

  test("a shared link opens filtered, ignoring values it doesn't know", async ({
    page,
  }) => {
    await open(page, "/descendants?kind=ultimate&attribute=Water");
    await expect(
      page
        .getByRole("group", { name: "Ultimate", exact: true })
        .getByRole("button", { name: "Ultimate", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page
        .getByRole("group", { name: "Attribute" })
        .getByRole("button", { name: "All" }),
    ).toHaveAttribute("aria-pressed", "true");
    // A loop over no cards would pass whatever the filter did.
    const seenNames = await names(page);
    expect(seenNames.length).toBeGreaterThan(0);
    for (const name of seenNames) {
      expect(name).toMatch(/^Ultimate /);
    }
  });
});
