import { describe, expect, it } from "vitest";
import { parseSavedMissions, toggled } from "./saved-missions";

describe("parseSavedMissions", () => {
  it("reads what was saved", () => {
    expect(
      parseSavedMissions(
        JSON.stringify({
          favorites: ["first-crater"],
          alerts: ["ax-refinery"],
        }),
      ),
    ).toEqual({ favorites: ["first-crater"], alerts: ["ax-refinery"] });
  });

  it("treats nothing, broken text and odd shapes as nothing saved", () => {
    const empty = { favorites: [], alerts: [] };
    expect(parseSavedMissions(null)).toEqual(empty);
    expect(parseSavedMissions("{not json")).toEqual(empty);
    expect(parseSavedMissions("null")).toEqual(empty);
    expect(parseSavedMissions('"first-crater"')).toEqual(empty);
    expect(
      parseSavedMissions(JSON.stringify({ favorites: [1, "ax-refinery"] })),
    ).toEqual({ favorites: ["ax-refinery"], alerts: [] });
  });
});

describe("toggled", () => {
  it("adds a mission, or takes it out when it is there", () => {
    expect(toggled([], "first-crater")).toEqual(["first-crater"]);
    expect(toggled(["first-crater", "ax-refinery"], "first-crater")).toEqual([
      "ax-refinery",
    ]);
  });
});
