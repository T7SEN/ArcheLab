import { expect, test, type Page } from "@playwright/test";
import { templatesStorageKey } from "../../src/features/chat/ui/personal-templates";

// Personal templates (ADR 0017): saved in this browser's localStorage only.

function builder(page: Page) {
  return {
    // Exact: "Save this message as" would match "Message" too.
    editor: page.getByRole("textbox", { name: "Message", exact: true }),
    markup: page.getByRole("textbox", { name: "Markup", exact: true }),
    openMarkup: () =>
      page.getByRole("button", { name: "Markup", exact: true }).click(),
    openTemplates: () =>
      page.getByRole("button", { name: "Templates", exact: true }).click(),
    sheet: page.getByRole("dialog", { name: "Templates" }),
  };
}

/** Loads the builder and waits for hydration: a click before it is lost. */
async function open(page: Page): Promise<ReturnType<typeof builder>> {
  await page.goto("/tools/chat");
  const parts = builder(page);
  await expect(parts.editor).toBeVisible();
  return parts;
}

async function saveAs(page: Page, name: string): Promise<void> {
  const { sheet } = builder(page);
  await sheet.getByLabel("Save this message as").fill(name);
  await sheet.getByRole("button", { name: /^(Save|Replace)$/ }).click();
}

test("a saved template survives a reload and loads with its channel", async ({
  page,
}) => {
  // Locators are lazy, so they keep working across the reload below.
  const { editor, markup, openMarkup, openTemplates, sheet } = await open(page);
  await openMarkup();
  await markup.fill("<red>Need 2</> for Void Intercept Battle");
  await page.getByRole("button", { name: "Whisper chat" }).click();
  await openTemplates();
  await saveAs(page, "Run call");
  await expect(sheet.getByText('Saved "Run call".')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  await page.reload();
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.type("Mine");
  await openTemplates();
  await sheet
    .getByRole("button", {
      name: "Load Run call, Whisper chat: Need 2 for Void Intercept Battle",
    })
    .click();
  await expect(sheet).toBeHidden();
  await expect(editor).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Whisper chat" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText('Loaded "Run call". Ctrl+Z brings back your message.'),
  ).toBeVisible();
  await openMarkup();
  await expect(markup).toHaveValue("<red>Need 2</> for Void Intercept Battle");

  await editor.press("ControlOrMeta+z");
  await expect(markup).toHaveValue("Mine");
});

test("templates can be renamed, replaced by name, and deleted with undo", async ({
  page,
}) => {
  const { editor, openTemplates, sheet } = await open(page);
  await editor.click();
  await page.keyboard.type("First");
  await openTemplates();
  await saveAs(page, "Alpha");

  await sheet.getByRole("button", { name: "Rename Alpha" }).click();
  await sheet.getByLabel("New name for Alpha").fill("Beta");
  await sheet.getByRole("button", { name: "Rename", exact: true }).click();
  await expect(sheet.getByText('Renamed to "Beta".')).toBeVisible();

  // Saving under an existing name replaces that template.
  await page.keyboard.press("Escape");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Second");
  await openTemplates();
  await sheet.getByLabel("Save this message as").fill("beta");
  await expect(sheet.getByText('Replaces your "Beta" template.')).toBeVisible();
  await sheet.getByRole("button", { name: "Replace" }).click();
  await expect(
    sheet.getByRole("list", { name: "Saved templates" }).getByRole("listitem"),
  ).toHaveCount(1);
  await expect(
    sheet.getByRole("button", { name: /^Load beta, Normal chat: Second$/ }),
  ).toBeVisible();

  await sheet.getByRole("button", { name: "Delete beta" }).click();
  await expect(sheet.getByText("No saved templates yet.")).toBeVisible();
  await sheet.getByRole("button", { name: "Undo" }).click();
  await expect(sheet.getByText('Restored "beta".')).toBeVisible();
  await expect(
    sheet.getByRole("button", { name: /^Load beta,/ }),
  ).toBeVisible();
});

test("stored templates are untrusted text", async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify([
        {
          id: "1",
          name: "<b>Bold</b>",
          markup: "<red>Hi</>",
          channel: "party",
          savedAt: "2026-10-16T00:00:00.000Z",
        },
        { id: "2", name: "Broken", markup: "", channel: "party" },
        "junk",
      ]),
    );
  }, templatesStorageKey);
  const { openTemplates, sheet } = await open(page);
  await openTemplates();
  const list = sheet.getByRole("list", { name: "Saved templates" });
  await expect(list.getByRole("listitem")).toHaveCount(1);
  // The name renders as text, tags and all.
  await expect(list.getByText("<b>Bold</b>")).toBeVisible();
});

test("with storage blocked, templates explain and the builder still works", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
    });
  });
  const { editor, openTemplates, sheet } = await open(page);
  await editor.click();
  await page.keyboard.type("Still works");
  await expect(page.getByRole("button", { name: "Copy markup" })).toBeEnabled();
  await openTemplates();
  await expect(sheet.getByText(/blocks storage here/)).toBeVisible();
  await expect(sheet.getByLabel("Save this message as")).toHaveCount(0);
});
