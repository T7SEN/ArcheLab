import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  findingEmailUrl,
  findingReportUrl,
  weaponCoreEmailUrl,
  weaponCoreReportUrl,
} from "./contribute";

const templates = fileURLToPath(
  new URL("../../.github/ISSUE_TEMPLATE/", import.meta.url),
);
const formIds = (file: string) =>
  [
    ...readFileSync(`${templates}${file}`, "utf8").matchAll(/^\s+id: (\S+)$/gm),
  ].map((match) => match[1]);

describe("report links", () => {
  it("open the weapon form with the weapon filled in, by the form's own field id", () => {
    const url = new URL(weaponCoreReportUrl("Nazeistra's Devotion"));
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://github.com/T7SEN/ArcheLab/issues/new",
    );
    expect(url.searchParams.get("template")).toBe("weapon-core-slots.yml");
    expect(url.searchParams.get("title")).toBe(
      "Core slots: Nazeistra's Devotion",
    );
    expect(url.searchParams.get("weapon")).toBe("Nazeistra's Devotion");
    expect(formIds("weapon-core-slots.yml")).toContain("weapon");
  });

  it("open the finding form with the topic and page filled in", () => {
    const url = new URL(findingReportUrl("Reactor upgrade name", "/reactors"));
    expect(url.searchParams.get("template")).toBe("in-game-finding.yml");
    expect(url.searchParams.get("topic")).toBe("Reactor upgrade name");
    expect(url.searchParams.get("page")).toBe("/reactors");
    expect(formIds("in-game-finding.yml")).toEqual(
      expect.arrayContaining(["topic", "page"]),
    );
  });

  it("write emails mail apps read right, spaces as %20 and lines kept", () => {
    const url = weaponCoreEmailUrl("Thunder Cage");
    expect(url).toMatch(
      /^mailto:contact@t7sen\.com\?subject=Core%20slots%3A%20Thunder%20Cage&body=/,
    );
    expect(url).not.toContain("+");
    expect(decodeURIComponent(url.split("body=")[1] ?? "")).toContain(
      "Weapon: Thunder Cage\n",
    );
    expect(findingEmailUrl("Reactor upgrade name")).toContain(
      "subject=In-game%3A%20Reactor%20upgrade%20name",
    );
  });
});
