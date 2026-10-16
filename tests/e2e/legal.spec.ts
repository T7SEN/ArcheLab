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
