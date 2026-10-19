// The daily check's pure helpers (ADR 0055): which Steam posts are worth an issue, what
// each issue says, how the checks' report reads, and which NEXON sets changed. The
// runner, `run.mjs`, does the fetching and writing.

/** The Steam app id of The First Descendant. */
export const steamAppId = 2074920;

/** How far back a Steam post still gets an issue, if it has none yet. */
export const newsWindowMs = 7 * 24 * 60 * 60 * 1000;

/**
 * Whether a Steam news item is NEXON's own post about something the site's data may
 * follow: an update, hotfix, patch, event, maintenance or dev note, from the last week.
 * @param {{ feedname?: string, title?: string, date?: number }} item
 * @param {number} now
 */
export function newsWorth(item, now) {
  const title = item.title ?? "";
  return (
    item.feedname === "steam_community_announcements" &&
    /\b(update|hotfix|patch|event|events|maintenance|dev note|preview)\b/i.test(
      title,
    ) &&
    !/crackdown/i.test(title) &&
    (item.date ?? 0) * 1000 >= now - newsWindowMs
  );
}

/**
 * The hidden line that ties an issue to what opened it.
 * @param {string} kind
 * @param {string} key
 */
export function marker(kind, key) {
  return `<!-- daily-check:${kind}:${key} -->`;
}

/**
 * A check's key, from its full name.
 * @param {string} name
 */
export function checkKey(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Every check in Vitest's JSON report, passed or failed. A file that failed before its
 * checks ran (it couldn't load, or fetch) counts as one failed check of its own.
 * @param {{ testResults?: { name: string, status: string, message?: string, assertionResults?: { fullName: string, status: string, failureMessages?: string[] | null }[] }[] }} report
 * @returns {{ key: string, name: string, passed: boolean, message: string }[]}
 */
export function checkResults(report) {
  return (report.testResults ?? []).flatMap((file) => {
    const checks = (file.assertionResults ?? []).map((check) => ({
      key: checkKey(check.fullName),
      name: check.fullName,
      passed: check.status === "passed",
      message: (check.failureMessages ?? []).join("\n").trim(),
    }));
    const fileName = file.name
      .replace(/\\/g, "/")
      .replace(/^.*\/src\//, "src/");
    return checks.length === 0 && file.status === "failed"
      ? [
          {
            key: checkKey(fileName),
            name: fileName,
            passed: false,
            message: (file.message ?? "").trim(),
          },
        ]
      : checks;
  });
}

/**
 * The sets whose version changed. With no versions from before, or any set without a
 * version now (NEXON didn't answer), nothing counts as changed.
 * @param {Record<string, string> | null} before
 * @param {Record<string, string>} now
 */
export function changedSets(before, now) {
  if (
    before === null ||
    Object.values(now).some((version) => !version.trim())
  ) {
    return [];
  }
  return Object.keys(now).filter((set) => before[set] !== now[set]);
}

/**
 * The issue for a new Steam post: its title and link only. NEXON's text stays on Steam,
 * not copied into a public repository.
 * @param {{ gid: string, title: string, url: string, date: number }} item
 */
export function newsIssue(item) {
  const day = new Date(item.date * 1000).toISOString().slice(0, 10);
  return {
    title: `Game news: ${item.title}`,
    body: [
      `NEXON posted **${item.title}** on Steam on ${day}: ${item.url}`,
      "",
      "Read it for anything the site's data follows, and update what it changes:",
      "",
      "- HQ Special Orders and events: `src/data/timers.ts`",
      "- Trials, resets and other times: `src/data/timers.ts`",
      "- Rotations: `src/data/infiltration-400.ts`, `src/data/axion-operational-areas.ts`, `src/data/void-erosion-purge.ts`",
      "- Facts from the notes: `reports/TFD update notes 1.4.0 and later.md` and `src/data`",
      "",
      marker("steam", item.gid),
    ].join("\n"),
  };
}

/**
 * The issue for a failed check.
 * @param {{ key: string, name: string, message: string }} check
 */
export function failureIssue(check) {
  return {
    title: `Daily check: ${check.name}`,
    body: [
      `The daily check failed: **${check.name}**.`,
      "",
      "```",
      check.message.slice(0, 6000) || "No message.",
      "```",
      "",
      "This issue closes by itself once the check passes again.",
      "",
      marker("check", check.key),
    ].join("\n"),
  };
}
