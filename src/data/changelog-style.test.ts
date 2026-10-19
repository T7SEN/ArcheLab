import { describe, expect, it } from "vitest";
import type { ChangelogEntry, ChangelogGroup } from "./changelog";
import { changelogStyleProblems, maxLineLength } from "./changelog-style";

const entry = (overrides: Partial<ChangelogEntry> = {}): ChangelogEntry => ({
  date: "2026-10-19",
  title: "A good day",
  summary: "One page and a fix.",
  groups: [{ title: "Database", items: ["Cores: every kind of core."] }],
  ...overrides,
});

/** The problems with one line, in a Fixes group. */
const problemsWith = (line: string) =>
  changelogStyleProblems(
    entry({ groups: [{ title: "Fixes", items: [line] }] }),
  );

describe("the Changelog's house style", () => {
  it("passes an entry written to it", () => {
    expect(changelogStyleProblems(entry())).toEqual([]);
    expect(
      problemsWith('Typos are gone: no chat icon is named "Boss icon icon".'),
    ).toEqual([]);
  });

  it("wants each line to start with a capital and end with one period", () => {
    expect(problemsWith("lowercase start.")).toHaveLength(1);
    expect(problemsWith("No period")).toHaveLength(1);
    expect(problemsWith("Two periods..")).toHaveLength(1);
  });

  it("says what players see now, not what was done", () => {
    expect(problemsWith("Fixed the close button.")).toHaveLength(1);
    expect(problemsWith("Typos fixed across the site.")).toHaveLength(1);
    expect(problemsWith("New: a page.")).toHaveLength(1);
    expect(problemsWith("We tidied the footer.")).toHaveLength(1);
  });

  it("writes game terms as the game does", () => {
    expect(problemsWith("Every descendant has a page.")).toEqual([
      expect.stringContaining(
        'writes "descendant"; the game writes "Descendant"',
      ),
    ]);
    expect(problemsWith("All 65 basic materials.")).toHaveLength(1);
    expect(problemsWith("The First Descendant and its Mutant Cells.")).toEqual(
      [],
    );
  });

  it("never names NEXON or its data, and uses straight quotes", () => {
    expect(problemsWith("Facts from NEXON's metadata.")).toHaveLength(1);
    expect(problemsWith("It’s here.")).toHaveLength(1);
    expect(problemsWith("Two  spaces.")).toHaveLength(1);
  });

  it("keeps a line to one change: two sentences and a set length", () => {
    expect(problemsWith("One. Two. Three.")).toHaveLength(1);
    expect(problemsWith(`${"A".repeat(maxLineLength)}.`)).toHaveLength(1);
    // A version number's periods don't end a sentence.
    expect(problemsWith("Up to Update 1.4.5. Grades I to X.")).toEqual([]);
  });

  it("keeps titles short and bare, and summaries to one sentence", () => {
    expect(
      changelogStyleProblems(entry({ title: "A good day." })),
    ).toHaveLength(1);
    expect(
      changelogStyleProblems(entry({ summary: "Version 2: everything." })),
    ).toHaveLength(1);
    expect(
      changelogStyleProblems(entry({ summary: "One page. And a fix." })),
    ).toHaveLength(1);
  });

  it("wants its groups once each, in their order", () => {
    const group = (title: ChangelogGroup["title"]): ChangelogGroup => ({
      title,
      items: ["A line."],
    });
    expect(
      changelogStyleProblems(
        entry({ groups: [group("Database"), group("Fixes")] }),
      ),
    ).toEqual([]);
    expect(
      changelogStyleProblems(
        entry({ groups: [group("Fixes"), group("Database")] }),
      ),
    ).toHaveLength(1);
    expect(
      changelogStyleProblems(
        entry({ groups: [group("Tools"), group("Tools")] }),
      ),
    ).toHaveLength(1);
    expect(changelogStyleProblems(entry({ groups: [] }))).toEqual([
      "2026-10-19: has no groups",
    ]);
  });
});
