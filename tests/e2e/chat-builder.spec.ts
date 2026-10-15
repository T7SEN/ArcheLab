import { expect, test, type Page } from "@playwright/test";

function builder(page: Page) {
  return {
    editor: page.getByRole("textbox", { name: "Message" }),
    markup: page.getByRole("textbox", { name: "Markup" }),
    copy: page.getByRole("button", { name: /^(Copy markup|Copied)$/ }),
  };
}

/** The markup panel starts collapsed. */
async function openMarkup(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Markup", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tools/chat");
});

test("the home page links to the builder", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open the chat builder" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Chat message builder" }),
  ).toBeVisible();
});

test("typing and picking a style writes markup", async ({ page }) => {
  const { editor, markup } = builder(page);
  await editor.click();
  await page.keyboard.type("Hello");
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: /^Red, <red>/ }).click();

  await expect(page.getByText("13 / 100")).toBeVisible();
  await expect(page.getByText("87 characters left.")).toBeVisible();
  await openMarkup(page);
  await expect(markup).toHaveValue("<red>Hello</>");

  // The selection survives a look at the markup. A new style replaces the old
  // one: runs never hold two.
  await page.getByRole("button", { name: /^Tier 4/ }).click();
  await expect(markup).toHaveValue("<tier4>Hello</>");
});

test("a style can be applied with the keyboard alone", async ({ page }) => {
  const { editor, markup } = builder(page);
  await editor.focus();
  await page.keyboard.type("Hi");
  await page.keyboard.press("Shift+Home");
  // Tab straight on from the editor to the red button, as a keyboard user would.
  const red = page.getByRole("button", { name: /^Red, <red>/ });
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press("Tab");
    if (await red.evaluate((button) => button === document.activeElement)) {
      break;
    }
  }
  await expect(red).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(editor).toBeFocused();
  await openMarkup(page);
  await expect(markup).toHaveValue("<red>Hi</>");
});

test("editing the markup updates the message", async ({ page }) => {
  const { editor, markup } = builder(page);
  await openMarkup(page);
  await markup.fill("<blue>Hi</> <b>there</> <zzz>A</>");

  await expect(editor.locator('[data-chat-style="tag:blue"]')).toHaveText("Hi");
  // Unknown tags show as typed, as in game (T16).
  await expect(editor).toHaveText("Hi there <zzz>A</>");
});

test("icons insert outside any run", async ({ page }) => {
  const { editor, markup } = builder(page);
  await editor.click();
  await page.keyboard.type("go");
  await page.getByRole("button", { name: /^Bunny icon/ }).click();
  await page.keyboard.type("!");
  await openMarkup(page);
  await expect(markup).toHaveValue('go<img id="IconBunny1"/>!');
});

test("search narrows the styles", async ({ page }) => {
  await page
    .getByRole("searchbox", { name: "Search styles and icons" })
    .fill("transcendent");
  await expect(page.getByRole("button", { name: /^Tier 4/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Red, <red>/ })).toHaveCount(
    0,
  );
});

test("an over-limit message is flagged where the game cuts it", async ({
  page,
}) => {
  const { markup } = builder(page);
  await openMarkup(page);
  await markup.fill("a".repeat(120));

  await expect(page.getByText("120 / 100")).toBeVisible();
  await expect(page.getByText(/20 over the limit/)).toBeVisible();
  await expect(page.locator(".ProseMirror .chat-overflow")).toHaveText(
    "a".repeat(20),
  );
});

test("characters the game refuses are removed with a notice", async ({
  page,
}) => {
  const { markup } = builder(page);
  await openMarkup(page);
  await markup.fill("a🙂b");
  await expect(markup).toHaveValue("ab");
  await expect(
    page.getByText("Removed 🙂: the game refuses this character."),
  ).toBeVisible();
});

test("copy puts the markup on the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const { markup, copy } = builder(page);
  await openMarkup(page);
  await markup.fill("<default>white</>");
  await copy.click();

  await expect(copy).toHaveText("Copied");
  // The optimizer swaps <default> for the shorter, identical <Plain>.
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "<Plain>white</>",
  );
});
