import { expect, test } from "@playwright/test";
import { siteUrl } from "../../src/lib/site-metadata";

// The Help fill in data page (ADR 0028): what players can check in game and send in,
// on GitHub or by email. Every Ultimate weapon's core slots are in (ADR 0042), so it
// lists no weapons; the report links' addresses are unit-tested (contribute.test.ts).

test("says every Ultimate weapon's core slots are in, and lists the other checks", async ({
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

  // NEXON's core-slot.json covers all 43 (2026-10-17).
  const cores = page.getByRole("region", { name: "Weapon core slots" });
  await expect(cores).toContainText("Every Ultimate weapon is in. Thank you!");
  await expect(cores.getByRole("link")).toHaveCount(0);

  const other = page.getByRole("region", { name: "Other open checks" });
  await expect(other).toContainText("Reactor upgrade name");
});

test("the footer's Community column links it, and the navbar doesn't", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Community" })
      .getByRole("link", { name: "Help fill in data" }),
  ).toHaveAttribute("href", "/contribute");
  await expect(
    page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Help fill in data" }),
  ).toHaveCount(0);
});

test("a weapon page with its core slots asks for no report", async ({
  page,
}) => {
  // The Help page links to the Core slots tab (ADR 0029).
  await page.goto("/weapons/python#core");
  const cores = page.getByRole("tabpanel", { name: "Core slots" });
  await expect(cores.getByRole("list", { name: "Slots" })).toBeVisible();
  await expect(
    cores.getByRole("link", { name: /Report on GitHub/ }),
  ).toHaveCount(0);
});
