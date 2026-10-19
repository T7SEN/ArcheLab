import { describe, expect, it } from "vitest";
import type { Battlefield } from "@/features/difficulty-rewards/reward-filters";
import { rewardLinksFrom } from "./reward-links";

const battlefield: Battlefield = {
  slug: "grand-square",
  name: "Grand Square",
  region: "Kingston",
  regionSlug: "kingston",
  rewards: [
    {
      rotation: 116,
      reward: { kind: "reactor", attribute: "Fire", archeType: "Tech" },
    },
    { rotation: 117, reward: { kind: "component", slot: "Auxiliary Power" } },
  ],
  missions: [],
  outpost: null,
  fusionReactor: null,
  searchText: "",
};

const links = rewardLinksFrom({
  battlefields: [battlefield],
  slots: ["Auxiliary Power"],
  descendants: [
    { slug: "blair", name: "Blair", pairs: ["Fire|Tech"] },
    { slug: "bunny", name: "Bunny", pairs: [] },
  ],
});

describe("rewardLinksFrom", () => {
  it("links a reactor's attribute and Arche type when a shipped week rewards them", () => {
    expect(links.reactor("Fire", "Tech")).toBe(
      "/difficulty-level-rewards?attribute=Fire&type=Tech",
    );
    expect(links.reactor("Chill", "Tech")).toBeNull();
    expect(links.reactor(null, "Tech")).toBeNull();
  });

  it("links each slot the rewards name", () => {
    expect(links.slots).toEqual({
      "Auxiliary Power": "/difficulty-level-rewards?slot=auxiliary-power",
    });
  });

  it("links a Descendant only when a shown reward suits it", () => {
    expect(links.descendant("blair")).toBe(
      "/difficulty-level-rewards?descendant=blair",
    );
    expect(links.descendant("bunny")).toBeNull();
    expect(links.descendant("nobody")).toBeNull();
  });
});
