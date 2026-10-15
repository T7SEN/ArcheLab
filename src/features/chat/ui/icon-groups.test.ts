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
    expect(groups.missions).toHaveLength(13);
    expect(groups.npcs).toHaveLength(11);
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
    ]);
    expect(groups.tickets.sort()).toEqual([
      "Icon_CharacterTicket_001_A01",
      "Icon_CharacterTicket_002_A01",
      "Icon_CharacterTicket_004_A01",
      "Icon_CharacterTicket_004_U01",
      "Icon_CharacterTicket_006_A01",
    ]);
    expect(groups.other.sort()).toEqual([
      "Camp",
      "DeboneCooltime",
      "DimensionalFragment",
      "Door",
      "Qulipothium",
      "RandomOptionBan",
      "ReconstructedDevice",
    ]);
  });
});
