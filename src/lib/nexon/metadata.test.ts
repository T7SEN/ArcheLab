import { describe, expect, it } from "vitest";
import { z } from "zod";
import { entriesFrom, imageHost, nexonImageUrl } from "./metadata";

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
