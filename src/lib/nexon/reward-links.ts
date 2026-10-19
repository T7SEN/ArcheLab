import "server-only";
import {
  defaultRewardFilters,
  pairOf,
  rewardFiltersToSearch,
  type RewardFilters,
} from "@/features/difficulty-rewards/reward-filters";
import { slugOf } from "@/lib/slug";
import {
  fetchRewardSchedule,
  type DifficultyRewards,
} from "./difficulty-rewards";

/**
 * Links to the Difficulty Level Rewards page from the pages its rewards belong to
 * (T7SEN, 2026-10-18; ADR 0050): a reactor's attribute and Arche type, an external
 * component's slot and the reactors that suit a Descendant, each picked on the page, and
 * each only when a week the build shipped rewards it.
 */
export interface RewardLinks {
  /** For a reactor's attribute and Arche type, or null. */
  readonly reactor: (
    attribute: string | null,
    archeType: string | null,
  ) => string | null;
  /** By slot name as the reward list writes it: "Auxiliary Power". */
  readonly slots: Readonly<Record<string, string>>;
  /** For the reactors that suit a Descendant, by its address, or null. */
  readonly descendant: (slug: string) => string | null;
}

const pagePath = "/difficulty-level-rewards";

const hrefOf = (change: Partial<RewardFilters>) =>
  `${pagePath}${rewardFiltersToSearch({ ...defaultRewardFilters, ...change })}`;

/** Pure, for the tests: the links from the page's battlefields, slots and Descendants. */
export function rewardLinksFrom(
  schedule: Pick<DifficultyRewards, "battlefields" | "slots" | "descendants">,
): RewardLinks {
  const pairs = new Set(
    schedule.battlefields.flatMap((battlefield) =>
      battlefield.rewards.flatMap((week) =>
        week.reward.kind === "reactor"
          ? [pairOf(week.reward.attribute, week.reward.archeType)]
          : [],
      ),
    ),
  );
  return {
    reactor: (attribute, archeType) =>
      attribute !== null &&
      archeType !== null &&
      pairs.has(pairOf(attribute, archeType))
        ? hrefOf({ attribute, archeType })
        : null,
    slots: Object.fromEntries(
      schedule.slots.map((slot) => [slot, hrefOf({ slot: slugOf(slot) })]),
    ),
    descendant: (slug) =>
      schedule.descendants.some(
        (descendant) =>
          descendant.slug === slug &&
          descendant.pairs.some((pair) => pairs.has(pair)),
      )
        ? hrefOf({ descendant: slug })
        : null,
  };
}

let linksPromise: Promise<RewardLinks> | null = null;

/** The links, fetched once per build worker; none when the reward list can't be read. */
export function fetchRewardLinks(): Promise<RewardLinks> {
  linksPromise ??= fetchRewardSchedule().then(rewardLinksFrom);
  return linksPromise;
}
