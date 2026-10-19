import { afterAll, describe, expect, it, vi } from "vitest";
import type { DescendantSkillTypes } from "./descendant-page";
import {
  difficultyRewards,
  type DifficultyRewardSets,
  type RewardMapRecord,
} from "./difficulty-rewards";
import { imageHost } from "./metadata";
import type { AcquisitionRecord, MaterialRecord } from "./shared-sets";

// Shaped like NEXON's reward.json, acquisition-detail.json and consumable-material.json
// (read 2026-10-18). Three of Kingston's battlefields; the table's others have no
// rewards here and are left out with a warning.
const reactor = (rotation: number, attribute: string, archeType: string) => ({
  rotation,
  reward_type: "Reactor",
  reactor_element_type: attribute,
  arche_type: archeType,
});
const slot = (rotation: number, name: string) => ({
  rotation,
  reward_type: name,
  reactor_element_type: null,
  arche_type: null,
});

const rewards: RewardMapRecord[] = [
  {
    map_id: "620100000",
    map_name: "Kingston",
    battle_zone: [
      {
        battle_zone_id: "1",
        battle_zone_name: "The Destruction",
        reward: [
          reactor(115, "Toxic", "Tech"),
          reactor(116, "Electric", "Fusion"),
          slot(117, "Auxiliary Power"),
        ],
      },
      {
        battle_zone_id: "2",
        battle_zone_name: "The Fallen Theater",
        reward: [
          slot(115, "Sensor"),
          reactor(116, "Fire", "Tech"),
          reactor(117, "Electric", "Fusion"),
        ],
      },
      {
        battle_zone_id: "3",
        battle_zone_name: "Grand Square",
        reward: [
          reactor(115, "Chill", "Singular"),
          slot(116, "Memory"),
          reactor(117, "Fire", "Tech"),
        ],
      },
    ],
  },
];

const place = (id: string, name: string): AcquisitionRecord => ({
  acquisition_detail_id: id,
  acquisition_detail_name: name,
});

const acquisitions = [
  place(
    "MM:BaseMission:620101001:Hard",
    "[ Kingston ] [ Hard ] - [ Urban District ] Mission Monster",
  ),
  place(
    "MS:BaseMission:620101001:Normal",
    "[Kingston] [Normal] - [Urban District] complete",
  ),
  place(
    "MS:VulgusPostField:620101002:Hard",
    "[Kingston] [Hard] - [Fallen Theater: Vulgus Strategic Outpost] complete",
  ),
  place(
    "MS:VoidFusionField:620101003:Hard",
    "[Kingston] [Hard] - [Void Fusion Reactor - Kingston Grand Square] complete",
  ),
  // A mission off Update 1.4.0's table, and an Infiltration Operation: neither is a
  // battlefield's.
  place(
    "MS:BaseMission:620900001:Hard",
    "[Axion Plains] [Hard] - [Sealed Area] complete",
  ),
  place(
    "MS:DungeonField:620130100:Hard",
    "[Vespers] [Hard] - [The Shelter] complete",
  ),
];

const material = (
  id: string,
  name: string,
  sources: string[],
): MaterialRecord => ({
  consumable_material_id: id,
  consumable_material_name: name,
  image_url: `${imageHost}${id}`,
  acquisition_detail: sources,
  material_type: "ResearchMaterial",
});

const materials = [
  // A basic material, a Miscellaneous item and Transcendent Weapon Loot, which links
  // the Weapons page by name.
  material("261511013", "Archive Shard", [
    "MM:BaseMission:620101001:Hard",
    "MS:BaseMission:620101001:Normal",
  ]),
  material("263011002", "Code Breaker", ["MS:VulgusPostField:620101002:Hard"]),
  material("269020016", "Transcendent Weapon Loot", [
    "MS:VoidFusionField:620101003:Hard",
    "MS:DungeonField:620130100:Hard",
  ]),
  material("263000000", "Somewhere Else", ["MS:BaseMission:620900001:Hard"]),
];

const bunny: DescendantSkillTypes = {
  slug: "bunny",
  name: "Bunny",
  ultimate: false,
  imageUrl: `${imageHost}bunny`,
  skills: [{ element: "Electric", archeType: "Fusion" }],
  extraArcheTypes: [],
};

const sets: DifficultyRewardSets = {
  rewards,
  acquisitions,
  materials,
  research: [],
  descendants: [bunny],
  itemHrefs: new Map([
    ["Transcendent Weapon Loot", "/weapons?tier=Transcendent"],
  ]),
};

