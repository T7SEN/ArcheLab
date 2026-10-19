/**
 * What changed on ArcheLab, newest first, for the Changelog page (T7SEN, 2026-10-17;
 * ADR 0036). Written by hand in players' words. Every change that adds, fixes or removes
 * something players can see goes here in the same change (T7SEN, 2026-10-17): under the
 * day it ships, a new entry for a new day.
 *
 * Every entry is written the same way (T7SEN, 2026-10-18; ADR 0036 amendment).
 * `changelog-style.ts` checks what a test can, on every entry:
 * - Version: from Version 1 on, every entry has one, the next after the entry before:
 *   anything new raises the minor number, a day of fixes alone only the patch
 *   (`nextChangelogVersion`). `package.json` has the newest.
 * - Title: the day's headline in a few words, in sentence case, with no period.
 * - Summary: one sentence listing the day's headlines in the order of its groups. It
 *   leaves out the version, which the badge shows.
 * - Groups: `changelogGroupTitles` only, each at most once, in that order.
 * - Lines: one change each, in at most two sentences, ending with a period.
 *   - A new page or tool: its name as the navbar or footer shows it, a colon, then what
 *     players find there ("Cores: every kind of core…").
 *   - Anything else: what players see now, in the present tense ("The Database page
 *     searches … too."), with "no longer" for what's gone. Never what was done: no
 *     "Added", "Fixed" or "Removed".
 *   - Pages by their navbar or footer label, a heading by its words on the page ("Where
 *     to find it"), game terms as the game writes them, straight quotes, and never NEXON
 *     or its data.
 */

import { slugOf } from "@/lib/slug";

/**
 * The groups an entry may have, in the order it shows them:
 * - Database: new database pages, and what's new on them.
 * - Tools: new tools, and what's new in them: the chat builder, the command palette.
 * - Pages: the site's other pages, new or changed: Home, About, Changelog, Feedback, Help
 *   fill in data and the legal pages.
 * - Look and feel: how the site looks, moves and gets around, across pages.
 * - Fixes: anything that was wrong and now isn't: data, layout, wording, typos.
 */
export const changelogGroupTitles = [
  "Database",
  "Tools",
  "Pages",
  "Look and feel",
  "Fixes",
] as const;

export type ChangelogGroupTitle = (typeof changelogGroupTitles)[number];

export interface ChangelogGroup {
  readonly title: ChangelogGroupTitle;
  readonly items: readonly string[];
}

export interface ChangelogEntry {
  /** The day it shipped, as an ISO date. */
  readonly date: string;
  /**
   * The site's version, on the day one shipped: "1.0.0" for Version 1. The newest one is
   * always `package.json`'s version (T7SEN, 2026-10-17; `changelog.test.ts` checks it).
   */
  readonly version?: string;
  readonly title: string;
  /** One line that sums the day up. */
  readonly summary: string;
  readonly groups: readonly ChangelogGroup[];
}

/**
 * The version of a new day after `previous`: fixes alone raise the patch number, anything
 * else the minor (T7SEN, 2026-10-17 and 2026-10-18). The major number goes up only when
 * T7SEN says so.
 */
export function nextChangelogVersion(
  previous: string,
  groups: readonly ChangelogGroup[],
): string {
  const [major = 0, minor = 0, patch = 0] = previous.split(".").map(Number);
  return groups.every((group) => group.title === "Fixes")
    ? `${String(major)}.${String(minor)}.${String(patch + 1)}`
    : `${String(major)}.${String(minor + 1)}.0`;
}

