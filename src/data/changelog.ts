/**
 * What changed on ArcheLab, newest first, for the Changelog page (T7SEN, 2026-10-17;
 * ADR 0036). Written by hand in players' words. Every change that adds, fixes or removes
 * something players can see goes here in the same change (T7SEN, 2026-10-17): under the
 * day it ships, a new entry for a new day. The first three were drafted from
 * docs/SPEC.md's dated notes for T7SEN to review.
 */

import { slugOf } from "@/lib/slug";

export interface ChangelogGroup {
  readonly title: string;
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

export const changelog: readonly ChangelogEntry[] = [
  {
    date: "2026-10-17",
    version: "1.0.0",
    title: "The whole database, one search away",
    summary:
      "Version 1: search everything at once, browse Fellows, vehicles, Mutant Cells and cosmetics, and read Descendant and weapon pages in tabs.",
    groups: [
      {
        title: "Database",
        items: [
          "A Database page: search every Descendant, weapon, module, reactor, external component, Fellow, vehicle, Mutant Cell and cosmetic at once, or browse by category.",
          "Fellows: each one's passive and stats at every level, the Inversion Reinforcement effects it unlocks, and its research.",
          "Vehicles: each hover bike's speed, turning and boost at every level, and its research.",
          "Mutant Cells: all 64 by socket, each with its icon, what sets it off and its effects.",
          "Cosmetics: every skin, makeup, attachment, paint and spawn, with each Descendant's version and who can use it. Pick a Descendant to see everything they can use.",
          "How to obtain on Transcendent weapons: the missions and their chances, first clears, Trials and more, up to Update 1.4.5.",
          "Core slots on Ultimate external components and on the Ultimate weapons checked so far, with what each core can roll at grades I to X.",
          "Each external component slot lists its possible sub-stats.",
          "The modules index loads as you scroll instead of all at once.",
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
          "Descendant and weapon pages show their sections as tabs, like a browser's.",
          "Help fill in data: send in what only shows in game, on GitHub or by email.",
          "About, Changelog and Feedback pages.",
        ],
      },
      {
        title: "Look and feel",
        items: [
          "Short, light animations across the site.",
          "Slim scrollbars in the site's colors.",
          "The Database menu opens when you hover over it, and Database opens the database page.",
          "A tidier footer.",
          "Hero text is easier to read over the dotted background on every page.",
          "The navbar has no Home link: the ArcheLab logo takes you home.",
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
          "A page for every Descendant: stats at every level, skills, exclusive modules and research, and an index to filter them.",
          "A page for every weapon: ATK at every level, base stats, its unique ability and research, and an index to filter them.",
          "Modules, Reactors and External Components: every one, with filters, each opening its details in place.",
        ],
      },
      {
        title: "Tools",
        items: [
          "A command palette: press Ctrl+K to jump to any page or item.",
          "The chat builder saves your own templates, in your browser.",
        ],
      },
      {
        title: "Site",
        items: [
          "A new home page and ArcheLab's logo.",
          "A legal notice, a privacy policy and terms of use.",
        ],
      },
    ],
  },
  {
    date: "2026-10-15",
    title: "The chat message builder",
    summary:
      "Write colored chat messages for The First Descendant and copy them into the game.",
    groups: [
      {
        title: "Chat message builder",
        items: [
          "Color your messages with the game's chat tags, tested in game, and see them as the game shows them.",
          "Add Descendant portraits and other icons.",
          "A counter keeps you under the chat limit, and the markup you copy is as short as it can be.",
          "Share a message with a link.",
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
