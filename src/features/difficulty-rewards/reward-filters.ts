/**
 * The Difficulty Level Rewards page's filters (ADR 0048): pure functions over plain data,
 * so the grid and the unit tests share them. The week, the filters and the open
 * battlefield live in the URL query, so a view can be shared; defaults stay out of it.
 */

import { slugOf } from "@/lib/slug";
import { rotationOfKey, weekKey } from "./reward-week";

/** A week's reward in a battlefield: a reactor, or an external component slot. */
export type Reward =
  | {
      readonly kind: "reactor";
      readonly attribute: string;
      readonly archeType: string;
    }
  | {
      readonly kind: "component";
      /** As the reward list writes it: "Auxiliary Power". */
      readonly slot: string;
    };

export interface RewardWeek {
  readonly rotation: number;
  readonly reward: Reward;
}

/** A battlefield's card, in its region. */
export interface Battlefield {
  /** "moonlight-lake"; unique across the regions. */
  readonly slug: string;
  /** As the reward list writes it: "The Fallen Theater", "Repository". */
  readonly name: string;
  readonly region: string;
  readonly regionSlug: string;
  /** The weeks the build shipped, from its own week on, one each, earliest first. */
  readonly rewards: readonly RewardWeek[];
  /** Its Hard battlefield missions, in Update 1.4.0's order and spelling. */
  readonly missions: readonly string[];
  /** Its Vulgus Strategic Outpost and Void Fusion Reactor, as the game names them. */
  readonly outpost: string | null;
  readonly fusionReactor: string | null;
  /** What a search matches, folded: name, region, missions, places and their drops. */
  readonly searchText: string;
}

export interface RewardRegion {
  readonly slug: string;
  readonly name: string;
}

/** A Descendant in the filter, with the reactor rewards that suit its skills. */
export interface RewardDescendant {
  readonly slug: string;
  readonly name: string;
  /** The attribute and Arche type pairs it suits (`reactorMatch`), as "Electric|Tech". */
  readonly pairs: readonly string[];
}

export interface RewardFilters {
  /** A shown week after this one; null is this week. */
  readonly week: number | null;
  readonly attribute: string | null;
  readonly archeType: string | null;
  /** An external component slot, by its address: "auxiliary-power". */
  readonly slot: string | null;
  /** A Descendant's address. */
  readonly descendant: string | null;
  /** A region's address. */
  readonly region: string | null;
  /** Words every shown battlefield's text contains, ignoring case. */
  readonly query: string;
  /** The battlefield whose details are open, by its address. */
  readonly open: string | null;
}

export const defaultRewardFilters: RewardFilters = {
  week: null,
  attribute: null,
  archeType: null,
  slot: null,
  descendant: null,
  region: null,
  query: "",
  open: null,
};

const keys = {
  week: "week",
  attribute: "attribute",
  archeType: "type",
  slot: "slot",
  descendant: "descendant",
  region: "region",
  query: "q",
  open: "battlefield",
} as const;

/** What the page offers, for reading a URL. */
export interface RewardOptions {
  /** The weeks shown, earliest first; the first is this week. */
  readonly rotations: readonly number[];
  readonly attributes: readonly string[];
  readonly archeTypes: readonly string[];
  /** Slot names as the reward list writes them. */
  readonly slots: readonly string[];
  readonly descendants: readonly string[];
  readonly regions: readonly string[];
  readonly battlefields: readonly string[];
}

/**
 * Filters from a URL query string. Values the page doesn't offer are ignored, so an old
 * or edited link still opens a working page: a week that has passed shows this week.
 * The three kinds of reward filter exclude each other; a link carrying more keeps the
 * Descendant, then the slot, then the attribute and Arche type.
 */
export function parseRewardFilters(
  search: string,
  offered: RewardOptions,
): RewardFilters {
  const params = new URLSearchParams(search);
  const pick = (value: string | null, from: readonly string[]) =>
    value !== null && from.includes(value) ? value : null;
  const weekRotation = rotationOfKey(params.get(keys.week) ?? "");
  const current = offered.rotations.at(0);
  const week =
    weekRotation !== null &&
    current !== undefined &&
    weekRotation > current &&
    offered.rotations.includes(weekRotation)
      ? weekRotation
      : null;
  const descendant = pick(params.get(keys.descendant), offered.descendants);
  const slot =
    descendant === null
      ? pick(params.get(keys.slot), offered.slots.map(slugOf))
      : null;
  const pairs = descendant === null && slot === null;
  return {
    week,
    attribute: pairs
      ? pick(params.get(keys.attribute), offered.attributes)
      : null,
    archeType: pairs
      ? pick(params.get(keys.archeType), offered.archeTypes)
      : null,
    slot,
    descendant,
    region: pick(params.get(keys.region), offered.regions),
    query: params.get(keys.query) ?? "",
    open: pick(params.get(keys.open), offered.battlefields),
  };
}

