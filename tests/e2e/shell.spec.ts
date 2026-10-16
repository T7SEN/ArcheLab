import { expect, test } from "@playwright/test";
import { sitePages } from "../../src/data/site-pages";

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

for (const current of sitePages) {
  test(`navbar links every page and marks ${current.href} as current`, async ({
    page,
  }) => {
    await page.goto(current.href);
    const nav = page.getByRole("navigation", { name: "Main" });

    for (const { href, label } of sitePages) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      if (href === current.href) {
        await expect(link).toHaveAttribute("aria-current", "page");
      } else {
        await expect(link).not.toHaveAttribute("aria-current");
      }
    }
  });
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`the navbar's logo links home and ${reducedMotion === "reduce" ? "stays still" : "spins once"} on hover with ${reducedMotion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/tools/chat");
    // Hovering before hydration would start nothing.
    await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
    const logo = page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "ArcheLab", exact: true });
    await expect(logo).toHaveAttribute("href", "/");
    const turning = () =>
      logo.evaluate(
        (link) => link.firstElementChild?.getAnimations().length ?? 0,
      );

    await logo.hover();
    if (reducedMotion === "reduce") {
      await page.waitForTimeout(300);
      expect(await turning()).toBe(0);
    } else {
      await expect.poll(turning).toBe(1);
      // One turn, then it stops.
      await expect.poll(turning, { timeout: 3000 }).toBe(0);
    }
  });
}

test("on a narrow screen the navbar links fold into a menu", async ({
  page,
}) => {
  // Today's two links and the search pill fold at 330px and below (ADR 0022).
  await page.setViewportSize({ width: 260, height: 700 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const toggle = nav.getByRole("button", { name: "Open menu" });

  await toggle.click();
  const builder = nav.getByRole("link", { name: "Chat builder", exact: true });
  await expect(builder).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(builder).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Open menu" })).toBeFocused();

  await nav.getByRole("button", { name: "Open menu" }).click();
  await builder.click();
  await expect(page).toHaveURL("/tools/chat");
  await expect(builder).toHaveCount(0);
});

test("the navbar menu also closes with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Today's two links and the search pill fold at 330px and below (ADR 0022).
  await page.setViewportSize({ width: 260, height: 700 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });

  await nav.getByRole("button", { name: "Open menu" }).click();
  const builder = nav.getByRole("link", { name: "Chat builder", exact: true });
  await expect(builder).toBeVisible();

  await nav.getByRole("button", { name: "Close menu" }).click();
  await expect(builder).toHaveCount(0);
});
