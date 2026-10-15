import { expect, test, type Page } from "@playwright/test";
import {
  iconHeightCaps,
  portraitHeightCaps,
} from "../../src/features/chat/ui/chat-icons";

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

  // The counter rolls its digits; screen readers hear the number through the
  // editor's description.
  await expect(editor).toHaveAccessibleDescription(/^13 \/ 100/);
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

  await expect(markup).toHaveAccessibleDescription(/^120 \/ 100/);
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

test("clear empties the message, and undo brings it back", async ({ page }) => {
  const { editor, markup } = builder(page);
  const clear = page.getByRole("button", { name: "Clear", exact: true });
  await expect(clear).toBeDisabled();

  await editor.click();
  await page.keyboard.type("Hello");
  await clear.click();
  await expect(editor).toHaveText("");
  await expect(editor).toBeFocused();
  await expect(editor).toHaveAccessibleDescription(/^0 \/ 100/);
  await expect(clear).toBeDisabled();

  // The clear is its own undo step, even right after typing.
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor).toHaveText("Hello");
  await openMarkup(page);
  await expect(markup).toHaveValue("Hello");
});

test("the game background switch shows the in-game chat panel", async ({
  page,
}) => {
  const { editor } = builder(page);
  const panel = page.locator("[data-game-background]");
  await expect(panel).toHaveCount(0);

  const toggle = page.getByRole("switch", { name: "Game background" });
  await toggle.click();
  await expect(toggle).toBeChecked();
  // #212321, the chat panel sampled in game (src/data/chat-tags.json).
  await expect(panel).toHaveCSS("background-color", "rgb(33, 35, 33)");
  await expect(panel.getByRole("textbox", { name: "Message" })).toBeVisible();
  await expect(editor).toBeVisible();
});

test("a tooltip opens only after a longer hover", async ({ page }) => {
  const tooltip = page.locator("[data-slot=tooltip-content]");
  await page.getByRole("button", { name: /^Red, <red>/ }).hover();

  // The root layout sets a 700ms delay.
  await page.waitForTimeout(300);
  await expect(tooltip).toHaveCount(0);
  await expect(tooltip).toContainText("<red>");
});

test("every Descendant portrait is offered and inserts its id", async ({
  page,
}) => {
  const { editor, markup } = builder(page);
  // Tested in game (test sheet Part 8, 2026-10-15), so no portrait is marked.
  const ajax = page.getByRole("button", {
    name: /^Ajax icon, adds 21 characters$/,
  });
  await expect(
    page.getByRole("button", { name: /^Bunny icon, adds 22 characters$/ }),
  ).toBeVisible();

  await editor.click();
  await ajax.click();
  await openMarkup(page);
  await expect(markup).toHaveValue('<img id="IconAjax1"/>');
});

test("Caliber and Gold show art from NEXON's site", async ({ page }) => {
  const nexonCdn = /^https:\/\/dszw1qtcnsa5e\.cloudfront\.net\/community\//;
  // Currency sits right below Descendants and starts open.
  await expect(
    page.getByRole("button", { name: /^Currency \(4\)$/ }),
  ).toHaveAttribute("aria-expanded", "true");
  const caliber = page.getByRole("button", {
    name: /^Caliber icon, adds \d+ characters$/,
  });
  await expect(caliber.locator("img")).toHaveAttribute("src", nexonCdn);

  const gold = page.getByRole("button", {
    name: /^Gold icon, adds \d+ characters$/,
  });
  await expect(gold.locator("img")).toHaveAttribute("src", nexonCdn);
});

