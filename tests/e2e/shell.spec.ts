import { expect, test } from "@playwright/test";

const disclaimer =
  "ArcheLab is an unofficial fan site. It is not affiliated with or endorsed by NEXON. The First Descendant is a trademark of NEXON.";
const attribution = "Data based on NEXON Open API.";

for (const path of ["/", "/this-page-does-not-exist"]) {
  test(`footer shows the disclaimer and attribution on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");

    await expect(footer).toContainText(disclaimer);
    await expect(footer).toContainText(attribution);
  });
}
