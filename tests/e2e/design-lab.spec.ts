import { expect, test, type Page } from "@playwright/test";

// Temporary: deleted with /design-lab.

async function countAnimatedEffects(page: Page) {
  return page.locator("[data-arche-effect]").evaluateAll(
    (wrappers) =>
      wrappers
        .flatMap((wrapper) => [wrapper, ...wrapper.querySelectorAll("*")])
        .flatMap((element) => [
          getComputedStyle(element),
          getComputedStyle(element, "::before"),
          getComputedStyle(element, "::after"),
        ])
        .filter((style) => style.animationName !== "none").length,
  );
}

test("design lab is hidden from search engines", async ({ page }) => {
  await page.goto("/design-lab");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("each direction animates its Arche effect when motion is allowed", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/design-lab");

  expect(await countAnimatedEffects(page)).toBe(3);
});

test("Arche effects stop under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-lab");

  expect(await countAnimatedEffects(page)).toBe(0);
});
