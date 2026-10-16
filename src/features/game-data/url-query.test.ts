import { describe, expect, it } from "vitest";
import { urlSearchOf } from "./url-query";

describe("urlSearchOf", () => {
  it("leaves a query with no blank value as it is", () => {
    expect(urlSearchOf("")).toBe("");
    expect(urlSearchOf("?q=+raven&sort=az")).toBe("?q=+raven&sort=az");
  });

  it("leaves out blank values and keeps the rest in order", () => {
    expect(urlSearchOf("?q=+++")).toBe("");
    expect(urlSearchOf("?tier=Rare&q=%09&sort=az")).toBe("?tier=Rare&sort=az");
  });
});
