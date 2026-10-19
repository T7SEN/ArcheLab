/**
 * The Changelog's house style, as checks (T7SEN, 2026-10-18; ADR 0036 amendment): what a
 * test can tell about an entry's wording and shape. The rest of the style, which needs a
 * reader, is in `changelog.ts`'s header. `changelog.test.ts` runs this on every entry.
 */

import {
  changelogGroupTitles,
  type ChangelogEntry,
  type ChangelogGroupTitle,
} from "./changelog";

/** A title is a few words: the day's headline. */
export const maxTitleLength = 48;
/** A summary fits about two lines under the title. */
export const maxSummaryLength = 180;
/** A line holds one change. */
export const maxLineLength = 250;
const maxLineSentences = 2;

/** Game terms keep their capitals, as the game writes them; a trailing "s" is a plural. */
const gameTerms = [
  "Descendant",
  "Transcendent",
  "Ultimate",
  "Mutant Cell",
  "Amorphous Material",
  "Enhancement Material",
  "Basic Material",
  "Core Material",
  "Fellow",
  "Inversion Reinforcement",
  "Void Intercept",
];

/** Words that say what was done to the site, not what players find on it now. */
const editWords =
  /\b(added|fixed|removed|changed|updated|improved|tweaked|reworked)\b/i;

/** Sentences, split after a period, question or exclamation mark and a space. */
const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+(?=["[A-Z0-9])/);

/** What every piece of text follows: title, summary and lines. */
function textProblems(text: string): string[] {
  const problems: string[] = [];
  if (/^\s|\s$|\s{2}|\s[.,:;]/.test(text)) {
    problems.push("has a stray space");
  }
  if (/[‘’“”]/.test(text)) {
    problems.push("uses curly quotes; the site writes straight ones");
  }
  if (/nexon|\bapi\b|metadata/i.test(text)) {
    problems.push("names NEXON or its data, which only the footer may");
  }
  if (/\b(we|our|ours|us)\b/i.test(text)) {
    problems.push('says "we" or "our"; name the site or the page instead');
  }
  if (editWords.test(text)) {
    problems.push(
      'says what was done ("added", "fixed"…); say what players see now',
    );
  }
  for (const term of gameTerms) {
    for (const match of text.matchAll(new RegExp(`\\b${term}(s?)\\b`, "gi"))) {
      const [found, plural = ""] = match;
      if (found !== term + plural) {
        problems.push(`writes "${found}"; the game writes "${term + plural}"`);
      }
    }
  }
  return problems;
}

function lineProblems(line: string): string[] {
  const problems = textProblems(line);
  if (!/^["[A-Z0-9]/.test(line)) {
    problems.push("doesn't start with a capital");
  }
  if (!/[^.]\.$/.test(line)) {
    problems.push("doesn't end with one period");
  }
  if (/^(New|Now)\b/.test(line)) {
    problems.push('opens with "New" or "Now"; the entry is already new');
  }
  if (line.length > maxLineLength) {
    problems.push(
      `is ${String(line.length)} characters, over ${String(maxLineLength)}`,
    );
  }
  if (sentencesOf(line).length > maxLineSentences) {
    problems.push(`has more than ${String(maxLineSentences)} sentences`);
  }
  return problems;
}

/**
 * Everything in an entry that breaks the house style, each as "where: what", or nothing.
 * Versions are checked across entries, in `changelog.test.ts`.
 */
export function changelogStyleProblems(entry: ChangelogEntry): string[] {
  const problems: string[] = [];
  const at = (where: string, found: readonly string[]) => {
    for (const problem of found) problems.push(`${where}: ${problem}`);
  };

  const title: string[] = textProblems(entry.title);
  if (!/^[A-Z0-9]/.test(entry.title))
    title.push("doesn't start with a capital");
  if (/[.!?:;,]$/.test(entry.title)) title.push("ends with punctuation");
  if (entry.title.length > maxTitleLength) {
    title.push(`is over ${String(maxTitleLength)} characters`);
  }
  at(`${entry.date} title`, title);

  const summary: string[] = textProblems(entry.summary);
  if (!/^[A-Z0-9]/.test(entry.summary)) {
    summary.push("doesn't start with a capital");
  }
  if (!/[^.]\.$/.test(entry.summary))
    summary.push("doesn't end with one period");
  if (sentencesOf(entry.summary).length > 1) summary.push("isn't one sentence");
  if (/^version\b/i.test(entry.summary)) {
    summary.push("names the version, which the badge shows");
  }
  if (entry.summary.length > maxSummaryLength) {
    summary.push(`is over ${String(maxSummaryLength)} characters`);
  }
  at(`${entry.date} summary`, summary);

  const titles = entry.groups.map((group) => group.title);
  const order = (title: ChangelogGroupTitle) =>
    changelogGroupTitles.indexOf(title);
  const inOrder = titles.every(
    (title, index) =>
      index === 0 || order(titles[index - 1] ?? title) < order(title),
  );
  if (entry.groups.length === 0) {
    at(entry.date, ["has no groups"]);
  } else if (!inOrder) {
    at(entry.date, [
      `groups run ${titles.join(", ")}; each once, in the order ${changelogGroupTitles.join(", ")}`,
    ]);
  }
  for (const group of entry.groups) {
    if (group.items.length === 0)
      at(`${entry.date} ${group.title}`, ["is empty"]);
    for (const line of group.items) {
      at(
        `${entry.date} ${group.title} "${line.slice(0, 40)}…"`,
        lineProblems(line),
      );
    }
  }
  return problems;
}
