import { describe, expect, it } from "vitest";
import registryData from "../../../data/chat-tags.json";
import { createRegistry } from "./registry";
import { registry } from "./test-helpers";

describe("chat registry", () => {
  it("loads the verified in-game data", () => {
    const colors = registry.data.tags.filter((tag) => tag.kind === "color");
    expect(colors).toHaveLength(50);
    expect(
      registry.data.tags.filter((tag) => tag.kind === "style"),
    ).toHaveLength(2);
    expect(registry.data.sizes).toHaveLength(6);
    expect(registry.charLimit).toBe(100);
    expect(registry.data.status).toBe("verified");
    expect(registry.data.chatBackground.hex).toBe("#212321");
    expect(registry.data.untaggedText.capHeightPx).toBe(13);
    // Untagged text colors, sampled per channel (Whisper and Party on 2026-10-15).
    expect(
      Object.fromEntries(
        registry.data.channels.map((channel) => [channel.name, channel.hex]),
      ),
    ).toEqual({
      normal: "#CCCCCC",
      world: "#FF9314",
      trade: "#9FEA00",
      whisper: "#F771AD",
      party: "#1DA5EB",
    });
  });

  it("records every rule, style and channel as an in-game test result", () => {
    const sources = [
      ...registry.data.tags,
      ...registry.data.sizes,
      ...registry.data.channels,
      registry.data.chatBackground,
      registry.data.untaggedText,
      registry.data.characters,
    ].map((entry) => entry.source);
    expect(new Set(sources)).toEqual(new Set(["in-game-test"]));
  });

  // T7SEN, 2026-10-15: an id not tested in game yet joins the builder marked as such
  // until a test confirms it (ADR 0011, ADR 0012).
  it("says in its notes that each community image is not tested yet", () => {
    for (const image of registry.data.images) {
      if (image.source === "community") {
        expect(image.notes, image.id).toMatch(/Not tested in game yet/);
      }
    }
  });

  // Test sheet Part 8, run by T7SEN on 2026-10-15 after the patch.
  it("records the Part 8 results", () => {
    expect(registry.data.verifiedPatch).toBe("1.4.5");
    expect(new Set(registry.data.images.map((image) => image.source))).toEqual(
      new Set(["in-game-test"]),
    );

    const portraits = registry.data.images.filter(
      (image) => image.art.kind === "descendant",
    );
    expect(portraits).toHaveLength(23);
    for (const image of portraits) {
      expect(image.art).toEqual({
        kind: "descendant",
        descendant: image.label,
      });
      expect(image.id).toBe(`Icon${image.label}1`);
      expect(image.artVerified).toBe(true);
    }
    expect(
      portraits.filter((image) => /Part 8, P\d/.test(image.notes)),
    ).toHaveLength(22);

    // Every id that showed an icon is offered (the last 15 added at T7SEN's request).
    const shown = [
      ...["Guide1", "Guide2", "Alpha1", "Nell1", "Anais1", "Silion1"],
      ...["Amelia1", "Lepic1", "Ajax1", "Viessa1", "Jayber1", "Freyna1"],
      ...["Gley1", "Sharen1", "Blair1", "Valby1", "Kyle1", "Esiemo1"],
      ...["Enzo1", "Yujin1", "Luna1", "Hailey1", "Keelan1", "Ines1"],
      ...["Serena1", "Nell2", "Harris1", "Dia1", "Raven1"],
    ].map((name) => `Icon${name}`);
    shown.push(
      ...["Gold", "Qulipothium", "DimensionalFragment"],
      ...["001_A01", "002_A01", "006_A01", "004_A01"].map(
        (ticket) => `Icon_CharacterTicket_${ticket}`,
      ),
      ...["Mouse0", "Mouse1", "GamePad1", "GamePad2", "Plain", "Mission6"],
      ...["Blazer", "Glacier", "Electricity", "Demonic"],
    );
    for (const id of shown) {
      expect(registry.imagesById.has(id.toLowerCase()), id).toBe(true);
    }

    // Q8 to Q12 and Part 10: ticket numbers follow the base Descendants in NEXON's
    // order with Bunny fourth; U01 shows the Ultimate (the guide prints 002's as u01).
    const ticketOrder = [
      ...["Lepic", "Ajax", "Viessa", "Bunny", "Jayber", "Freyna", "Gley"],
      ...["Sharen", "Blair", "Valby", "Kyle", "Esiemo", "Enzo", "Yujin"],
      ...["Luna", "Hailey", "Keelan", "Ines", "Serena", "Nell", "Harris"],
      ...["Dia", "Raven"],
    ];
    const tickets = registry.data.images.flatMap((image) =>
      image.art.kind === "ticket" ? [image] : [],
    );
    expect(tickets).toHaveLength(36);
    for (const image of tickets) {
      const match = /^Icon_CharacterTicket_(\d{3})_([AUu])01$/.exec(image.id);
      expect(match, image.id).not.toBeNull();
      const base = ticketOrder[Number(match?.[1]) - 1];
      const who = match?.[2] === "A" ? base : `Ultimate ${base}`;
      expect(image.art, image.id).toEqual({ kind: "ticket", descendant: who });
      expect(image.label).toBe(`${who} character ticket`);
    }

    // All 167 ids in Steam guide 3806145510 work in game, plus Ultimate Hailey's
    // ticket, predicted from the rule (R32); the builder offers all 168.
    expect(registry.data.images).toHaveLength(168);

    // P13 and P14: these showed as text, so they are not ids.
    for (const id of ["Fire", "Chill", "Toxic", "NonAttribute", "Mission7"]) {
      expect(registry.imagesById.has(id.toLowerCase()), id).toBe(false);
    }
    // P15: the chat's element icons match NEXON's art.
    for (const id of ["Blazer", "Glacier", "Electricity", "Demonic"]) {
      expect(registry.imagesById.get(id.toLowerCase())?.artVerified, id).toBe(
        true,
      );
    }
  });

  it("links site art only from NEXON's CDN, with the page it appears on", () => {
    const siteArt = registry.data.images.flatMap((image) =>
      image.art.kind === "nexon-site" ? [image] : [],
    );
    expect(siteArt.map((image) => image.id).sort()).toEqual([
      "Blazer",
      "Demonic",
      "Electricity",
      "Glacier",
      "Gold",
      "Plain",
      "RedCash",
    ]);
    for (const image of siteArt) {
      expect(image.notes).toMatch(/ADR 0012/);
    }
  });

  it("looks up names regardless of case", () => {
    expect(registry.tagsByName.get("highlight")?.name).toBe("Highlight");
    expect(registry.imagesById.get("iconbunny1")?.id).toBe("IconBunny1");
  });

  it("rejects rules this engine does not implement", () => {
    const changed = {
      ...registryData,
      rules: { ...registryData.rules, closeTag: "</red>" },
    };
    expect(() => createRegistry(changed)).toThrow(/closeTag/);
  });

  it("rejects duplicate names that differ only in case", () => {
    const [first] = registryData.tags;
    // The first tag is "red"; "RED" differs only in case.
    const duplicated = {
      ...registryData,
      tags: [...registryData.tags, { ...first, name: "RED" }],
    };
    expect(() => createRegistry(duplicated)).toThrow(/Duplicate tag/);
  });

  it("rejects reserved tag names", () => {
    const [first] = registryData.tags;
    const reserved = {
      ...registryData,
      tags: [...registryData.tags, { ...first, name: "img" }],
    };
    expect(() => createRegistry(reserved)).toThrow(/reserved/);
  });

  it("rejects malformed data", () => {
    expect(() => createRegistry({ ...registryData, version: 0 })).toThrow();
    expect(() => createRegistry({ ...registryData, extra: true })).toThrow();
  });
});
