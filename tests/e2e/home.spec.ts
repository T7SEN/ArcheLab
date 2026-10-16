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

test("picking a Descendant opens the builder with its icon", async ({
  page,
}) => {
  // Reduced motion keeps the carousel from turning under the pointer.
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [name, markup] of [
    ["Bunny", '<img id="IconBunny1"/>'],
    ["Bunny Ultimate", '<img id="Icon_CharacterTicket_004_U01"/>'],
  ] as const) {
    await page.goto("/");
    await page
      .getByRole("link", {
        name: `${name}: start a chat message with this Descendant's icon`,
        // Exact, to keep the two Bunny cards apart.
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/tools\/chat$/);
    await expect(page.getByText("Opened a shared message.")).toBeVisible();
    await page.getByRole("button", { name: "Markup", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "Markup", exact: true }),
    ).toHaveValue(markup);
  }
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
