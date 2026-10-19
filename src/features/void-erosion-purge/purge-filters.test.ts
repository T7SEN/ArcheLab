import { describe, expect, it } from "vitest";
import {
  defaultPurgeFilters,
  parsePurgeFilters,
  purgeFiltersToSearch,
  stageSlug,
} from "./purge-filters";

const offered = {
  maps: ["eroded-ancestors-ruins", "eroded-vulgus-reactor"],
  stages: ["normal-1", "normal-10", "challenge-5"],
};

describe("stageSlug", () => {
  it("names a stage by its difficulty and number", () => {
    expect(stageSlug("Normal", 10)).toBe("normal-10");
    expect(stageSlug("Challenge", 5)).toBe("challenge-5");
  });
});

describe("filters in the URL", () => {
  it("read back what they wrote, and leave defaults out", () => {
    const filters = { map: "eroded-vulgus-reactor", stage: "challenge-5" };
    const search = purgeFiltersToSearch(filters);
    expect(search).toBe("?map=eroded-vulgus-reactor&stage=challenge-5");
    expect(parsePurgeFilters(search, offered)).toEqual(filters);
    expect(purgeFiltersToSearch(defaultPurgeFilters)).toBe("");
  });

  it("ignore a map or stage the page doesn't have", () => {
    expect(parsePurgeFilters("?map=nowhere&stage=normal-30", offered)).toEqual(
      defaultPurgeFilters,
    );
  });
});
