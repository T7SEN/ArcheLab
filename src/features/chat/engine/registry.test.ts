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
  });

  it("records every fact as an in-game test result", () => {
    const sources = [
      ...registry.data.tags,
      ...registry.data.sizes,
      ...registry.data.images,
      ...registry.data.channels,
      registry.data.chatBackground,
      registry.data.untaggedText,
      registry.data.characters,
    ].map((entry) => entry.source);
    expect(new Set(sources)).toEqual(new Set(["in-game-test"]));
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
