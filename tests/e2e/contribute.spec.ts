import { expect, test } from "@playwright/test";
import { siteUrl } from "../../src/lib/site-metadata";

// The Help fill in data page (ADR 0028): what players can check in game and send in,
// on GitHub or by email, and the report links on a weapon page whose core slots are
// still unknown.

test("lists the weapons still missing their core slots, each with report links", async ({
  page,
}) => {
  await page.goto("/contribute");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Help fill in data",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteUrl}/contribute`,
  );

  const cores = page.getByRole("region", { name: "Weapon core slots" });
  // Python isn't checked yet; Thunder Cage is (T7SEN, 2026-10-17).
  await expect(
    cores.getByRole("link", { name: "Python", exact: true }),
  ).toHaveAttribute("href", "/weapons/python#core");
  await expect(cores.getByRole("link", { name: "Thunder Cage" })).toHaveCount(
    0,
  );

  const github = cores.getByRole("link", {
    name: "Report on GitHub for Python's core slots (opens in a new tab)",
  });
  const url = new URL((await github.getAttribute("href")) ?? "");
  expect(url.pathname).toBe("/T7SEN/ArcheLab/issues/new");
  expect(url.searchParams.get("template")).toBe("weapon-core-slots.yml");
  expect(url.searchParams.get("weapon")).toBe("Python");
  await expect(github).toHaveAttribute("target", "_blank");
  await expect(
    cores.getByRole("link", { name: "Email it for Python's core slots" }),
  ).toHaveAttribute(
    "href",
    /^mailto:contact@t7sen\.com\?subject=Core%20slots%3A%20Python&body=/,
  );

  const other = page.getByRole("region", { name: "Other open checks" });
  await expect(other).toContainText("Reactor upgrade name");
});

test("the footer links it, and the navbar doesn't", async ({ page }) => {
  await page.goto("/");
  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Help fill in data" }),
  ).toHaveAttribute("href", "/contribute");
  await expect(
    page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Help fill in data" }),
  ).toHaveCount(0);
});

test("a weapon whose core slots are unknown asks players to send them in", async ({
  page,
}) => {
  // The Help page links to the Core slots tab (ADR 0029).
  await page.goto("/weapons/python#core");
  const cores = page.getByRole("tabpanel", { name: "Core slots" });
  await expect(
    cores.getByRole("link", {
      name: "Report on GitHub for Python's core slots (opens in a new tab)",
    }),
  ).toBeVisible();
  await expect(
    cores.getByRole("link", { name: "what else needs checking" }),
  ).toHaveAttribute("href", "/contribute");

  // A checked weapon shows its slots instead.
  await page.goto("/weapons/thunder-cage#core");
  await expect(
    page.getByRole("tabpanel", { name: "Core slots" }).getByRole("list", {
      name: "Slots",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("tabpanel", { name: "Core slots" })
      .getByRole("link", { name: /Report on GitHub/ }),
  ).toHaveCount(0);
});
