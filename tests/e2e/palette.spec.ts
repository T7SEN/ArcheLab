import { expect, test, type Page } from "@playwright/test";

// The command palette (ADR 0022): Ctrl+K or the navbar's search button, the site's
// pages, tools and Descendants everywhere, and the builder's own commands on its page.

const searchName = "Search pages, tools and commands";

/** Waits for hydration, then opens the palette with the keyboard. */
async function openWithShortcut(page: Page) {
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  const search = page.getByRole("combobox", { name: searchName });
  // Hydration can land after the first paint; retry the shortcut until it opens.
  await expect(async () => {
    await page.keyboard.press("Control+k");
    await expect(search).toBeVisible({ timeout: 1000 });
  }).toPass();
  return search;
}

test("Ctrl+K opens it, and a page opens from the keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const search = await openWithShortcut(page);
  await expect(search).toBeFocused();
  await search.fill("privacy");
  await expect(
    page.getByRole("option", { name: "Privacy policy" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/privacy");
  await expect(search).toHaveCount(0);
});

test("the search button opens it and Escape gives focus back", async ({
  page,
}) => {
  await page.goto("/legal");
  const button = page.getByRole("button", { name: "Search" });
  await button.click();
  const search = page.getByRole("combobox", { name: searchName });
  await expect(search).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(search).toHaveCount(0);
  await expect(button).toBeFocused();
});

test("a coming-soon tool shows but can't be picked", async ({ page }) => {
  await page.goto("/");
  const search = await openWithShortcut(page);
  await search.fill("weapon builds");
  await expect(
    page.getByRole("option", { name: /Weapon builds/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("Nothing matches")).toHaveCount(0);
  await search.fill("zzzz");
  await expect(page.getByText("Nothing matches")).toBeVisible();
});

test("a Descendant opens its page", async ({ page }) => {
  await page.goto("/");
  const search = await openWithShortcut(page);
  await search.fill("ultimate bunny");
  await page.getByRole("option", { name: /^Ultimate Bunny/ }).click();
  await expect(page).toHaveURL(/\/descendants\/ultimate-bunny$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Ultimate Bunny",
  );
});

test("a weapon opens its page", async ({ page }) => {
  await page.goto("/");
  const search = await openWithShortcut(page);
  await search.fill("monster hunter");
  await page.getByRole("option", { name: /^Monster Hunter/ }).click();
  await expect(page).toHaveURL(/\/weapons\/monster-hunter$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Monster Hunter",
  );
});

test.describe("on the chat builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/chat");
    await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
  });

  test("its icons insert at the cursor and focus goes back to the message", async ({
    page,
  }) => {
    const editor = page.getByRole("textbox", { name: "Message" });
    await editor.click();
    await page.keyboard.type("hi ");
    const search = await openWithShortcut(page);
    await search.fill("bunny");
    // The builder's icons come first; the site's Descendants follow them.
    await expect(
      page.getByRole("group", { name: "Descendants" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Bunny +22", exact: true }),
    ).toHaveAttribute("data-highlighted", "");
    await page.keyboard.press("Enter");
    await expect(search).toHaveCount(0);
    await expect(editor).toBeFocused();
    await page.keyboard.type("!");
    await page.getByRole("button", { name: "Markup", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "Markup", exact: true }),
    ).toHaveValue('hi <img id="IconBunny1"/>!');
  });

  test("a Descendant's name inserts their portrait, not a character ticket", async ({
    page,
  }) => {
    await page.getByRole("textbox", { name: "Message" }).click();
    const search = await openWithShortcut(page);
    // The registry lists Lepic's ticket before the portrait; the palette doesn't.
    await search.fill("lepic");
    await expect(
      page.getByRole("option", { name: "Lepic +22", exact: true }),
    ).toHaveAttribute("data-highlighted", "");
    await page.keyboard.press("Enter");
    await expect(search).toHaveCount(0);
    await page.getByRole("button", { name: "Markup", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "Markup", exact: true }),
    ).toHaveValue('<img id="IconLepic1"/>');
  });

  test("its actions switch the channel and clear the message", async ({
    page,
  }) => {
    const editor = page.getByRole("textbox", { name: "Message" });
    await editor.click();
    await page.keyboard.type("hello");

    let search = await openWithShortcut(page);
    await search.fill("party chat");
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Party chat" }),
    ).toHaveAttribute("aria-pressed", "true");

    search = await openWithShortcut(page);
    await search.fill("clear message");
    await page.keyboard.press("Enter");
    await expect(editor).toHaveText("");
  });

  test("a style applies to the selected text", async ({ page }) => {
    const editor = page.getByRole("textbox", { name: "Message" });
    await editor.click();
    await page.keyboard.type("hello world");
    for (let step = 0; step < 5; step += 1) {
      await page.keyboard.press("Shift+ArrowLeft");
    }
    const search = await openWithShortcut(page);
    await search.fill("red");
    await page.keyboard.press("Enter");
    await expect(search).toHaveCount(0);
    await page.getByRole("button", { name: "Markup", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "Markup", exact: true }),
    ).toHaveValue("hello <red>world</>");
  });

  test("with an empty message the first row highlighted is one that works", async ({
    page,
  }) => {
    await openWithShortcut(page);
    const highlighted = page.locator('[role="option"][data-highlighted]');
    await expect(highlighted).toHaveText("Open templates");
    await expect(
      page.getByRole("option", { name: "Copy markup" }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});

test("the shortcut works in other keyboard layouts and doesn't flicker when held", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  const search = page.getByRole("combobox", { name: searchName });
  // An Arabic layout: Ctrl and the K key type ن.
  await expect(async () => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ن", code: "KeyK", ctrlKey: true }),
      );
    });
    await expect(search).toBeVisible({ timeout: 1000 });
  }).toPass();
  await page.keyboard.press("Escape");
  await expect(search).toHaveCount(0);

  // Held down: one press, then repeats. It opens once and stays open.
  await page.evaluate(() => {
    for (const repeat of [false, true, true, true]) {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          code: "KeyK",
          ctrlKey: true,
          repeat,
        }),
      );
    }
  });
  await expect(search).toBeVisible();
});

test.describe("on a touch screen", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("tapping the button and a row opens the page", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Search" });
    await expect(button).toBeVisible();
    const search = page.getByRole("combobox", { name: searchName });
    await expect(async () => {
      await button.tap();
      await expect(search).toBeVisible({ timeout: 1000 });
    }).toPass();
    await search.fill("privacy");
    await page.getByRole("option", { name: "Privacy policy" }).tap();
    await expect(page).toHaveURL("/privacy");
    await expect(search).toHaveCount(0);
  });
});

test("with reduced motion it still opens pages", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const search = await openWithShortcut(page);
  await search.fill("terms");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/terms");
});

test("a module opens its details on the modules index", async ({ page }) => {
  await page.goto("/");
  const search = await openWithShortcut(page);
  // The Modules group loads when the palette first opens (ADR 0025).
  await search.fill("multi-trigger rifling");
  await page.getByRole("option", { name: /^Multi-Trigger Rifling/ }).click();
  await expect(page).toHaveURL(/\/modules\?module=multi-trigger-rifling$/);
  await expect(
    page.getByRole("region", { name: "Multi-Trigger Rifling", exact: true }),
  ).toBeVisible();
});