/** The query string for these filters, "" when all are defaults. */
export function rewardFiltersToSearch(filters: RewardFilters): string {
  const params = new URLSearchParams();
  const values: [string, string | null][] = [
    [keys.week, filters.week === null ? null : weekKey(filters.week)],
    [keys.attribute, filters.attribute],
    [keys.archeType, filters.archeType],
    [keys.slot, filters.slot],
    [keys.descendant, filters.descendant],
    [keys.region, filters.region],
    [keys.query, filters.query === "" ? null : filters.query],
    [keys.open, filters.open],
  ];
  for (const [key, value] of values) {
    if (value !== null) {
      params.set(key, value);
    }
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
}

/** Whether a filter on the reward itself is on. */
export function filtersReward(filters: RewardFilters): boolean {
  return (
    filters.attribute !== null ||
    filters.archeType !== null ||
    filters.slot !== null ||
    filters.descendant !== null
  );
}

/** Whether any filter narrows the grid; the week isn't a filter. */
export function narrows(filters: RewardFilters): boolean {
  return (
    filtersReward(filters) ||
    filters.region !== null ||
    filters.query.trim() !== ""
  );
}

/** What the week-by-week list answers for, or null while no full pick is made. */
export type RewardPick =
  | {
      readonly kind: "pair";
      readonly attribute: string;
      readonly archeType: string;
    }
  | { readonly kind: "slot"; readonly slot: string }
  | { readonly kind: "descendant"; readonly descendant: RewardDescendant };

export function rewardPick(
  filters: RewardFilters,
  slots: readonly string[],
  descendants: readonly RewardDescendant[],
): RewardPick | null {
  if (filters.descendant !== null) {
    const descendant = descendants.find(
      (entry) => entry.slug === filters.descendant,
    );
    return descendant === undefined ? null : { kind: "descendant", descendant };
  }
  if (filters.slot !== null) {
    const slot = slots.find((entry) => slugOf(entry) === filters.slot);
    return slot === undefined ? null : { kind: "slot", slot };
  }
  return filters.attribute !== null && filters.archeType !== null
    ? {
        kind: "pair",
        attribute: filters.attribute,
        archeType: filters.archeType,
      }
    : null;
}

/** A reactor reward's pair, as Descendants list them: "Electric|Tech". */
export function pairOf(attribute: string, archeType: string): string {
  return `${attribute}|${archeType}`;
}

/** Whether a reward passes the reward filters. */
export function rewardMatches(
  reward: Reward,
  filters: RewardFilters,
  descendants: readonly RewardDescendant[],
): boolean {
  if (filters.descendant !== null) {
    const pairs =
      descendants.find((entry) => entry.slug === filters.descendant)?.pairs ??
      [];
    return (
      reward.kind === "reactor" &&
      pairs.includes(pairOf(reward.attribute, reward.archeType))
    );
  }
  if (filters.slot !== null) {
    return reward.kind === "component" && slugOf(reward.slot) === filters.slot;
  }
  if (filters.attribute === null && filters.archeType === null) {
    return true;
  }
  return (
    reward.kind === "reactor" &&
    (filters.attribute === null || reward.attribute === filters.attribute) &&
    (filters.archeType === null || reward.archeType === filters.archeType)
  );
}

/** A battlefield's reward in a week, or null when that week isn't shipped. */
export function rewardIn(
  battlefield: Battlefield,
  rotation: number,
): Reward | null {
  return (
    battlefield.rewards.find((week) => week.rotation === rotation)?.reward ??
    null
  );
}

/** Text as search compares it: lowercase, with curly apostrophes as straight ones. */
export function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/** Whether a battlefield passes Region and search, which hold in every week. */
function placeMatches(card: Battlefield, filters: RewardFilters): boolean {
  const words = fold(filters.query).trim().split(/\s+/).filter(Boolean);
  return (
    (filters.region === null || card.regionSlug === filters.region) &&
    words.every((word) => card.searchText.includes(word))
  );
}

/** The battlefields that pass every filter in a week, in page order. */
export function filterBattlefields<T extends Battlefield>(
  cards: readonly T[],
  filters: RewardFilters,
  rotation: number,
  descendants: readonly RewardDescendant[],
): T[] {
  const byReward = filtersReward(filters);
  return cards.filter((card) => {
    if (!placeMatches(card, filters)) {
      return false;
    }
    if (!byReward) {
      return true;
    }
    const reward = rewardIn(card, rotation);
    return reward !== null && rewardMatches(reward, filters, descendants);
  });
}

/** Each shown week with the battlefields that pass every filter in it. */
export function weekMatches<T extends Battlefield>(
  cards: readonly T[],
  filters: RewardFilters,
  rotations: readonly number[],
  descendants: readonly RewardDescendant[],
): { readonly rotation: number; readonly matches: T[] }[] {
  return rotations.map((rotation) => ({
    rotation,
    matches: filterBattlefields(cards, filters, rotation, descendants),
  }));
}

/**
 * "Clear filters": every filter back to its default, keeping the week, which isn't a
 * filter, and the open battlefield, which clearing can only add cards around.
 */
export function clearedFilters(filters: RewardFilters): RewardFilters {
  return { ...defaultRewardFilters, week: filters.week, open: filters.open };
}
