import { contactEmail } from "./legal";

/**
 * How players send in what only the game shows (T7SEN, 2026-10-17; ADR 0028): a
 * GitHub issue form in the public repository, or an email. A report goes on the site
 * once T7SEN has checked its screenshot; then it counts as checked in game.
 */

/** The public repository, where the issue forms live (`.github/ISSUE_TEMPLATE`). */
export const repoUrl = "https://github.com/T7SEN/ArcheLab";

/**
 * A link that opens an issue form, its fields filled in from the link: GitHub matches
 * each query key to a field's `id`.
 */
function issueFormUrl(
  template: string,
  title: string,
  fields: Readonly<Record<string, string>>,
): string {
  const query = new URLSearchParams({ template, title, ...fields });
  return `${repoUrl}/issues/new?${query.toString()}`;
}

/** The weapon core slots form, with the weapon filled in. */
export function weaponCoreReportUrl(weapon: string): string {
  return issueFormUrl("weapon-core-slots.yml", `Core slots: ${weapon}`, {
    weapon,
  });
}

/** The in-game finding form, with the topic and page filled in. */
export function findingReportUrl(topic: string, page: string): string {
  return issueFormUrl("in-game-finding.yml", `In-game: ${topic}`, {
    topic,
    page,
  });
}

/**
 * An email to T7SEN with a subject and a body to fill in. Encoded by hand: mail apps
 * read "+" as a plus, not a space.
 */
export function reportEmailUrl(subject: string, body: string): string {
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** The email for a weapon's core slots. */
export function weaponCoreEmailUrl(weapon: string): string {
  return reportEmailUrl(
    `Core slots: ${weapon}`,
    `Weapon: ${weapon}\nSlots, top to bottom: \n\nPlease attach a screenshot of its Select Core Slot screen or a built weapon's tooltip.`,
  );
}

/** The email for an open check. */
export function findingEmailUrl(topic: string): string {
  return reportEmailUrl(
    `In-game: ${topic}`,
    `What the game shows: \n\nPlease attach a screenshot of where the game shows it.`,
  );
}

/**
 * Feedback about the site itself (T7SEN, 2026-10-17; ADR 0036): a bug or an idea, on
 * GitHub through its own issue form, or by email. Wrong game data goes through the
 * in-game finding form instead, with a screenshot.
 */
export const bugReportUrl = issueFormUrl("bug-report.yml", "Bug: ", {});
export const suggestionUrl = issueFormUrl("suggestion.yml", "Idea: ", {});

export const bugEmailUrl = reportEmailUrl(
  "Bug: ",
  "Page: \nWhat happened: \nBrowser and device: \n",
);
export const suggestionEmailUrl = reportEmailUrl(
  "Idea: ",
  "Your idea: \nWhat it would help with: \n",
);

/**
 * What the site marks as not known yet, besides weapon core slots: each with the page
 * it's about. Remove a check once it's settled.
 */
export const openChecks: readonly {
  readonly topic: string;
  readonly question: string;
  readonly page: string;
}[] = [
  {
    topic: "Reactor upgrade name",
    question:
      "On a level 100 Ultimate reactor, what the game calls the upgrade this site lists as Enchant 1 to Enchant 5.",
    page: "/reactors",
  },
  {
    topic: "External Component wording",
    question:
      "Whether the game writes External Component with capitals, as this site's titles do.",
    page: "/external-components",
  },
];
