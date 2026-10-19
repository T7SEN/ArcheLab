import { describe, expect, it } from "vitest";
import {
  coreHref,
  coreOptionLabel,
  coreSlotName,
  formatCoreRange,
  romanGrade,
} from "./core-types";

const option = (name: string, operator: string, min: number, max: number) => ({
  name,
  operator,
  min,
  max,
});

describe("formatCoreRange", () => {
  it("writes external component cores as T7SEN's tooltip does (2026-10-17)", () => {
    // "Max HP X [28.2-37.5]%" and "DEF X [5,625-7,500]" on a built Enlightened Mage piece.
    expect(
      formatCoreRange(option("Max HP", "Multiply", 0.28200000000000003, 0.375)),
    ).toBe("28.2–37.5% [x]");
    expect(formatCoreRange(option("DEF", "Add", 5625, 7500))).toBe(
      "5,625–7,500 [+]",
    );
  });

  it("writes weapon cores as T7SEN's in-game lists do (2026-10-17)", () => {
    expect(formatCoreRange(option("Firearm ATK", "Multiply", 0.02, 0.8))).toBe(
      "2–80% [x]",
    );
    // NEXON's -20% to -1%, shown as 1% to 20%.
    expect(formatCoreRange(option("Fire Rate", "Multiply", -0.2, -0.01))).toBe(
      "1–20% [x]",
    );
    expect(
      formatCoreRange(option("Reload Time Modifier", "Add", 0.02, 0.74)),
    ).toBe("2–74% [+]");
    // Negatives take a minus sign (U+2212) and the dash spaces, as the monospace
    // font draws a minus and an en dash alike.
    expect(formatCoreRange(option("Recoil", "Add", -0.92, -0.05))).toBe(
      "−92 – −5% [+]",
    );
    expect(
      formatCoreRange(
        option(
          "Grappling Hook Charge Time Increase Ratio",
          "Add",
          -0.46,
          -0.35000000000000003,
        ),
      ),
    ).toBe("−46 – −35% [+]");
    expect(formatCoreRange(option("Max HP", "Add", -2, 3))).toBe("−2 – 3 [+]");
    expect(formatCoreRange(option("Multi-Hit Chance", "Add", 1, 24))).toBe(
      "1–24% [+]",
    );
    expect(
      formatCoreRange(option("Weapon Change Speed", "Add", 0.02, 0.62)),
    ).toBe("0.02–0.62 [+]");
  });

  it("keeps small amounts and rounds NEXON's floating-point noise", () => {
    expect(
      formatCoreRange(
        option(
          "Shield Recovery Out of Combat",
          "Add",
          1.251,
          1.6669999999999998,
        ),
      ),
    ).toBe("1.251–1.667 [+]");
    expect(formatCoreRange(option("Odd", "Other", 1, 2))).toBe("1–2");
  });
});

describe("coreOptionLabel", () => {
  it("uses the game's name where it differs from NEXON's", () => {
    expect(coreOptionLabel(option("Multi-Hit Chance", "Add", 1, 24))).toBe(
      "Multi-Hit Chance(+)",
    );
    expect(coreOptionLabel(option("Firearm ATK", "Multiply", 0, 1))).toBe(
      "Firearm ATK",
    );
  });
});

describe("romanGrade", () => {
  it("numbers grades as the game names its cores", () => {
    expect([1, 4, 9, 10].map(romanGrade)).toEqual(["I", "IV", "IX", "X"]);
    expect(romanGrade(11)).toBe("11");
    expect(romanGrade(0)).toBe("0");
  });
});

describe("a core type's card on the Cores index", () => {
  it("is named for its slot", () => {
    expect(coreSlotName("Firepower Augmentation")).toBe("Firepower");
    expect(coreSlotName("Free Augmentation")).toBe("Free");
  });

  it("opens the card, with a weapon type's rolls when given", () => {
    expect(coreHref("Recovery Augmentation")).toBe("/cores?core=recovery");
    expect(coreHref("Firepower Augmentation", "Launcher")).toBe(
      "/cores?type=launcher&core=firepower",
    );
    expect(coreHref("Hit Augmentation", "Balanced Melee Weapon")).toBe(
      "/cores?type=balanced-melee-weapon&core=hit",
    );
  });
});
