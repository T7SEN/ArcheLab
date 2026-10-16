import { expect, test } from "@playwright/test";
import { allPages } from "../../src/data/site-pages";
import { siteUrl } from "../../src/lib/site-metadata";

// Launch metadata (ADR 0020): canonical addresses, link previews, icons, robots.txt and
// the sitemap. Absolute URLs point at the public address; the files are fetched from
// the local server by path.

// Every listed page, and one page of each dynamic route.
for (const href of [
  ...allPages.map((page) => page.href),
  "/descendants/raven",
  "/weapons/monster-hunter",
]) {
  test(`${href} has its canonical address and a link preview`, async ({
    page,
    request,
  }) => {
    await page.goto(href);
    const canonical = new URL(href, siteUrl).toString().replace(/\/$/, "");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      canonical,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      canonical,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );

    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(image?.startsWith(`${siteUrl}/`)).toBe(true);
    const imagePath = new URL(image ?? "").pathname;
    // The builder has its own preview; every other page shows the site's.
    expect(imagePath).toBe(
      href === "/tools/chat"
        ? "/tools/chat/opengraph-image"
        : "/opengraph-image",
    );
    const response = await request.get(imagePath);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  });
}

test("every page links the icons", async ({ page, request }) => {
  await page.goto("/");
  for (const [selector, type] of [
    ['link[rel="icon"][type="image/svg+xml"]', "image/svg+xml"],
    ['link[rel="icon"][type="image/x-icon"]', "image/x-icon"],
    ['link[rel="apple-touch-icon"]', "image/png"],
  ] as const) {
    const href = await page.locator(selector).getAttribute("href");
    const response = await request.get(href ?? "");
    expect(response.status(), selector).toBe(200);
    expect(response.headers()["content-type"], selector).toBe(type);
  }
});

test("robots.txt points at a sitemap of every page", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const { href } of allPages) {
    expect(sitemap).toContain(
      `<loc>${new URL(href, siteUrl).toString()}</loc>`,
    );
  }
  // Then every Descendant's and weapon's page, from NEXON's lists (ADR 0023, 0024).
  for (const slug of ["raven", "ultimate-bunny"]) {
    expect(sitemap).toContain(`<loc>${siteUrl}/descendants/${slug}</loc>`);
  }
  for (const slug of ["monster-hunter", "thunder-cage"]) {
    expect(sitemap).toContain(`<loc>${siteUrl}/weapons/${slug}</loc>`);
  }
});