test("icons sit in their groups", async ({ page }) => {
  // Bosses and missions starts open; Part 10 added the Wall Crasher boss id.
  await expect(
    page.getByRole("button", {
      name: /^Wall Crasher boss icon, adds \d+ characters$/,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^NPCs \(29\)$/ }).click();
  await expect(
    page.getByRole("button", { name: /^NPC 1 icon, adds \d+ characters$/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: /^Damage types \(8\)$/ }).click();
  await expect(
    page.getByRole("button", { name: /^Burst icon, adds \d+ characters$/ }),
  ).toBeVisible();
  // "Toxic" is the Demonic id; the Toxic id showed as text in game (P13).
  await expect(
    page.getByRole("button", { name: /^Toxic icon, adds 19 characters$/ }),
  ).toBeVisible();

  // Added after Part 8 (2026-10-15).
  await page.getByRole("button", { name: /^Other portraits \(7\)$/ }).click();
  await expect(
    page.getByRole("button", { name: /^Anais icon, adds \d+ characters$/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /^Character tickets \(40\)$/ })
    .click();
  await expect(
    page.getByRole("button", {
      // Ticket 001 shows Lepic (test sheet Q8).
      name: /^Lepic character ticket icon, adds 40 characters$/,
    }),
  ).toBeVisible();

  const { editor, markup } = builder(page);
  await editor.click();
  await page
    .getByRole("button", { name: /^Mouse and gamepad buttons \(7\)$/ })
    .click();
  await page
    .getByRole("button", { name: /^Mouse 0 icon, adds 18 characters$/ })
    .click();
  await openMarkup(page);
  await expect(markup).toHaveValue('<img id="Mouse0"/>');
});

test("character tickets show their Descendant's portrait in a gold ring", async ({
  page,
}) => {
  const { editor } = builder(page);
  await editor.click();
  await page
    .getByRole("button", { name: /^Character tickets \(40\)$/ })
    .click();
  // Ticket 004 U01 shows Ultimate Bunny (test sheet Q11).
  const ticket = page.getByRole("button", {
    name: /^Ultimate Bunny character ticket icon/,
  });
  await expect(ticket.locator("img")).toHaveAttribute(
    "src",
    /^https:\/\/open\.api\.nexon\.com\/static\/tfd\/img\//,
  );
  await ticket.click();
  // --ticket-ring, #d9b25f.
  await expect(editor.locator(".chat-icon-ticket img")).toHaveCSS(
    "border-top-color",
    "rgb(217, 178, 95)",
  );
});

test("element icons show NEXON's art under their element names", async ({
  page,
}) => {
  await page.getByRole("button", { name: /^Damage types \(\d+\)$/ }).click();
  const fire = page.getByRole("button", {
    name: /^Fire icon, adds \d+ characters$/,
  });
  await expect(fire.locator("img")).toHaveAttribute(
    "src",
    /^https:\/\/tfdvod\.dn\.nexoncdn\.co\.kr\/img\/cbt\/library\/icons\/icon_elemental--Blazer\.png$/,
  );
  await fire.click();
  await openMarkup(page);
  await expect(builder(page).markup).toHaveValue('<img id="Blazer"/>');
});

test("each channel colors untagged text, Whisper pink and Party blue", async ({
  page,
}) => {
  const { editor } = builder(page);
  await page.getByRole("button", { name: "Whisper chat" }).click();
  await expect(editor).toHaveCSS("color", "rgb(247, 113, 173)");
  await page.getByRole("button", { name: "Party chat" }).click();
  await expect(editor).toHaveCSS("color", "rgb(29, 165, 235)");
});

test("icons in the message take their in-game sizes", async ({ page }) => {
  const { editor } = builder(page);
  await editor.click();
  await page.getByRole("button", { name: /^Bunny icon/ }).click();
  await page.getByRole("button", { name: /^Caliber icon/ }).click();
  // Heights in cap heights of the text: P15 and Q1 (2026-10-15) show 26px icons and
  // 46px portraits beside 12px capitals.
  const caps = await editor.locator(".chat-icon").evaluateAll((icons) =>
    icons.map((icon) => {
      const font = getComputedStyle(icon);
      const probe = document.createElement("span");
      probe.style.display = "block";
      probe.style.height = "1cap";
      probe.style.fontFamily = font.fontFamily;
      probe.style.fontSize = font.fontSize;
      probe.style.fontWeight = font.fontWeight;
      document.body.append(probe);
      const cap = probe.getBoundingClientRect().height;
      probe.remove();
      return icon.getBoundingClientRect().height / cap;
    }),
  );
  expect(caps).toHaveLength(2);
  expect(caps[0]).toBeCloseTo(portraitHeightCaps, 1);
  expect(caps[1]).toBeCloseTo(iconHeightCaps, 1);
  // Portraits are round in game.
  await expect(editor.locator(".chat-icon-portrait img")).toHaveCSS(
    "border-radius",
    "50%",
  );
});
