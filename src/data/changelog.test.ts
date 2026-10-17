import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import { changelog, changelogDate, changelogGroupId } from "./changelog";

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

  it("has package.json's version as its newest (T7SEN: always the same)", () => {
    const newest = changelog.find((entry) => entry.version !== undefined);
    expect(newest?.version).toBe(packageJson.version);
  });

  it("writes dates as the legal pages do", () => {
    expect(changelogDate("2026-10-17")).toBe("17 October 2026");
    expect(changelogDate("2026-01-05")).toBe("5 January 2026");
  });
});
