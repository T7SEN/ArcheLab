import { expect, test, type Page } from "@playwright/test";
import { encodeShare } from "../../src/features/chat/engine/share";

// Runs in Chromium, Firefox and WebKit (playwright.config.ts): Phase 3 is accepted when
// share links round-trip across browsers (docs/SPEC.md section 9, ADR 0015).

/** A message using colors, Korean text, bold and an icon. */
const message = '<red>안녕</> <b>hi</> <img id="IconBunny1"/>';

/** Records copied text instead of using the system clipboard, which not every browser lets a test read. */
async function recordClipboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const copied: string[] = [];
    Object.assign(window, { copied });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          copied.push(text);
          return Promise.resolve();
        },
      },
    });
  });
}

function builder(page: Page) {
  return {
    editor: page.getByRole("textbox", { name: "Message" }),
    markup: page.getByRole("textbox", { name: "Markup" }),
    openMarkup: () =>
      page.getByRole("button", { name: "Markup", exact: true }).click(),
  };
}

test("Copy link round-trips the message and its channel", async ({ page }) => {
  await recordClipboard(page);
  await page.goto("/tools/chat");
  const { editor, markup, openMarkup } = builder(page);
  // Hydrated: a click before the editor mounts is lost.
  await expect(editor).toBeVisible();
  const copyLink = page.getByRole("button", { name: "Copy link" });
  await expect(copyLink).toBeDisabled();

  await openMarkup();
  await markup.fill(message);
  await page.getByRole("button", { name: "Whisper chat" }).click();
  await copyLink.click();
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
  const link = await page.evaluate(
    () => (window as unknown as { copied: string[] }).copied.at(-1) ?? "",
  );
  expect(link).toMatch(/\/tools\/chat#m=1[\w-]+&c=whisper$/);

  const opened = await page.context().newPage();
  await opened.goto(link);
  const shared = builder(opened);
  await expect(shared.editor).toBeVisible();
  await expect(opened.getByText("Opened a shared message.")).toBeVisible();
  await expect(
    opened.getByRole("button", { name: "Whisper chat" }),
  ).toHaveAttribute("aria-pressed", "true");
  await shared.openMarkup();
  await expect(shared.markup).toHaveValue(message);
  // The link is used up: a reload must not undo later edits.
  await expect(opened).toHaveURL(/\/tools\/chat$/);
});

test("a link pasted into an open builder opens too", async ({ page }) => {
  await page.goto("/tools/chat");
  const { editor, markup, openMarkup } = builder(page);
  // The editor mounts with the builder's effects, so the hash listener is ready too.
  // Before hydration, Next.js's first history write would drop a hash set this early.
  await expect(editor).toBeVisible();
  await page.evaluate((code) => {
    window.location.hash = `m=${code}&c=party`;
  }, encodeShare("<blue>Party up</>"));
  await expect(page.getByText("Opened a shared message.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Party chat" }),
  ).toHaveAttribute("aria-pressed", "true");
  await openMarkup();
  await expect(markup).toHaveValue("<blue>Party up</>");
});

test("a broken link opens nothing and says so", async ({ page }) => {
  await page.goto("/tools/chat#m=1%25%25&c=party");
  await expect(
    page.getByText(
      "This share link is broken or incomplete, so it opened nothing.",
    ),
  ).toBeVisible();
  await expect(builder(page).editor).toHaveText("");
  await expect(
    page.getByRole("button", { name: "Normal chat" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\/tools\/chat$/);
});

test("an unknown channel keeps the current one", async ({ page }) => {
  await page.goto(`/tools/chat#m=${encodeShare("Hi")}&c=guild`);
  await expect(page.getByText("Opened a shared message.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Normal chat" }),
  ).toHaveAttribute("aria-pressed", "true");
});