export const changelog: readonly ChangelogEntry[] = [
  {
    date: "2026-10-18",
    version: "1.1.0",
    title: "Materials, cores and rewards",
    summary:
      "Enhancement Materials, Basic Materials, Core Materials, Cores, Miscellaneous, Difficulty Level Rewards and 400% Infiltration Operations, drop places in boxes, and typo fixes.",
    groups: [
      {
        title: "Database",
        items: [
          "Enhancement Materials: all 23, what each is for, and every way to research it with its time, cost and ingredients.",
          "Basic Materials: all 65, what each goes into, from Descendants and weapons to Enhancement Materials, Fellows and vehicles, and where to find it. A Basic Material in any research recipe opens it there.",
          "Core Materials: all 469 Codes, Blueprints and parts, what each goes into, how it's researched, the Amorphous Material Patterns that give it and where to find it. A Core Material in a research recipe or a pattern's rewards opens it there.",
          "Cores: every kind of core for Ultimate weapons and external components, what it rolls at grades I to X on each weapon type, where to find each grade and what it applies to. A core's name on a weapon or external component opens it there.",
          "Difficulty Level Rewards: each battlefield's reward this week and in every published week after it, where a reactor, an external component slot or a Descendant's reactors come each week, and what drops in each battlefield.",
          "Amorphous Materials show the eight Shape Stabilizer Forms, with what each researches and where to find it, and the Advanced Shape Stabilizers' recipes link them. A Type filter shows patterns or Shape Stabilizers alone.",
          "400% Infiltration Operations: today's two and every day of the rotation ahead, with each operation's 400% days, Transcendent weapon chance and what drops in it at 400%.",
          "Miscellaneous: all 58 loot boxes, coins, vouchers, keys and other Miscellaneous items, with each one's tier and where to find it. Drops such as Collectible Coin open it from other pages.",
          "Drop places that are a 400% Infiltration Operation or a battlefield open it, on the Basic, Core and Amorphous Materials, Cores and Miscellaneous pages. Defense and Recovery show where their plain cores drop too.",
          "Transcendent Weapon Loot and the Transcendent weapons link each other, and each Transcendent weapon's Hard 400% missions open their operation. Four Miscellaneous items link the Basic Material of the same name, such as Xeno Fluid.",
          "Reactors, external components and each Descendant's reactors link the Difficulty Level Rewards that give them, and reactors link 400% Infiltration Operations too. Both pages link back.",
          "The Database page searches Enhancement Materials, Basic Materials, Core Materials, Shape Stabilizers, cores, Miscellaneous items, battlefields and 400% Infiltration Operations too.",
        ],
      },
      {
        title: "Look and feel",
        items: [
          'Where an item drops is grouped by place in boxes under one heading, "Where to find it", each way to get it as its own tag, on the Amorphous, Basic, Core and Enhancement Materials and Cores pages.',
          "Card descriptions on Basic Materials, Enhancement Materials and Mutant Cells sit in small boxes, and each pattern's rewards on Amorphous Materials are small boxes with their chances.",
        ],
      },
      {
        title: "Fixes",
        items: [
          "The same things read and look the same on every page: headings, badges, search boxes, counts, links, tier pills, number formats, what each page says it shows and how the Changelog words its updates.",
          "Drop places with a dash or a colon in their name, such as [Trials - Protocol 001], show whole.",
          "An open Mutant Cell's close button no longer covers its effects.",
          "With the Dark Reader extension on, the site keeps its own colors, so tier and chat colors look as they do in game.",
          'Typos are gone across the site: the chat builder says "1 character left", not "1 characters left", and no chat icon is named "Boss icon icon".',
        ],
      },
    ],
  },
  {
    date: "2026-10-17",
    version: "1.0.0",
    title: "The whole database, one search away",
    summary:
      "A Database page that searches everything, five new database pages from Fellows to Amorphous Materials, Descendant and weapon pages in tabs, and light animations.",
    groups: [
      {
        title: "Database",
        items: [
          "Database: search every Descendant, weapon, module, reactor, external component, Fellow, vehicle, Mutant Cell, cosmetic and Amorphous Material Pattern at once, or browse by category.",
          "Fellows: each one's passive and stats at every level, the Inversion Reinforcement effects it unlocks, and its research.",
          "Vehicles: each hover bike's speed, turning and boost at every level, and its research.",
          "Mutant Cells: all 64 by socket, each with its icon, what sets it off and its effects, worded as the game words them.",
          "Cosmetics: every skin, makeup, attachment, paint and spawn, with each Descendant's version and who can use it. Pick a Descendant to see everything they can use.",
          "Amorphous Materials: every pattern still in the game, its tier, what it opens into and at what chance, with a filter for Descendants, weapons, Fellows and vehicles.",
          "Descendant and weapon pages show their sections as tabs, like a browser's.",
          "Research recipes on Descendant, weapon, Fellow and vehicle pages link the Amorphous Material Pattern an item comes from, and no longer name patterns that left the game.",
          "Transcendent weapon pages say how to get each one: the missions and their chances, first clears, Trials and more, up to Update 1.4.5.",
          "Ultimate external components and every Ultimate weapon show their core slots and what each core can roll at grades I to X. Launchers, Beam Rifles and melee weapons show their own cores.",
          "Each external component slot lists its possible sub-stats.",
          "The Modules page loads as you scroll instead of all at once.",
        ],
      },
      {
        title: "Tools",
        items: [
          "The chat builder knows more characters that work in game: card suits, triangles, accented letters, signs like © and €, and Japanese, Chinese, Cyrillic and Greek letters. It also warns about more that the game refuses.",
        ],
      },
      {
        title: "Pages",
        items: [
          "Help fill in data: send in what only shows in game, on GitHub or by email.",
          "About, Changelog and Feedback: what ArcheLab is, every update, and where to send bugs and ideas.",
        ],
      },
      {
        title: "Look and feel",
        items: [
          "Short, light animations across the site.",
          "Slim scrollbars in the site's colors.",
          "The Database menu opens when you hover over it, and clicking Database opens the Database page.",
          "A tidier footer.",
          "Hero text is easier to read over the dotted background on every page.",
          "The navbar has no Home link: the ArcheLab logo takes you home.",
        ],
      },
      {
        title: "Fixes",
        items: [
          "Dropdown menus open under their button and stay with it, instead of covering it.",
        ],
      },
    ],
  },
  {
    date: "2026-10-16",
    title: "Descendants, weapons and the first indexes",
    summary:
      "A page for every Descendant and weapon, indexes for modules, reactors and external components, and a command palette.",
    groups: [
      {
        title: "Database",
        items: [
          "Descendants: a page for each, with stats at every level, skills, exclusive modules and research, and an index to filter them.",
          "Weapons: a page for each, with ATK at every level, base stats, its unique ability and research, and an index to filter them.",
          "Modules, Reactors and External Components: every one, with filters, each opening its details in place.",
        ],
      },
      {
        title: "Tools",
        items: [
          "Command palette: press Ctrl+K to jump to any page or item.",
          "The chat builder saves your own templates, in your browser.",
        ],
      },
      {
        title: "Pages",
        items: [
          "A new home page and ArcheLab's logo.",
          "Legal notice, Privacy policy and Terms of use: who runs ArcheLab, what stays on your device, and the rules for using the site.",
        ],
      },
    ],
  },
  {
    date: "2026-10-15",
    title: "The chat builder",
    summary:
      "A chat builder for colored messages that paste right into the game.",
    groups: [
      {
        title: "Tools",
        items: [
          "Chat builder: color your messages with the game's chat tags, tested in game, and see them as the game shows them.",
          "Messages can hold Descendant portraits and other icons.",
          "A counter keeps you under the chat limit, and the markup you copy is as short as it can be.",
          "Every message can be shared as a link.",
        ],
      },
    ],
  },
];

/** A group's id on the Changelog page, for the timeline's links: `2026-10-17-database`. */
export function changelogGroupId(date: string, title: string): string {
  return `${date}-${slugOf(title)}`;
}

/** "17 October 2026", as the legal pages write dates. */
export function changelogDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
