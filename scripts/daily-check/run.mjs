// The daily check's runner (ADR 0055), after `pnpm check:daily` has run the live
// checks. It opens an issue for each failed check and closes it once the check passes,
// opens one for each new NEXON post on Steam, and says whether NEXON's sets changed, so
// the workflow can rebuild the site. `--dry-run` prints what it would do instead.
//
// Environment: GITHUB_TOKEN and GITHUB_REPOSITORY (set by GitHub Actions),
// DAILY_CHECK_DIR (default .daily-check), GITHUB_OUTPUT and GITHUB_STEP_SUMMARY.

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  changedSets,
  checkResults,
  failureIssue,
  marker,
  newsIssue,
  newsWorth,
  steamAppId,
} from "./lib.mjs";

const dryRun = process.argv.includes("--dry-run");
const dir = process.env.DAILY_CHECK_DIR ?? ".daily-check";
const repository = process.env.GITHUB_REPOSITORY ?? "";
const token = process.env.GITHUB_TOKEN ?? "";
const summary = [];

/** @param {string} line */
function note(line) {
  summary.push(line);
  console.log(line);
}

/** @param {string} path */
function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

/**
 * GitHub's REST API, as the workflow's own token.
 * @param {string} method
 * @param {string} path
 * @param {unknown} [body]
 */
async function github(method, path, body) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok && response.status !== 422) {
    throw new Error(
      `GitHub ${method} ${path} answered ${String(response.status)}: ${await response.text()}`,
    );
  }
  return response.status === 204 ? null : response.json();
}

/**
 * Issues with a label, open or all, newest first, up to 500.
 * @param {string} label
 * @param {"open" | "all"} state
 * @returns {Promise<{ number: number, body?: string | null }[]>}
 */
async function issues(label, state) {
  const found = [];
  for (let page = 1; page <= 5; page += 1) {
    const batch = await github(
      "GET",
      `/repos/${repository}/issues?labels=${encodeURIComponent(label)}&state=${state}&per_page=100&page=${String(page)}`,
    );
    found.push(...batch);
    if (batch.length < 100) {
      break;
    }
  }
  return found;
}

/**
 * @param {string} title
 * @param {string} body
 * @param {string[]} labels
 */
async function openIssue(title, body, labels) {
  note(`Opens an issue: ${title}`);
  if (!dryRun) {
    await github("POST", `/repos/${repository}/issues`, {
      title,
      body,
      labels,
    });
  }
}

/** Each failed check gets an issue; a check that passes again closes its own. */
async function reportChecks() {
  const report = readJson(join(dir, "report.json"));
  const results =
    report === null
      ? [
          {
            key: "checks-did-not-run",
            name: "the checks ran",
            passed: false,
            message: `No report at ${join(dir, "report.json")}.`,
          },
        ]
      : checkResults(report);
  const open = dryRun ? [] : await issues("daily-check", "open");
  for (const check of results) {
    const tag = marker("check", check.key);
    const existing = open.find((issue) => (issue.body ?? "").includes(tag));
    if (!check.passed && existing === undefined) {
      const issue = failureIssue(check);
      await openIssue(issue.title, issue.body, ["daily-check"]);
    } else if (check.passed && existing !== undefined) {
      note(`Closes #${String(existing.number)}: ${check.name} passes again.`);
      if (!dryRun) {
        await github(
          "POST",
          `/repos/${repository}/issues/${String(existing.number)}/comments`,
          { body: "The daily check passes again." },
        );
        await github(
          "PATCH",
          `/repos/${repository}/issues/${String(existing.number)}`,
          { state: "closed", state_reason: "completed" },
        );
      }
    }
  }
  const failed = results.filter((check) => !check.passed).length;
  note(
    `Checks: ${String(results.length - failed)} passed, ${String(failed)} failed.`,
  );
}

/** Each new NEXON post on Steam about the game gets one issue. */
async function reportNews() {
  const response = await fetch(
    `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${String(steamAppId)}&count=20&maxlength=1&format=json`,
    { signal: AbortSignal.timeout(30_000) },
  );
  if (!response.ok) {
    throw new Error(`Steam's news answered ${String(response.status)}.`);
  }
  const items = (await response.json()).appnews?.newsitems ?? [];
  const now = Date.now();
  const worth = items.filter((item) => newsWorth(item, now));
  const known = dryRun ? [] : await issues("game-news", "all");
  for (const item of worth) {
    const tag = marker("steam", item.gid);
    if (!known.some((issue) => (issue.body ?? "").includes(tag))) {
      const issue = newsIssue(item);
      await openIssue(issue.title, issue.body, ["game-news"]);
    }
  }
  note(`Steam: ${String(worth.length)} recent posts about the game.`);
}

/** Whether NEXON's sets changed since the last run; the state is kept for the next. */
function reportSets() {
  const now = readJson(join(dir, "nexon-sets.json"));
  if (now === null) {
    note("NEXON: no versions to compare (the sets check didn't run).");
    return false;
  }
  const statePath = join(dir, "state", "nexon-sets.json");
  const before = readJson(statePath);
  const changed = changedSets(before, now);
  if (Object.values(now).every((version) => version.trim())) {
    mkdirSync(join(dir, "state"), { recursive: true });
    writeFileSync(statePath, `${JSON.stringify(now, null, 2)}\n`);
  }
  note(
    before === null
      ? "NEXON: versions noted for the next run."
      : changed.length === 0
        ? "NEXON: no set changed."
        : `NEXON: changed since the last run: ${changed.join(", ")}. The site rebuilds.`,
  );
  return changed.length > 0;
}

async function ensureLabels() {
  if (dryRun) {
    return;
  }
  for (const [name, color, description] of [
    ["daily-check", "d73a4a", "A failed daily data check"],
    ["game-news", "6f42c1", "A new NEXON post about the game"],
  ]) {
    // 422 when it exists already.
    await github("POST", `/repos/${repository}/labels`, {
      name,
      color,
      description,
    });
  }
}

if (!dryRun && (repository === "" || token === "")) {
  throw new Error(
    "GITHUB_REPOSITORY and GITHUB_TOKEN are needed; or pass --dry-run.",
  );
}
await ensureLabels();
await reportChecks();
await reportNews();
const rebuild = reportSets();
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `rebuild=${String(rebuild)}\n`);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Daily check\n\n${summary.map((line) => `- ${line}`).join("\n")}\n`,
  );
}
