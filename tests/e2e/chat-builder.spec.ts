import { expect, test, type Page } from "@playwright/test";

function builder(page: Page) {
  return {
    editor: page.getByRole("textbox", { name: "Message" }),
    markup: page.getByRole("textbox", { name: "Markup" }),
    counter: page.getByText(/ of 100 characters\./),
    preview: page.locator(".chat-line"),
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tools/chat");
});

test("the home page links to the builder", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Chat message builder/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Chat message builder" }),
  ).toBeVisible();
});

test("typing and picking a style writes markup", async ({ page }) => {
  const { editor, markup, counter, preview } = builder(page);
  await editor.click();
  await page.keyboard.type("Hello");
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: /^Red, <red>/ }).click();

  await expect(markup).toHaveValue("<red>Hello</>");
  await expect(counter).toContainText("13 of 100 characters. 87 left.");
  await expect(preview).toHaveText("Hello");

  // A new style replaces the old one: runs never hold two.
  await page.keyboard.press("ControlOrMeta+a");
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
  for (let step = 0; step < 10; step += 1) {
    await page.keyboard.press("Tab");
    if (await red.evaluate((button) => button === document.activeElement)) {
      break;
    }
  }
  await expect(red).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(markup).toHaveValue("<red>Hi</>");
  await expect(editor).toBeFocused();
});

test("editing the markup updates the editor and preview", async ({ page }) => {
  const { editor, markup, preview } = builder(page);
  await markup.fill("<blue>Hi</> <b>there</> <zzz>A</>");

  await expect(editor).toHaveText("Hi there <zzz>A</>");
  await expect(editor.locator('[data-chat-style="tag:blue"]')).toHaveText("Hi");
  // Unknown tags show as typed, as in game (T16).
  await expect(preview).toHaveText("Hi there <zzz>A</>");
});

test("icons insert outside any run", async ({ page }) => {
  const { editor, markup } = builder(page);
  await editor.click();
  await page.keyboard.type("go");
  await page.getByRole("button", { name: /^Bunny icon/ }).click();
  await page.keyboard.type("!");
  await expect(markup).toHaveValue('go<img id="IconBunny1"/>!');
});

test("an over-limit message is flagged and cut like the game", async ({
  page,
}) => {
  const { markup, counter, preview } = builder(page);
  await markup.fill("a".repeat(120));

  await expect(counter).toContainText("120 of 100 characters. 20 over");
  await expect(preview).toHaveText("a".repeat(100));
  await expect(page.locator(".ProseMirror .chat-overflow")).toHaveText(
    "a".repeat(20),
  );
});

test("characters the game refuses are removed with a notice", async ({
  page,
}) => {
  const { markup } = builder(page);
  await markup.fill("a🙂b");
  await expect(markup).toHaveValue("ab");
  await expect(
    page.getByText("Removed 🙂: the game refuses this character."),
  ).toBeVisible();
});

test("copy puts the markup on the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const { markup } = builder(page);
  await markup.fill("<default>white</>");
  await page.getByRole("button", { name: "Copy markup" }).click();

  await expect(page.getByText("Markup copied.")).toBeVisible();
  // The optimizer swaps <default> for the shorter, identical <Plain>.
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "<Plain>white</>",
  );
});
