import { describe, expect, it } from "vitest";
import { basicMaterials } from "./basic-materials";
import { coreMaterialTier, ultimateCoreMaterials } from "./core-materials";

describe("the Ultimate Core Materials", () => {
  it("are the Library's 162, by NEXON id", () => {
    expect(ultimateCoreMaterials.size).toBe(162);
    expect([...ultimateCoreMaterials].every((id) => /^\d{9}$/.test(id))).toBe(
      true,
    );
  });

  it("share no id with a basic material", () => {
    expect(
      basicMaterials.filter((material) =>
        ultimateCoreMaterials.has(material.id),
      ),
    ).toEqual([]);
  });

  it("are Tier3; every other Core Material is Tier2", () => {
    expect(coreMaterialTier("261021009")).toBe("Tier3");
    expect(coreMaterialTier("261000001")).toBe("Tier2");
  });
});
