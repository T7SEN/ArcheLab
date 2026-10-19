import { describe, expect, it } from "vitest";
import {
  axionCurrentPair,
  decodeEntities,
  infiltrationToday,
  purgeCurrentMap,
  samePair,
} from "./tfdhub";

// Cut down from tfdhub.gg's server-rendered pages, read 2026-10-19 with tfdhub's
// permission: class names shortened, the structure kept.
const purgeHtml =
  '<span class="summaryLabel"><span class="liveDot" aria-hidden="true"></span>Current map</span><strong>Twisted Ancestors&#x27; Facility</strong></div>';

const axionHtml =
  '<span class="summaryLabel"><span class="liveDot"></span>Current rotation</span><strong class="summaryMission"><span>AX Refinery</span></strong><strong class="summaryMission"><span>Liquefied AX Vault</span></strong></div>';

const infiltrationHtml =
  '<svg></svg>Current rotation</h2><div><time dateTime="2026-10-19T07:00:00.000Z" class="x">Monday, October 19</time></div><button data-infiltration-day-operation="620430100"><span><span class="a">Echo Swamp<!-- --> • <!-- -->400%</span><span class="b">Seed Vault</span></span></button><button data-infiltration-day-operation="620830100"><span><span class="a">White-night Gulch<!-- --> • <!-- -->400%</span><span class="b">Mystery&#x27;s End</span></span></button>';

describe("tfdhub's pages", () => {
  it("give Void Erosion Purge's current map", () => {
    expect(purgeCurrentMap(purgeHtml)).toBe("Twisted Ancestors' Facility");
  });

  it("give the current Axion pair", () => {
    expect(axionCurrentPair(axionHtml)).toEqual([
      "AX Refinery",
      "Liquefied AX Vault",
    ]);
  });

  it("give the 400% page's day and its two operations", () => {
    expect(infiltrationToday(infiltrationHtml)).toEqual({
      startsAt: "2026-10-19T07:00:00.000Z",
      operations: ["Seed Vault", "Mystery's End"],
    });
  });

  it("say so when a page's layout has changed", () => {
    expect(purgeCurrentMap("<p>Nothing here</p>")).toBeNull();
    expect(axionCurrentPair("<p>Current rotation</p>")).toBeNull();
    expect(infiltrationToday("<h2>Today</h2>")).toBeNull();
  });
});

describe("decodeEntities and samePair", () => {
  it("read entities, and compare pairs in either order", () => {
    expect(decodeEntities("Mystery&#x27;s End &amp; &#39;co&#39;")).toBe(
      "Mystery's End & 'co'",
    );
    expect(samePair(["A", "B"], ["B", "A"])).toBe(true);
    expect(samePair(["A", "B"], ["A", "C"])).toBe(false);
    expect(samePair(null, ["A"])).toBe(false);
  });
});
