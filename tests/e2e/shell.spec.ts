import { expect, test } from "@playwright/test";

const disclaimer =
  "ArcheLab is a community fan site and is not affiliated with Nexon.";
const attribution = "Data based on NEXON Open API.";

for (const path of ["/", "/tools/chat", "/this-page-does-not-exist"]) {
  test(`footer shows the disclaimer and attribution on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");

    await expect(footer).toContainText(
      "Made with ❤️ by T7SEN. © 2026 ArcheLab",
    );
    await expect(footer).toContainText(disclaimer);
    await expect(footer).toContainText(attribution);
  });
}
