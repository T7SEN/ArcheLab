import { describe, expect, it } from "vitest";
import { battlefieldDataUrl, readBattlefieldDrops } from "./battlefield-drops";

const file = {
  Normal: [],
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
        { name: "Code Breaker", href: null, ways: ["complete"] },
      ],
    },
  ],
};

describe("a battlefield's data file", () => {
  it("is served by its address", () => {
    expect(battlefieldDataUrl("grand-square")).toBe(
      "/difficulty-level-rewards/data/grand-square",
    );
  });

  it("reads back as written", () => {
    expect(readBattlefieldDrops(file)).toEqual(file);
  });

  it("is refused when it isn't one", () => {
    expect(readBattlefieldDrops(null)).toBeNull();
    expect(readBattlefieldDrops({ Normal: [] })).toBeNull();
    expect(
      readBattlefieldDrops({
        ...file,
        Hard: [{ place: "[Urban District]", kind: "dungeon", items: [] }],
      }),
    ).toBeNull();
    expect(
      readBattlefieldDrops({
        ...file,
        Normal: [
          {
            place: "[Urban District]",
            kind: "mission",
            items: [{ name: "Code Breaker", href: 3, ways: [] }],
          },
        ],
      }),
    ).toBeNull();
  });
});
