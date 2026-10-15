import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

const chatBackground = "#212321";

describe("contrast ratio", () => {
  it("matches the ratios recorded in SPEC.md section 4.1", () => {
    const recorded: [string, number][] = [
      ["#E73E3E", 3.89], // red
      ["#EB292A", 3.68], // enemy
      ["#009EF0", 5.39], // blue
      ["#898989", 4.52], // Gray60
      ["#1589FF", 4.56], // SkillElement
      ["#FFFFFF", 15.82], // default
    ];
    for (const [hex, ratio] of recorded) {
      expect(contrastRatio(hex, chatBackground)).toBeCloseTo(ratio, 2);
    }
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio(chatBackground, "#FFD919")).toBe(
      contrastRatio("#FFD919", chatBackground),
    );
  });

  it("rejects colors that are not #RRGGBB", () => {
    expect(() => contrastRatio("red", chatBackground)).toThrow(/#RRGGBB/);
  });
});
