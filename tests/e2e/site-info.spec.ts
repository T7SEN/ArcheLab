import { expect, test } from "@playwright/test";
import {
  changelog,
  changelogDate,
  changelogGroupId,
} from "../../src/data/changelog";

// The About, Changelog and Feedback pages (ADR 0036), reached from the footer's
// Community column.

test("About says what the site is and links on to its pages", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("contentinfo")
    .getByRole("navigation", { name: "Community" })
    .getByRole("link", { name: "About" })
    .click();
  await expect(page).toHaveURL("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "About ArcheLab",
  );
  const sections = page.getByRole("navigation", { name: "On this page" });
  await expect(sections.getByRole("link")).toHaveCount(6);
  await sections.getByRole("link", { name: "Your privacy" }).click();
  await expect(page).toHaveURL("/about#privacy");
  await expect(
    page.getByRole("heading", { name: "Your privacy", level: 2 }),
  ).toBeInViewport();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Send feedback" }),
  ).toHaveAttribute("href", "/feedback");
  // Only the footer's attribution and the legal pages name NEXON (AGENTS.md).
  await expect(page.getByRole("main")).not.toContainText(/nexon/i);
});

test("the Changelog lists every update, newest first", async ({ page }) => {
  await page.goto("/changelog");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "What's new",
  );
  const updates = page.getByRole("main").getByRole("article");
  await expect(updates).toHaveCount(changelog.length);
  const latest = changelog.at(0);
  if (latest !== undefined) {
    await expect(updates.first().getByRole("heading", { level: 2 })).toHaveText(
      latest.title,
    );
    await expect(updates.first()).toContainText(changelogDate(latest.date));
    await expect(updates.first()).toContainText("Latest");
    if (latest.version !== undefined) {
      await expect(updates.first()).toContainText(`Version ${latest.version}`);
    }
  }

  // The timeline (React Bits' BranchedMenu): the newest update open, its groups
  // linking to their places on the page.
  const timeline = page.getByRole("navigation", { name: "Updates" });
  const sections = timeline.getByRole("button");
  await expect(sections).toHaveCount(changelog.length);
  await expect(sections.first()).toHaveAttribute("aria-expanded", "true");
  const oldest = changelog.at(-1);
  if (oldest === undefined) return;
  const oldestGroup = oldest.groups.at(0);
  if (oldestGroup === undefined) return;
  // An older update opens, and its row jumps to its group, which the line traces.
  await sections.last().click();
  await expect(sections.last()).toHaveAttribute("aria-expanded", "true");
  // Updates share their group names (changelogGroupTitles), so the row is found by
  // where it links.
  const id = changelogGroupId(oldest.date, oldestGroup.title);
  const row = timeline.locator(`a[href="#${id}"]`);
  await expect(row).toHaveText(oldestGroup.title);
  await row.click();
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  await expect(row).toHaveAttribute("aria-current", "true");
  // An attribute selector: a CSS id can't start with a digit.
  await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
});

test("Feedback sends bugs and ideas to GitHub or email, and game facts to Help", async ({
  page,
}) => {
  await page.goto("/feedback");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Send feedback",
  );
  const bug = page.getByRole("region", { name: "Report a bug" });
  await expect(
    bug.getByRole("link", { name: /^Open the form on GitHub/ }),
  ).toHaveAttribute("href", /template=bug-report\.yml/);
  await expect(bug.getByRole("link", { name: /^Email it/ })).toHaveAttribute(
    "href",
    /^mailto:contact@t7sen\.com\?subject=Bug/,
  );
  const idea = page.getByRole("region", { name: "Suggest an idea" });
  await expect(
    idea.getByRole("link", { name: /^Open the form on GitHub/ }),
  ).toHaveAttribute("href", /template=suggestion\.yml/);
  await expect(
    page
      .getByRole("region", { name: "Wrong game data" })
      .getByRole("link", { name: "Help fill in data" }),
  ).toHaveAttribute("href", "/contribute");
});
