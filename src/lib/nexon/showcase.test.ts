import { describe, expect, it } from "vitest";
import { imageHost } from "./metadata";
import {
  descendantShowcase,
  weaponShowcase,
  type DescendantEntry,
  type WeaponEntry,
} from "./showcase";

function descendant(id: string, name: string, group: string): DescendantEntry {
  return {
    descendant_id: id,
    descendant_name: name,
    descendant_group_id: group,
    descendant_image_url: `${imageHost}${id}`,
  };
}

function weapon(
  id: string,
  name: string,
  type: string,
  tier: number,
): WeaponEntry {
  return {
    weapon_id: id,
    weapon_name: name,
    weapon_type: type,
    weapon_rounds_type: "General Rounds",
    weapon_tier_id: `Tier${String(tier)}`,
    image_url: `${imageHost}${id}`,
  };
}

describe("the home page's game showcase", () => {
  it("lists every Descendant newest first and marks the Ultimates", () => {
    const showcase = descendantShowcase([
      descendant("101000004", "Ultimate Lepic", "g1"),
      descendant("101000002", "Ajax", "g2"),
      descendant("101000001", "Lepic", "g1"),
      descendant("101000010", "Ultimate Ajax", "g2"),
    ]);
    expect(showcase.items).toEqual([
      {
        name: "Ultimate Ajax",
        imageUrl: `${imageHost}101000010`,
        ultimate: true,
      },
      {
        name: "Ultimate Lepic",
        imageUrl: `${imageHost}101000004`,
        ultimate: true,
      },
      { name: "Ajax", imageUrl: `${imageHost}101000002`, ultimate: false },
      { name: "Lepic", imageUrl: `${imageHost}101000001`, ultimate: false },
    ]);
    expect(showcase.groups).toBe(2);
    expect(showcase.ultimates).toBe(2);
  });

  it("shows each weapon type once, at its highest tier", () => {
    const showcase = weaponShowcase([
      weapon("3", "Rifle B", "Assault Rifle", 3),
      weapon("1", "Rifle A", "Assault Rifle", 2),
      weapon("5", "Rifle C", "Assault Rifle", 3),
      weapon("2", "Pistol", "Handgun", 1),
    ]);
    expect(showcase.items).toEqual([
      {
        name: "Rifle B",
        imageUrl: `${imageHost}3`,
        type: "Assault Rifle",
        roundsType: "General Rounds",
      },
      {
        name: "Pistol",
        imageUrl: `${imageHost}2`,
        type: "Handgun",
        roundsType: "General Rounds",
      },
    ]);
    expect(showcase.total).toBe(4);
    expect(showcase.types).toBe(2);
  });

  it("is empty when NEXON's data is", () => {
    expect(descendantShowcase([])).toEqual({
      items: [],
      groups: 0,
      ultimates: 0,
    });
    expect(weaponShowcase([])).toEqual({ items: [], total: 0, types: 0 });
  });
});