// The table's other battlefields have no rewards here: each warns, as at build.
const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
afterAll(() => {
  warn.mockRestore();
});

describe("difficultyRewards", () => {
  const data = difficultyRewards(sets, 116);

  it("joins the reward list to the table's battlefields, from the build's week", () => {
    expect(data.battlefields.map((entry) => entry.slug)).toEqual([
      "the-destruction",
      "the-fallen-theater",
      "grand-square",
    ]);
    expect(data.rotations).toEqual([116, 117]);
    expect(data.battlefields[0]?.rewards).toEqual([
      {
        rotation: 116,
        reward: { kind: "reactor", attribute: "Electric", archeType: "Fusion" },
      },
      { rotation: 117, reward: { kind: "component", slot: "Auxiliary Power" } },
    ]);
    expect(data.regions).toEqual([{ slug: "kingston", name: "Kingston" }]);
    expect(data.slots).toEqual(["Auxiliary Power", "Memory"]);
  });

  it("lists what drops at each place, by difficulty, with each item's page", () => {
    expect(data.drops.get("the-destruction")).toEqual({
      Normal: [
        {
          place: "[Urban District]",
          kind: "mission",
          items: [
            {
              name: "Archive Shard",
              href: "/basic-materials?material=archive-shard",
              ways: ["complete"],
            },
          ],
        },
      ],
      Hard: [
        {
          place: "[Urban District]",
          kind: "mission",
          items: [
            {
              name: "Archive Shard",
              href: "/basic-materials?material=archive-shard",
              ways: ["Mission Monster"],
            },
          ],
        },
      ],
    });
    expect(data.drops.get("the-fallen-theater")?.Hard).toEqual([
      {
        place: "[Fallen Theater: Vulgus Strategic Outpost]",
        kind: "outpost",
        items: [
          {
            name: "Code Breaker",
            href: "/miscellaneous?item=code-breaker",
            ways: ["complete"],
          },
        ],
      },
    ]);
    expect(data.drops.get("grand-square")?.Hard).toEqual([
      {
        place: "[Void Fusion Reactor - Kingston Grand Square]",
        kind: "fusion-reactor",
        items: [
          {
            name: "Transcendent Weapon Loot",
            href: "/weapons?tier=Transcendent",
            ways: ["complete"],
          },
        ],
      },
    ]);
  });

  it("names each battlefield's outpost and Void Fusion Reactor", () => {
    expect(data.battlefields[1]?.outpost).toBe(
      "Fallen Theater: Vulgus Strategic Outpost",
    );
    expect(data.battlefields[2]?.fusionReactor).toBe(
      "Void Fusion Reactor - Kingston Grand Square",
    );
  });

  it("knows each drop place's battlefield by its id, and only battlefields'", () => {
    expect(Object.fromEntries(data.placeBattlefields)).toEqual({
      "MM:BaseMission:620101001:Hard": "the-destruction",
      "MS:BaseMission:620101001:Normal": "the-destruction",
      "MS:VulgusPostField:620101002:Hard": "the-fallen-theater",
      "MS:VoidFusionField:620101003:Hard": "grand-square",
    });
  });

  it("gives each Descendant the shown reactor pairs that suit it", () => {
    expect(data.descendants).toEqual([
      { slug: "bunny", name: "Bunny", pairs: ["Electric|Fusion"] },
    ]);
  });

  it("works without the drops, for the pages they link (fetchRewardSchedule)", () => {
    const schedule = difficultyRewards(
      { ...sets, materials: [], itemHrefs: new Map() },
      116,
    );
    expect(schedule.battlefields.map((entry) => entry.slug)).toEqual(
      data.battlefields.map((entry) => entry.slug),
    );
    expect(schedule.placeBattlefields).toEqual(data.placeBattlefields);
  });

  it("shows none when the reward list fails its checks", () => {
    const broken: RewardMapRecord[] = [
      {
        map_id: "620100000",
        map_name: "Kingston",
        battle_zone: [
          {
            battle_zone_id: "1",
            battle_zone_name: "The Destruction",
            reward: [
              reactor(116, "Fire", "Tech"),
              reactor(116, "Fire", "Tech"),
            ],
          },
        ],
      },
    ];
    const empty = difficultyRewards({ ...sets, rewards: broken }, 116);
    expect(empty.battlefields).toEqual([]);
    expect(empty.placeBattlefields.size).toBe(0);
  });
});
