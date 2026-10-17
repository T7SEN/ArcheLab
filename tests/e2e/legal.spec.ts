import { expect, test } from "@playwright/test";
import { contactEmail, legalUpdated } from "../../src/data/legal";
import { legalPages } from "../../src/data/site-pages";
import { templatesStorageKey } from "../../src/features/chat/ui/personal-templates";

// The legal pages (ADR 0021): reached from every footer, each with its date and the
// contact address.

for (const { href, label } of legalPages) {
  test(`${label} opens from the footer with its date and contact`, async ({
    page,
  }) => {
    await page.goto("/tools/chat");
    await page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Legal" })
      .getByRole("link", { name: label })
      .click();
    await expect(page).toHaveURL(href);
    await expect(
      page.getByRole("heading", { level: 1, name: label }),
    ).toBeVisible();
    await expect(page.getByText(`Last updated ${legalUpdated}`)).toBeVisible();
    await expect(
      page.getByRole("link", { name: contactEmail }).first(),
    ).toHaveAttribute("href", `mailto:${contactEmail}`);
  });
}

test("the privacy policy names where templates are stored", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(page.getByText(templatesStorageKey)).toBeVisible();
});

test("the privacy policy says how emailed in-game findings are used", async ({
  page,
}) => {
  // T7SEN, 2026-10-17 (ADR 0028).
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "In-game findings" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "ArcheLab uses your email and screenshot only to check it, and doesn't publish your address.",
      { exact: false },
    ),
  ).toBeVisible();
});
