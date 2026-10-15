import { describe, expect, it } from "vitest";
import { portraitUrlsFrom } from "./descendants";

const bunny = {
  descendant_name: "Bunny",
  descendant_image_url:
    "https://open.api.nexon.com/static/tfd/img/eaffb014c98c36d8b30d90d7778bb840",
  descendant_stat: [],
};

describe("portrait URLs from NEXON metadata", () => {
  it("maps base Descendant names to their portrait", () => {
    const ultimate = {
      descendant_name: "Ultimate Bunny",
      descendant_image_url:
        "https://open.api.nexon.com/static/tfd/img/d4e6462f87513fe6652633620b7f8d19",
    };
    expect(portraitUrlsFrom([ultimate, bunny], ["Bunny"])).toEqual({
      Bunny: bunny.descendant_image_url,
    });
  });

  it("skips invalid entries without dropping valid ones", () => {
    const offHost = {
      descendant_name: "Hailey",
      descendant_image_url: "https://example.com/hailey.png",
    };
    expect(
      portraitUrlsFrom(
        [null, { descendant_name: 4 }, offHost, bunny],
        ["Bunny", "Hailey"],
      ),
    ).toEqual({ Bunny: bunny.descendant_image_url });
  });

  it("returns nothing for metadata that is not a list", () => {
    expect(portraitUrlsFrom({ data: [bunny] }, ["Bunny"])).toEqual({});
    expect(portraitUrlsFrom(undefined, ["Bunny"])).toEqual({});
  });
});
