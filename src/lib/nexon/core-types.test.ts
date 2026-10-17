import { describe, expect, it } from "vitest";
import { coreTypesFrom, type CoreTypeRecord } from "./core-types";
import { imageHost } from "./metadata";

const img = (name: string) => `${imageHost}${name}`;

/** A grade of a core type shaped like NEXON's (read 2026-10-17). */
const grade = (
  core: string,
  options: [string, string, number, number][],
  level: number,
) => ({
  required_core_item: { meta_type: "consumable_material_id", meta_id: core },
  available_item_option: options.map(([name, operator, min, max]) => ({
    item_option: name,
    option_grade: level,
    option_effect: {
      operator_type: operator,
      min_stat_value: min,
      max_stat_value: max,
    },
  })),
});

const types: CoreTypeRecord[] = [
  {
    core_type_id: "382010201",
    core_type: "Defense Augmentation",
    core_option: [
      {
        detail: [
          grade(
            "265209010",
            [
              ["DEF", "Add", 5625, 7500],
              ["DEF", "Add", 5625, 7500],
            ],
            10,
          ),
          grade("265209001", [["DEF", "Add", 423, 564]], 1),
        ],
      },
    ],
  },
  {
    core_type_id: "382010101",
    core_type: "Recovery Augmentation",
    core_option: [
      {
        detail: [
          grade("265208010", [["Max HP", "Multiply", 0.282, 0.375]], 10),
        ],
      },
    ],
  },
  {
    core_type_id: "382000301",
    core_type: "Hit Augmentation",
    core_option: [
      {
        detail: [
          grade(
            "265107010",
            [["Multi-Hit Damage", "Multiply", 0.51, 0.72]],
            10,
          ),
        ],
      },
    ],
  },
];

const material = (id: string, name: string) => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: img(id),
  acquisition_detail: [],
});

const materials = [
  material("265209010", "Defense Augmentation Core (Variant AB) X"),
  material("265107010", "Hit Augmentation Core (Variant AB) X"),
  material("265103010", "Hit Augmentation Core X"),
];

describe("coreTypesFrom", () => {
  it("gives the chosen types in the order chosen, leaving out any NEXON lacks", () => {
    const shown = coreTypesFrom(
      [{ id: "382010101" }, { id: "382010201" }, { id: "382099999" }],
      types,
      materials,
    );
    expect(shown.map((type) => type.name)).toEqual([
      "Recovery Augmentation",
      "Defense Augmentation",
    ]);
  });

  it("orders grades lowest first, names their cores, and lists each option once", () => {
    const defense = coreTypesFrom([{ id: "382010201" }], types, materials).at(
      0,
    );
    expect(defense?.grades.map((entry) => entry.grade)).toEqual([1, 10]);
    expect(defense?.grades.at(1)).toEqual({
      grade: 10,
      cores: [
        {
          name: "Defense Augmentation Core (Variant AB) X",
          imageUrl: img("265209010"),
        },
      ],
      options: [{ name: "DEF", operator: "Add", min: 5625, max: 7500 }],
    });
    expect(defense?.grades.at(0)?.cores).toEqual([]);
  });

  it("adds a core the game also takes, at the same grade, and the slots a type fits", () => {
    // T7SEN's pictures, 2026-10-17: the Free slot takes both Hit cores.
    const hit = coreTypesFrom(
      [
        {
          id: "382000301",
          slots: ["Free"],
          alsoTakes: "Hit Augmentation Core",
        },
      ],
      types,
      materials,
    ).at(0);
    expect(hit?.slots).toEqual(["Free"]);
    expect(hit?.grades.at(0)?.cores.map((core) => core.name)).toEqual([
      "Hit Augmentation Core (Variant AB) X",
      "Hit Augmentation Core X",
    ]);
  });
});
