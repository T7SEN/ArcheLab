import { describe, expect, it } from "vitest";
import {
  cosmeticTypeName,
  cosmeticTypes,
  everyDescendantTypes,
} from "./cosmetics";

describe("cosmetic types", () => {
  it("names NEXON's types as the game does", () => {
    expect(cosmeticTypeName("CharacterHeadSkin")).toBe("Head Skin");
    expect(cosmeticTypeName("CharacterSpawnSkin")).toBe("Spawn");
    expect(cosmeticTypeName("HairPaint")).toBe("Hair Paint");
  });

  it("names a type NEXON adds later from its id", () => {
    expect(cosmeticTypeName("CharacterWeaponSkin")).toBe("Weapon Skin");
    expect(cosmeticTypeName("Emote")).toBe("Emote");
  });

  it("gives every Descendant only types it knows", () => {
    const ids: readonly string[] = cosmeticTypes.map((type) => type.id);
    for (const type of everyDescendantTypes) {
      expect(ids).toContain(type);
    }
  });
});
