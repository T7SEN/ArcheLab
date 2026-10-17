import { describe, expect, it } from "vitest";
import { z } from "zod";
import { entriesFrom, imageHost, metadataUrl, nexonImageUrl } from "./metadata";

const schema = z.object({ name: z.string().min(1), image: nexonImageUrl });

describe("NEXON metadata entries", () => {
  it("keeps valid entries and drops the rest one by one", () => {
    const good = { name: "Bunny", image: `${imageHost}abc`, extra: [1, 2] };
    expect(
      entriesFrom(
        [good, null, { name: "" }, { name: "Off host", image: "https://x" }],
        schema,
      ),
    ).toEqual({
      entries: [{ name: "Bunny", image: `${imageHost}abc` }],
      dropped: 3,
    });
  });

  it("has no entries when the data is not a list", () => {
    expect(entriesFrom({ data: [] }, schema)).toEqual({
      entries: [],
      dropped: 0,
    });
    expect(entriesFrom(undefined, schema)).toEqual({ entries: [], dropped: 0 });
  });
});

describe("NEXON metadata addresses", () => {
  it("puts most sets under the language, and amorphous-reward above it", () => {
    expect(metadataUrl("descendant")).toBe(
      "https://open.api.nexon.com/static/tfd/meta/en/descendant.json",
    );
    expect(metadataUrl("amorphous-reward")).toBe(
      "https://open.api.nexon.com/static/tfd/meta/amorphous-reward.json",
    );
  });
});
