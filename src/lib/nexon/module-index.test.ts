import { describe, expect, it } from "vitest";
import { imageHost } from "./metadata";
import { moduleGroups } from "./module-index";
import type { ModuleRecord } from "./shared-sets";

const img = (name: string) => `${imageHost}${name}`;

/** A module shaped like NEXON's (read 2026-10-16), with what each test changes. */
function moduleOf(
  fields: Partial<ModuleRecord> & Pick<ModuleRecord, "module_id">,
): ModuleRecord {
  return {
    module_name: "Multi-Trigger Rifling",
    image_url: img(fields.module_id),
    module_type: "Multi-Hit Chance",
    module_tier_id: "Tier2",
    module_socket_type: "Rutile",
    module_class: "General Rounds",
    available_weapon_type: [],
    available_descendant_id: [],
    available_module_slot_type: [],
    module_stat: [
      { level: 1, module_capacity: 7, value: "Multi-Hit Chance +22.2%[+]" },
      { level: 0, module_capacity: 6, value: "Multi-Hit Chance +20.6%[+]" },
    ],
    ...fields,
  };
}

const weaponTypes = [
  { weapon_type: "WeaponSniperRifle", weapon_type_name: "Sniper Rifle" },
  { weapon_type: "WeaponShotGun", weapon_type_name: "Shotgun" },
];

const descendants = new Map([
  ["101000035", { slug: "raven", name: "Raven", ultimate: false }],
]);

describe("moduleGroups", () => {
  const groups = moduleGroups(
    [
      moduleOf({
        module_id: "252042100",
        module_class: "High-Power Rounds",
        available_weapon_type: ["WeaponShotGun"],
      }),
      moduleOf({
        module_id: "252042096",
        module_class: "High-Power Rounds",
        available_weapon_type: ["WeaponSniperRifle"],
      }),
      moduleOf({ module_id: "252022090", module_class: "Special Rounds" }),
      moduleOf({ module_id: "252012090" }),
      // Melee modules carry a rounds class only; their ids mark them (melee-modules.ts).
      moduleOf({
        module_id: "252093009",
        module_name: "Heat Incinerator",
        module_class: "Impact Rounds",
        module_socket_type: "Malachite",
      }),
      moduleOf({
        module_id: "252033001",
        module_name: "Heat Incinerator",
        module_class: "Impact Rounds",
        module_socket_type: "Almandine",
      }),
      moduleOf({
        module_id: "254000001",
        module_name: "Nightfall",
        module_class: "Descendant",
        module_type: null,
        module_socket_type: null,
        // The second id names no Descendant, so it is left out.
        available_descendant_id: ["101000035", "101009999"],
        available_module_slot_type: ["Skill"],
        module_stat: [{ level: 0, module_capacity: 10, value: null }],
      }),
      // A class that failed validation leaves the module off the index.
      moduleOf({
        module_id: "252012999",
        module_name: "Broken",
        module_class: null,
      }),
    ],
    weaponTypes,
    descendants,
  );

  it("groups modules by name, A–Z, with a page address each", () => {
    expect(groups.map((group) => [group.slug, group.name])).toEqual([
      ["heat-incinerator", "Heat Incinerator"],
      ["multi-trigger-rifling", "Multi-Trigger Rifling"],
      ["nightfall", "Nightfall"],
    ]);
  });

  it("orders versions by rounds, then weapon type, each labeled", () => {
    const rifling = groups.at(1);
    expect(rifling?.variants.map((variant) => variant.label)).toEqual([
      "General Rounds",
      "Special Rounds",
      "High-Power Rounds · Shotgun",
      "High-Power Rounds · Sniper Rifle",
    ]);
    expect(rifling?.variants.map((variant) => variant.weaponTypes)).toEqual([
      [],
      [],
      ["Shotgun"],
      ["Sniper Rifle"],
    ]);
  });

  it("puts melee modules after firearm ones, as their own category", () => {
    const incinerator = groups.at(0);
    expect(
      incinerator?.variants.map((variant) => [
        variant.label,
        variant.category,
        variant.rounds,
      ]),
    ).toEqual([
      ["Impact Rounds", "Impact Rounds", "Impact Rounds"],
      ["Melee Weapon · Impact Rounds", "Melee Weapon", "Impact Rounds"],
    ]);
  });

  it("names the Descendants who can equip a module, and has no rounds for it", () => {
    const nightfall = groups.at(2)?.variants.at(0);
    expect(nightfall?.category).toBe("Descendant");
    expect(nightfall?.rounds).toBeNull();
    expect(nightfall?.owners).toEqual([
      { slug: "raven", name: "Raven", ultimate: false },
    ]);
    expect(nightfall?.slots).toEqual(["Skill"]);
    expect(nightfall?.levels).toEqual([
      { level: 0, capacity: 10, effect: null },
    ]);
  });

  it("lists levels lowest first, with the capacity range", () => {
    const general = groups.at(1)?.variants.at(0);
    expect(general?.levels.map((level) => level.level)).toEqual([0, 1]);
    expect(general?.capacity).toEqual({ from: 6, to: 7 });
    expect(general?.levels.at(1)?.effect).toBe("Multi-Hit Chance +22.2%[+]");
  });

  it("gives a Trigger module, which takes no capacity, none", () => {
    // Trigger modules list a null capacity (module.json, read 2026-10-16).
    const trigger = moduleGroups(
      [
        moduleOf({
          module_id: "254003001",
          module_name: "Arche Leak",
          module_class: "Descendant",
          module_type: "Trigger",
          module_socket_type: null,
          available_module_slot_type: ["Trigger"],
          module_stat: [
            {
              level: 0,
              module_capacity: null,
              value: "Basic Info\nCooldown\t15s",
            },
          ],
        }),
      ],
      weaponTypes,
      descendants,
    )
      .at(0)
      ?.variants.at(0);
    expect(trigger?.capacity).toBeNull();
    expect(trigger?.levels.at(0)?.capacity).toBeNull();
  });

  it("adds the socket when two versions would read the same", () => {
    const twins = moduleGroups(
      [
        moduleOf({ module_id: "252012001", module_socket_type: "Rutile" }),
        moduleOf({ module_id: "252012002", module_socket_type: "Xantic" }),
      ],
      weaponTypes,
      descendants,
    );
    expect(twins.at(0)?.variants.map((variant) => variant.label)).toEqual([
      "General Rounds · Rutile",
      "General Rounds · Xantic",
    ]);
  });
});
