import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import {
  changelog,
  changelogDate,
  changelogGroupId,
  nextChangelogVersion,
} from "./changelog";
import { changelogStyleProblems } from "./changelog-style";

describe("the changelog", () => {
  it("runs newest first, one entry a day, each with something in it", () => {
    const dates = changelog.map((entry) => entry.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(new Set(dates).size).toBe(dates.length);
    for (const entry of changelog) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.groups.length).toBeGreaterThan(0);
      for (const group of entry.groups) {
        expect(group.items.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives each group an id of its own, for the timeline's links", () => {
    expect(changelogGroupId("2026-10-17", "Look and feel")).toBe(
      "2026-10-17-look-and-feel",
    );
    const ids = changelog.flatMap((entry) =>
      entry.groups.map((group) => changelogGroupId(entry.date, group.title)),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks Version 1 on the day it shipped, and each version once", () => {
    expect(changelog.find((entry) => entry.version === "1.0.0")?.date).toBe(
      "2026-10-17",
    );
    const versions = changelog.flatMap((entry) =>
      entry.version === undefined ? [] : [entry.version],
    );
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("gives every entry from Version 1 on a version, and none before", () => {
    const first = changelog.findIndex((entry) => entry.version === "1.0.0");
    for (const [index, entry] of changelog.entries()) {
      expect(entry.version === undefined, entry.date).toBe(index > first);
    }
  });

  it("raises the minor number for anything new, only the patch for fixes (T7SEN)", () => {
    const fixes = [{ title: "Fixes", items: ["A fix."] }] as const;
    const page = [{ title: "Database", items: ["A page."] }, ...fixes] as const;
    expect(nextChangelogVersion("1.1.0", fixes)).toBe("1.1.1");
    expect(nextChangelogVersion("1.1.3", page)).toBe("1.2.0");
    for (const [index, entry] of changelog.entries()) {
      const before = changelog.at(index + 1);
      if (entry.version === undefined || before?.version === undefined)
        continue;
      // The major number goes up only when T7SEN says so.
      const major = `${String(Number(before.version.split(".")[0]) + 1)}.0.0`;
      expect([
        nextChangelogVersion(before.version, entry.groups),
        major,
      ]).toContain(entry.version);
    }
  });

  it("writes every entry in the house style (changelog-style.ts)", () => {
    expect(changelog.flatMap(changelogStyleProblems)).toEqual([]);
  });

  it("has package.json's version as its newest (T7SEN: always the same)", () => {
    const newest = changelog.find((entry) => entry.version !== undefined);
    expect(newest?.version).toBe(packageJson.version);
  });

  it("writes dates as the legal pages do", () => {
    expect(changelogDate("2026-10-17")).toBe("17 October 2026");
    expect(changelogDate("2026-01-05")).toBe("5 January 2026");
  });
});
