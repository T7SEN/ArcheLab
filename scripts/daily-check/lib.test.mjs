import { describe, expect, it } from "vitest";
import {
  changedSets,
  checkResults,
  failureIssue,
  marker,
  newsIssue,
  newsWorth,
} from "./lib.mjs";

const now = Date.parse("2026-10-19T08:00:00Z");
const seconds = (iso) => Date.parse(iso) / 1000;

describe("newsWorth", () => {
  const post = (title, date = "2026-10-16T11:43:00Z") => ({
    feedname: "steam_community_announcements",
    title,
    date: seconds(date),
  });

  it("keeps NEXON's posts about updates, hotfixes, events and maintenance", () => {
    expect(newsWorth(post("The First Descendant Hotfix 1.4.5b"), now)).toBe(
      true,
    );
    expect(
      newsWorth(post("(Revised #2) The First Descendant Update 1.4.5"), now),
    ).toBe(true);
    expect(
      newsWorth(post("(Updated) (In-game) 10.15 (Thu) Event Info"), now),
    ).toBe(true);
    expect(
      newsWorth(
        post(
          "Server Maintenance Notice (10.14(Wed) 22:00 – 10.15(Thu) 08:00 PDT)",
        ),
        now,
      ),
    ).toBe(true);
  });

  it("leaves out other posts, old ones and other feeds", () => {
    expect(
      newsWorth(
        post(
          "7/10 (Wed) – 15/10 (Thu) Results of the Crackdown on Abusive Users",
        ),
        now,
      ),
    ).toBe(false);
    expect(
      newsWorth(post("Advance Info on the End of the Guide Quest"), now),
    ).toBe(false);
    expect(newsWorth(post("Update 1.4.4", "2026-10-01T05:00:00Z"), now)).toBe(
      false,
    );
    expect(
      newsWorth({ ...post("Update 1.4.5"), feedname: "pcgamer" }, now),
    ).toBe(false);
  });
});

describe("checkResults", () => {
  it("lists every check, and a file that failed before its checks as one", () => {
    expect(
      checkResults({
        testResults: [
          {
            name: "/home/runner/work/ArcheLab/src/checks/site-data.check.ts",
            status: "failed",
            assertionResults: [
              {
                fullName: "NEXON's data answers for every set the site uses",
                status: "passed",
                failureMessages: [],
              },
              {
                fullName: "NEXON's data loads for every page without a warning",
                status: "failed",
                failureMessages: [
                  "AssertionError: expected [ …(1) ] to deeply equal []",
                ],
              },
            ],
          },
          {
            name: "C:\\work\\ArcheLab\\src\\checks\\rotations.check.ts",
            status: "failed",
            message: "fetch failed",
            assertionResults: [],
          },
        ],
      }),
    ).toEqual([
      {
        key: "nexon-s-data-answers-for-every-set-the-site-uses",
        name: "NEXON's data answers for every set the site uses",
        passed: true,
        message: "",
      },
      {
        key: "nexon-s-data-loads-for-every-page-without-a-warning",
        name: "NEXON's data loads for every page without a warning",
        passed: false,
        message: "AssertionError: expected [ …(1) ] to deeply equal []",
      },
      {
        key: "src-checks-rotations-check-ts",
        name: "src/checks/rotations.check.ts",
        passed: false,
        message: "fetch failed",
      },
    ]);
  });
});

describe("changedSets", () => {
  it("names the sets whose version changed", () => {
    expect(
      changedSets(
        { reward: '"a" Thu', weapon: '"b" Thu' },
        { reward: '"a" Thu', weapon: '"c" Fri' },
      ),
    ).toEqual(["weapon"]);
  });

  it("counts nothing as changed on the first run, or when NEXON didn't answer", () => {
    expect(changedSets(null, { reward: '"a"' })).toEqual([]);
    expect(changedSets({ reward: '"a"' }, { reward: "  " })).toEqual([]);
  });
});

describe("the issues", () => {
  it("link a Steam post without copying its text, and carry their marker", () => {
    const issue = newsIssue({
      gid: "1234",
      title: "The First Descendant Hotfix 1.4.5b",
      url: "https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1234",
      date: seconds("2026-10-16T11:43:00Z"),
    });
    expect(issue.title).toBe("Game news: The First Descendant Hotfix 1.4.5b");
    expect(issue.body).toContain("on Steam on 2026-10-16");
    expect(issue.body).toContain(marker("steam", "1234"));
    const failure = failureIssue({
      key: "a-check",
      name: "A check",
      message: "It failed.",
    });
    expect(failure.title).toBe("Daily check: A check");
    expect(failure.body).toContain("It failed.");
    expect(failure.body).toContain(marker("check", "a-check"));
  });
});
