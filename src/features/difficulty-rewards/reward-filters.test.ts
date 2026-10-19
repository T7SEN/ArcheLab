import { describe, expect, it } from "vitest";
import {
  clearedFilters,
  defaultRewardFilters,
  filterBattlefields,
  pairOf,
  parseRewardFilters,
  rewardFiltersToSearch,
  rewardIn,
  rewardMatches,
  rewardPick,
  weekMatches,
  type Battlefield,
  type Reward,
  type RewardDescendant,
  type RewardOptions,
} from "./reward-filters";

const fireTech: Reward = {
  kind: "reactor",
  attribute: "Fire",
  archeType: "Tech",
};
const electricFusion: Reward = {
  kind: "reactor",
  attribute: "Electric",
  archeType: "Fusion",
};
const auxiliary: Reward = { kind: "component", slot: "Auxiliary Power" };

const battlefield = (
  slug: string,
  region: string,
  rewards: readonly Reward[],
): Battlefield => ({
  slug,
  name: slug,
  region,
  regionSlug: region.toLowerCase().replace(/ /g, "-"),
  rewards: rewards.map((reward, index) => ({ rotation: 116 + index, reward })),
  missions: [],
  outpost: null,
  fusionReactor: null,
  searchText: `${slug} ${region}`.toLowerCase(),
});

const cards = [
  battlefield("the-destruction", "Kingston", [fireTech, auxiliary]),
  battlefield("grand-square", "Kingston", [auxiliary, electricFusion]),
  battlefield("rockfall", "Sterile Land", [electricFusion, fireTech]),
];

const bunny: RewardDescendant = {
  slug: "bunny",
  name: "Bunny",
  pairs: [pairOf("Electric", "Fusion"), pairOf("Electric", "Singular")],
};

const offered: RewardOptions = {
  rotations: [116, 117],
  attributes: ["Fire", "Electric"],
  archeTypes: ["Fusion", "Tech"],
  slots: ["Auxiliary Power"],
  descendants: ["bunny"],
  regions: ["kingston", "sterile-land"],
  battlefields: cards.map((card) => card.slug),
};

describe("filters in the URL", () => {
  it("read back what they wrote", () => {
    const filters = {
      ...defaultRewardFilters,
      week: 117,
      attribute: "Fire",
      archeType: "Tech",
      region: "kingston",
      query: "square",
      open: "grand-square",
    };
    const search = rewardFiltersToSearch(filters);
    expect(search).toBe(
      "?week=2026-10-20&attribute=Fire&type=Tech&region=kingston&q=square&battlefield=grand-square",
    );
    expect(parseRewardFilters(search, offered)).toEqual(filters);
  });

  it("leave defaults out", () => {
    expect(rewardFiltersToSearch(defaultRewardFilters)).toBe("");
  });

  it("ignore what the page doesn't offer, and this or a past week", () => {
    expect(
      parseRewardFilters(
        "?week=2026-10-13&attribute=Toxic&type=Tech&region=albion&battlefield=nowhere",
        offered,
      ),
    ).toEqual({ ...defaultRewardFilters, archeType: "Tech" });
    expect(parseRewardFilters("?week=2026-10-06", offered).week).toBeNull();
  });

  it("keep one kind of reward filter: the Descendant, then the slot, then the pair", () => {
    expect(
      parseRewardFilters(
        "?descendant=bunny&slot=auxiliary-power&attribute=Fire",
        offered,
      ),
    ).toMatchObject({ descendant: "bunny", slot: null, attribute: null });
    expect(
      parseRewardFilters("?slot=auxiliary-power&attribute=Fire", offered),
    ).toMatchObject({ slot: "auxiliary-power", attribute: null });
  });

  it("clear to defaults but keep the week and the open battlefield", () => {
    expect(
      clearedFilters({
        ...defaultRewardFilters,
        week: 117,
        attribute: "Fire",
        query: "x",
        open: "rockfall",
      }),
    ).toEqual({ ...defaultRewardFilters, week: 117, open: "rockfall" });
  });
});

describe("rewards", () => {
  it("are picked in full by a Descendant, a slot, or an attribute and Arche type", () => {
    const slots = ["Auxiliary Power"];
    expect(
      rewardPick({ ...defaultRewardFilters, descendant: "bunny" }, slots, [
        bunny,
      ]),
    ).toEqual({ kind: "descendant", descendant: bunny });
    expect(
      rewardPick({ ...defaultRewardFilters, slot: "auxiliary-power" }, slots, [
        bunny,
      ]),
    ).toEqual({ kind: "slot", slot: "Auxiliary Power" });
    expect(
      rewardPick(
        { ...defaultRewardFilters, attribute: "Fire", archeType: "Tech" },
        slots,
        [bunny],
      ),
    ).toEqual({ kind: "pair", attribute: "Fire", archeType: "Tech" });
    expect(
      rewardPick({ ...defaultRewardFilters, attribute: "Fire" }, slots, [
        bunny,
      ]),
    ).toBeNull();
  });

  it("match a Descendant's suited pairs, a slot, or part of a pair", () => {
    const match = (reward: Reward, change: object) =>
      rewardMatches(reward, { ...defaultRewardFilters, ...change }, [bunny]);
    expect(match(electricFusion, { descendant: "bunny" })).toBe(true);
    expect(match(fireTech, { descendant: "bunny" })).toBe(false);
    expect(match(auxiliary, { slot: "auxiliary-power" })).toBe(true);
    expect(match(fireTech, { slot: "auxiliary-power" })).toBe(false);
    expect(match(fireTech, { attribute: "Fire" })).toBe(true);
    expect(match(fireTech, { archeType: "Fusion" })).toBe(false);
    expect(match(auxiliary, {})).toBe(true);
  });

  it("filter battlefields by a week's reward, region and search", () => {
    const slugs = (list: readonly Battlefield[]) =>
      list.map((card) => card.slug);
    const fire = { ...defaultRewardFilters, attribute: "Fire" };
    expect(slugs(filterBattlefields(cards, fire, 116, [bunny]))).toEqual([
      "the-destruction",
    ]);
    expect(slugs(filterBattlefields(cards, fire, 117, [bunny]))).toEqual([
      "rockfall",
    ]);
    expect(
      slugs(
        filterBattlefields(
          cards,
          { ...defaultRewardFilters, region: "kingston", query: "square" },
          116,
          [bunny],
        ),
      ),
    ).toEqual(["grand-square"]);
    // A week the build didn't ship has no reward to match.
    expect(filterBattlefields(cards, fire, 130, [bunny])).toEqual([]);
    expect(rewardIn(cards[0], 130)).toBeNull();
  });

  it("list each week with what matches in it", () => {
    expect(
      weekMatches(
        cards,
        { ...defaultRewardFilters, descendant: "bunny" },
        [116, 117],
        [bunny],
      ).map((week) => [week.rotation, week.matches.map((card) => card.slug)]),
    ).toEqual([
      [116, ["rockfall"]],
      [117, ["grand-square"]],
    ]);
  });
});
