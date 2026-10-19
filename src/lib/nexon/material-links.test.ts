import { describe, expect, it } from "vitest";
import { materialHref } from "./material-links";
import { imageHost } from "./metadata";
import type { MaterialRecord } from "./shared-sets";

const material = (id: string, name: string, type: string): MaterialRecord => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: [],
  material_type: type,
});

const sets = {
  research: [],
  materials: [
    material("262083003", "Shape Stabilizer Form 3", "ShapeStabilizer"),
    material(
      "262083099",
      "Advanced Shape Stabilizer Form 3",
      "ShapeStabilizer",
    ),
  ],
};

describe("materialHref", () => {
  it("links a basic material, a Shape Stabilizer and a Miscellaneous item", () => {
    expect(materialHref("261511013", "Archive Shard", sets)).toBe(
      "/basic-materials?material=archive-shard",
    );
    expect(materialHref("262083003", "Shape Stabilizer Form 3", sets)).toBe(
      "/amorphous-materials?stabilizer=shape-stabilizer-form-3",
    );
    expect(materialHref("263080002", "Collectible Coin", sets)).toBe(
      "/miscellaneous?item=collectible-coin",
    );
  });

  it("leaves Transcendent Weapon Loot to its link by name, and unknowns unlinked", () => {
    expect(
      materialHref("269020016", "Transcendent Weapon Loot", sets),
    ).toBeNull();
    expect(
      materialHref("262083099", "Advanced Shape Stabilizer Form 3", sets),
    ).toBeNull();
    expect(materialHref("999999999", "Nothing", sets)).toBeNull();
  });
});
