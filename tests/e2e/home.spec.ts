import { expect, test, type Page } from "@playwright/test";
import { legalPages } from "../../src/data/site-pages";
import { tools } from "../../src/data/tools";

// The home page (ADR 0018): a section per live tool, the coming-soon tools, and
// carousels of NEXON's Descendants and weapons. The carousels need NEXON's metadata
// at build time, like the portraits.

const nexonImage = /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\//;

/** A carousel's page counter, once hydration has measured more than one page. */
async function counterOf(page: Page, title: string) {
  const counter = page
    .getByRole("region", { name: title })
    .locator("span.font-mono");
  await expect(counter).toHaveText(/^1\/([2-9]|\d{2,})$/);
  return counter;
}

test("the tool sections come from the registry", async ({ page }) => {
  await page.goto("/");
  for (const tool of tools) {
    if (tool.status === "live") {
      const section = page.getByRole("region", { name: tool.name });
      await expect(
        section.getByRole("link", { name: tool.cta }),
      ).toHaveAttribute("href", tool.href);
    }
  }
  const comingSoon = page.getByRole("region", { name: "Coming soon" });
  for (const tool of tools) {
    if (tool.status === "coming-soon") {
      await expect(
        comingSoon.getByRole("heading", { level: 3, name: tool.name }),
      ).toBeVisible();
    }
  }
  await page.getByRole("link", { name: "What's coming" }).click();
  await expect(page).toHaveURL(/#coming-soon$/);
});

test("the carousels show NEXON's Descendants and weapons", async ({ page }) => {
  await page.goto("/");
  const descendants = page.getByRole("list", { name: "Descendants" });
  const weapons = page.getByRole("list", { name: "Weapons" });
  expect(await descendants.getByRole("listitem").count()).toBeGreaterThan(4);
  expect(await weapons.getByRole("listitem").count()).toBeGreaterThan(4);
  await expect(descendants.locator("img").first()).toHaveAttribute(
    "src",
    nexonImage,
  );
  await expect(weapons.locator("img").first()).toHaveAttribute(
    "src",
    nexonImage,
  );
  await counterOf(page, "Descendants");
  await counterOf(page, "Weapons");
});

test("picking a Descendant opens their page", async ({ page }) => {
  // Reduced motion keeps the carousel from turning under the pointer.
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [name, path, heading] of [
    ["Bunny", "/descendants/bunny", "Bunny"],
    ["Bunny Ultimate", "/descendants/ultimate-bunny", "Ultimate Bunny"],
  ] as const) {
    await page.goto("/");
    await page
      .getByRole("list", { name: "Descendants" })
      // Named by the card's text, name then badge; exact keeps the two Bunnys apart.
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }
});

test("picking a weapon opens its page", async ({ page }) => {
  // Reduced motion keeps the carousel from turning under the pointer.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const card = page
    .getByRole("list", { name: "Weapons" })
    .getByRole("link")
    .first();
  const name = await card.locator(".font-display").innerText();
  await card.click();
  await expect(page).toHaveURL(/\/weapons\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
});

test("the Weapons carousel links to the index", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "All weapons" }).click();
  await expect(page).toHaveURL(/\/weapons$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Weapons");
});

test("the Descendants carousel links to the index", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "All Descendants" }).click();
  await expect(page).toHaveURL(/\/descendants$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Descendants",
  );
});

test("a carousel turns by hand, on its own, and stays put when paused", async ({
  page,
}) => {
  await page.goto("/");
  await page.mouse.move(0, 0);
  const counter = await counterOf(page, "Descendants");

  // On its own, every few seconds.
  await expect(counter).toHaveText(/^2\//, { timeout: 10_000 });

  await page.getByRole("button", { name: "Next Descendants" }).click();
  await expect(counter).toHaveText(/^3\//);
  await page.getByRole("button", { name: "Pause Descendants" }).click();
  await expect(
    page.getByRole("button", { name: "Play Descendants" }),
  ).toHaveAttribute("aria-pressed", "true");

  // Paused, with the pointer and focus elsewhere, it does not turn.
  await page.locator("h1").click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(8000);
  await expect(counter).toHaveText(/^3\//);
});

test("with reduced motion the carousels only turn by hand", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const counter = await counterOf(page, "Descendants");
  await expect(
    page.getByRole("button", { name: /^(Pause|Play) Descendants$/ }),
  ).toHaveCount(0);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(8000);
  await expect(counter).toHaveText(/^1\//);
  await page.getByRole("button", { name: "Next Descendants" }).click();
  await expect(counter).toHaveText(/^2\//);
});

test("the footer maps the site", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  const toolLinks = footer.getByRole("navigation", { name: "Tools" });
  for (const tool of tools) {
    if (tool.status === "live") {
      await expect(
        toolLinks.getByRole("link", { name: tool.name }),
      ).toHaveAttribute("href", tool.href);
    } else {
      await expect(toolLinks.getByText(tool.name)).toBeVisible();
    }
  }
  await expect(
    footer.getByRole("navigation", { name: "Site" }).getByRole("link"),
  ).not.toHaveCount(0);
  const legal = footer.getByRole("navigation", { name: "Legal" });
  for (const page of legalPages) {
    await expect(legal.getByRole("link", { name: page.label })).toHaveAttribute(
      "href",
      page.href,
    );
  }
});

test("the Modules section lists the tiers and opens each one's modules", async ({
  page,
}) => {
  await page.goto("/");
  const tiers = page.getByRole("list", { name: "Module tiers" });
  // Ancestors and Trigger first, then the rarities (T7SEN, 2026-10-16).
  await expect(tiers.getByRole("link").first()).toContainText("Ancestors");
  await tiers.getByRole("link", { name: /^Trigger/ }).click();
  await expect(page).toHaveURL(/\/modules\?tier=Trigger$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Modules");
});

test("the Reactors carousel opens a reactor and links to the index", async ({
  page,
}) => {
  // Reduced motion keeps the carousel from turning under the pointer.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const card = page
    .getByRole("list", { name: "Reactors" })
    .getByRole("link")
    .first();
  await card.click();
  await expect(page).toHaveURL(/\/reactors\?reactor=[a-z-]+$/);
  await page.goBack();
  await page.getByRole("link", { name: "All reactors" }).click();
  await expect(page).toHaveURL(/\/reactors$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reactors");
});
