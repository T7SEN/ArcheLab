import { describe, expect, it } from "vitest";
import {
  inGamePatterns,
  patternInGame,
  patternTier,
  rarePatterns,
} from "./amorphous-materials";

describe("the Amorphous Material Patterns in the game", () => {
  it("are the 44 in T7SEN's list, each once", () => {
    expect(inGamePatterns).toHaveLength(44);
    expect(new Set(inGamePatterns).size).toBe(44);
  });

  it("leave out the removed ones NEXON still lists", () => {
    expect(patternInGame("Ultimate Valby")).toBe(true);
    expect(patternInGame("001")).toBe(false);
    expect(patternInGame("106-Variant AD")).toBe(false);
    expect(patternInGame("005-Mutant AA")).toBe(false);
    expect(patternInGame("Hagios Sheepdog")).toBe(false);
  });

  it("are Ultimate but for Bunny's and Freyna's, which are Rare", () => {
    for (const name of rarePatterns) {
      expect(inGamePatterns).toContain(name);
    }
    expect(patternTier("Bunny")).toBe("Tier2");
    expect(patternTier("Freyna")).toBe("Tier2");
    expect(patternTier("Orca")).toBe("Tier3");
    expect(
      inGamePatterns.filter((name) => patternTier(name) === "Tier3"),
    ).toHaveLength(42);
  });
});
