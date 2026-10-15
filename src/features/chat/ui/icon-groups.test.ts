import { describe, expect, it } from "vitest";
import { chatRegistry } from "./chat-registry";
import { iconGroupOf, isPortrait } from "./icon-options";

describe("icon groups", () => {
  it("puts each icon that is not a portrait in the section its id names", () => {
    const groups: Record<string, string[]> = {};
    for (const image of chatRegistry.data.images) {
      if (isPortrait(image)) {
        continue;
      }
      (groups[iconGroupOf(image)] ??= []).push(image.id);
    }
    expect(groups.currency.sort()).toEqual([
      "BlueCash",
      "Gold",
      "RedCash",
      "cash",
    ]);
    expect(groups.portraits.sort()).toEqual([
      "IconAlpha1",
      "IconAmelia1",
      "IconAnais1",
      "IconGuide1",
      "IconGuide2",
      "IconNell2",
      "IconSilion1",
    ]);
    expect(groups.missions).toHaveLength(23);
    expect(groups.npcs).toHaveLength(29);
    expect(groups.damage.sort()).toEqual([
      "Blazer",
      "Burst",
      "Crush",
      "Demonic",
      "Electricity",
      "Glacier",
      "Piercing",
      "Plain",
    ]);
    expect(groups.buttons.sort()).toEqual([
      "GamePad1",
      "GamePad2",
      "GamePad3",
      "Mouse0",
      "Mouse1",
      "Mouse2",
      "Mouse3",
    ]);
    // 23 A01 tickets, 13 U01 tickets and the four older ids.
    expect(groups.tickets).toHaveLength(40);
    expect(
      groups.tickets.every((id) => id.startsWith("Icon_CharacterTicket")),
    ).toBe(true);
    expect(groups.other.sort()).toEqual([
      "Camp",
      "Caution",
      "CharacterRecommend",
      "DeboneCooltime",
      "Default",
      "DimensionalFragment",
      "Door",
      "Emphasis",
      "Help3",
      "HighpowerRounds",
      "Icon_Reverse",
      "MapBattleZone",
      "MapField",
      "Minigame",
      "NeutralizeFilter",
      "OnslaughtMode1",
      "OnslaughtMode2",
      "PickupWeapon",
      "Qulipothium",
      "RandomOptionBan",
      "ReconstructedDevice",
      "Research",
      "RiskReward",
      "Ship",
      "StatReverse",
      "VoidVault",
      "Weekday",
    ]);
  });
});
