import "server-only";
import { z } from "zod";
import {
  battlefieldMissions,
  tableBattlefieldAliases,
  tableRegionAliases,
} from "@/data/battlefield-missions";
import {
  fusionReactorAliases,
  outpostAliases,
} from "@/data/difficulty-rewards";
import { patternPrefix } from "@/features/amorphous/amorphous-filters";
import { plainCoreKinds } from "@/features/cores/core-filters";
import type {
  BattlefieldDropsFile,
  Difficulty,
  DropItem,
  PlaceDrops,
} from "@/features/difficulty-rewards/battlefield-drops";
import {
  fold,
  pairOf,
  type Battlefield,
  type Reward,
  type RewardDescendant,
  type RewardRegion,
} from "@/features/difficulty-rewards/reward-filters";
import { rotationAt } from "@/features/difficulty-rewards/reward-week";
import { slugOf } from "@/lib/slug";
import { fetchAmorphousPatterns } from "./amorphous-index";
import { slotOrder } from "./component-index";
import { fetchCoreKinds } from "./core-index";
import {
  fetchDescendantSkillTypes,
  type DescendantSkillTypes,
} from "./descendant-page";
import { fetchEnhancementMaterials } from "./enhancement-index";
import { materialHref } from "./material-links";
import { fetchMetadataSet } from "./metadata";
import { reactorMatch } from "./reactor-index";
import {
  fetchAcquisitions,
  fetchMaterials,
  fetchResearch,
  numericId,
  sourceText,
  type AcquisitionRecord,
  type MaterialRecord,
  type ResearchRecord,
} from "./shared-sets";

/**
 * The Difficulty Level Rewards page (ADR 0048): every battlefield of the eight regions
 * with its reward each week, from `reward.json` (the game's "Difficulty Level Rewards"),
 * its Hard battlefield missions from Update 1.4.0's table, and what drops in its
 * missions, Vulgus Strategic Outpost and Void Fusion Reactor, from the drop places
 * (`acquisition-detail.json`) and the materials that name them.
 */

const rewardRowSchema = z.object({
  rotation: z.number().int().positive(),
  reward_type: z.string().min(1),
  reactor_element_type: z.string().nullable(),
  arche_type: z.string().nullable(),
});

const rewardMapSchema = z.object({
  map_id: numericId,
  map_name: z.string().min(1),
  battle_zone: z
    .array(
      z.object({
        battle_zone_id: z.string().min(1),
        battle_zone_name: z.string().min(1),
        reward: z.array(rewardRowSchema),
      }),
    )
    .nullable(),
});

export type RewardMapRecord = z.infer<typeof rewardMapSchema>;

export interface DifficultyRewardSets {
  readonly rewards: readonly RewardMapRecord[];
  readonly acquisitions: readonly AcquisitionRecord[];
  readonly materials: readonly MaterialRecord[];
  readonly research: readonly ResearchRecord[];
  readonly descendants: readonly DescendantSkillTypes[];
  /** Pages for drops that aren't Basic or Core Materials, by item name. */
  readonly itemHrefs: ReadonlyMap<string, string>;
}

export interface DifficultyRewards {
  /** In Update 1.4.0's table order; empty when the reward list fails its checks. */
  readonly battlefields: readonly Battlefield[];
  readonly regions: readonly RewardRegion[];
  /** The weeks shipped, from the build's own on, earliest first. */
  readonly rotations: readonly number[];
  readonly attributes: readonly string[];
  readonly archeTypes: readonly string[];
  readonly slots: readonly string[];
  readonly descendants: readonly RewardDescendant[];
  /** Each battlefield's drops, by its address, for its data file. */
  readonly drops: ReadonlyMap<string, BattlefieldDropsFile>;
  /**
   * Each drop place of a battlefield, by its NEXON id, with the battlefield's address:
   * every page that lists where an item drops links its places here (ADR 0050).
   */
  readonly placeBattlefields: ReadonlyMap<string, string>;
}

/** The Descendants index's orders; anything new follows, A–Z. */
const attributeOrder = ["Fire", "Chill", "Electric", "Toxic", "Non-Attribute"];
const archeOrder = ["Fusion", "Singular", "Dimension", "Tech"];

function ordered(values: Iterable<string>, order: readonly string[]): string[] {
  const rank = (value: string) => {
    const at = order.indexOf(value);
    return at === -1 ? order.length : at;
  };
  return [...new Set(values)].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );
}

/** The ways an item comes, in the game's order, then any other A–Z. */
const wayOrder = ["complete", "Mission Monster", "Support Complete"];

/** A drop place as the game names it: "[Vespers] [Hard] - [Lakeside] complete". */
const placePattern = /^\[([^\]]+)\] \[(Normal|Hard)\] - \[(.+)\] (.+)$/;

const placeKinds: Readonly<Partial<Record<string, PlaceDrops["kind"]>>> = {
  BaseMission: "mission",
  RouteMission: "mission",
  VulgusPostField: "outpost",
  VoidFusionField: "fusion-reactor",
};

const outpostSuffix = ": Vulgus Strategic Outpost";
const fusionPrefix = "Void Fusion Reactor - ";

/** Where a drop place sits: its battlefield, difficulty and place, and the way. */
interface PlaceKey {
  readonly battlefield: string;
  readonly difficulty: Difficulty;
  readonly place: string;
  readonly kind: PlaceDrops["kind"];
  readonly way: string;
}

/** A reward row as the page knows it, or a problem with it. */
function rewardOf(row: z.infer<typeof rewardRowSchema>): Reward | string {
  if (row.reward_type === "Reactor") {
    return row.reactor_element_type === null || row.arche_type === null
      ? `a Reactor reward without an attribute or Arche type (rotation ${String(row.rotation)})`
      : {
          kind: "reactor",
          attribute: row.reactor_element_type,
          archeType: row.arche_type,
        };
  }
  return slotOrder.includes(row.reward_type)
    ? { kind: "component", slot: row.reward_type }
    : `an unknown reward type "${row.reward_type}"`;
}

/** Pure, for the tests: everything the page and its data files need. */
export function difficultyRewards(
  sets: DifficultyRewardSets,
  buildRotation: number,
): DifficultyRewards {
  const empty: DifficultyRewards = {
    battlefields: [],
    regions: [],
    rotations: [],
    attributes: [],
    archeTypes: [],
    slots: [],
    descendants: [],
    drops: new Map(),
    placeBattlefields: new Map(),
  };
  const problems: string[] = [];
  const zones = new Map<string, Map<number, Reward>>();
  for (const map of sets.rewards) {
    for (const zone of map.battle_zone ?? []) {
      if (zone.reward.length === 0) {
        continue;
      }
      const weeks = new Map<number, Reward>();
      for (const row of zone.reward) {
        const reward = rewardOf(row);
        if (typeof reward === "string") {
          problems.push(`${zone.battle_zone_name}: ${reward}`);
        } else if (weeks.has(row.rotation)) {
          problems.push(
            `${zone.battle_zone_name}: two rewards in rotation ${String(row.rotation)}`,
          );
        } else {
          weeks.set(row.rotation, reward);
        }
      }
      zones.set(`${map.map_name}|${zone.battle_zone_name}`, weeks);
    }
  }
  const allRotations = new Set(
    [...zones.values()].flatMap((weeks) => [...weeks.keys()]),
  );
  for (const [key, weeks] of zones) {
    if (weeks.size !== allRotations.size) {
      problems.push(`${key}: not one reward in every rotation`);
    }
  }
  if (zones.size === 0) {
    problems.push("no battlefield has rewards");
  }
  if (problems.length > 0) {
    for (const problem of problems) {
      console.warn(`NEXON reward.json: ${problem}. The page shows none.`);
    }
    return empty;
  }
  const rotations = [...allRotations]
    .filter((rotation) => rotation >= buildRotation)
    .sort((a, b) => a - b);
  if (rotations.length < 4) {
    console.warn(
      `NEXON reward.json: ${String(rotations.length)} weeks left from this build's; the page says "not published yet" after them.`,
    );
  }

  // The table's battlefields, joined to the reward list by region and name.
  const regionOf = (name: string) => tableRegionAliases[name] ?? name;
  const nameOf = (name: string) => tableBattlefieldAliases[name] ?? name;
  const joined = battlefieldMissions.flatMap((entry) => {
    const region = regionOf(entry.region);
    const name = nameOf(entry.battlefield);
    const weeks = zones.get(`${region}|${name}`);
    if (weeks === undefined) {
      console.warn(
        `Difficulty Level Rewards: ${region}, ${name} has no rewards; it's left out.`,
      );
      return [];
    }
    zones.delete(`${region}|${name}`);
    return [
      { region, name, slug: slugOf(name), missions: entry.missions, weeks },
    ];
  });
  for (const key of zones.keys()) {
    console.warn(
      `Difficulty Level Rewards: ${key} is in the reward list but not in Update 1.4.0's table; it's left out.`,
    );
  }

  // Each drop place of a mission, outpost or Void Fusion Reactor, by its id.
  const missionHome = new Map(
    joined.flatMap((entry) =>
      entry.missions.map((mission) => [
        `${entry.region}|${mission}`,
        entry.slug,
      ]),
    ),
  );
  const named = new Map(
    joined.map((entry) => [`${entry.region}|${entry.name}`, entry.slug]),
  );
  const places = new Map<string, PlaceKey>();
  for (const record of sets.acquisitions) {
    const kind = placeKinds[record.acquisition_detail_id.split(":")[1] ?? ""];
    const match = placePattern.exec(sourceText(record.acquisition_detail_name));
    if (kind === undefined || match === null) {
      continue;
    }
    const [, region = "", difficulty = "", place = "", way = ""] = match;
    let battlefield: string | undefined;
    if (kind === "mission") {
      battlefield = missionHome.get(`${region}|${place}`);
    } else if (kind === "outpost" && place.endsWith(outpostSuffix)) {
      const name = place.slice(0, -outpostSuffix.length);
      battlefield = named.get(`${region}|${outpostAliases[name] ?? name}`);
    } else if (kind === "fusion-reactor") {
      const prefix = `${fusionPrefix}${region} `;
      const name = place.startsWith(prefix) ? place.slice(prefix.length) : "";
      battlefield = named.get(
        `${region}|${fusionReactorAliases[name] ?? name}`,
      );
    }
    if (battlefield === undefined) {
      // Missions of Axion Plains and other places off the table belong elsewhere.
      if (kind !== "mission") {
        console.warn(
          `Difficulty Level Rewards: no battlefield for "[${region}] ${place}".`,
        );
      }
      continue;
    }
    places.set(record.acquisition_detail_id, {
      battlefield,
      difficulty: difficulty as Difficulty,
      place,
      kind,
      way,
    });
  }

  // What drops at each place: every material that names it, A–Z, with its ways.
  const items = new Map<string, Map<string, Set<string>>>();
  const hrefs = new Map<string, string | null>();
  const placeId = (key: PlaceKey) =>
    `${key.battlefield}|${key.difficulty}|${key.place}`;
  for (const key of places.values()) {
    items.set(
      placeId(key),
      items.get(placeId(key)) ?? new Map<string, Set<string>>(),
    );
  }
  for (const material of sets.materials) {
    for (const id of material.acquisition_detail) {
      const key = places.get(id);
      if (key === undefined) {
        continue;
      }
      const name = material.consumable_material_name;
      const at = items.get(placeId(key)) ?? new Map<string, Set<string>>();
      at.set(name, (at.get(name) ?? new Set()).add(key.way));
      items.set(placeId(key), at);
      if (!hrefs.has(name)) {
        hrefs.set(
          name,
          materialHref(material.consumable_material_id, name, sets) ??
            sets.itemHrefs.get(name) ??
            null,
        );
      }
    }
  }
  const wayRank = (way: string) => {
    const at = wayOrder.indexOf(way);
    return at === -1 ? wayOrder.length : at;
  };
  const kindRank: Readonly<Record<PlaceDrops["kind"], number>> = {
    mission: 0,
    outpost: 1,
    "fusion-reactor": 2,
  };
  const drops = new Map<string, BattlefieldDropsFile>();
  const outposts = new Map<string, string>();
  const reactors = new Map<string, string>();
  for (const entry of joined) {
    const file: Record<Difficulty, PlaceDrops[]> = { Normal: [], Hard: [] };
    const seen = new Set<string>();
    for (const key of places.values()) {
      if (key.battlefield !== entry.slug || seen.has(placeId(key))) {
        continue;
      }
      seen.add(placeId(key));
      if (key.kind === "outpost") {
        outposts.set(entry.slug, key.place);
      } else if (key.kind === "fusion-reactor") {
        reactors.set(entry.slug, key.place);
      }
      const found = items.get(placeId(key)) ?? new Map<string, Set<string>>();
      file[key.difficulty].push({
        place: `[${key.place}]`,
        kind: key.kind,
        items: [...found]
          .map(([name, ways]): DropItem => ({
            name,
            href: hrefs.get(name) ?? null,
            ways: [...ways].sort(
              (a, b) => wayRank(a) - wayRank(b) || a.localeCompare(b),
            ),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
    // Missions in the table's order, then the outpost, then the Void Fusion Reactor.
    const missionRank = (place: string) =>
      entry.missions.indexOf(place.slice(1, -1));
    for (const difficulty of ["Normal", "Hard"] as const) {
      file[difficulty].sort(
        (a, b) =>
          kindRank[a.kind] - kindRank[b.kind] ||
          missionRank(a.place) - missionRank(b.place),
      );
    }
    drops.set(entry.slug, file);
  }

  const battlefields = joined.map((entry): Battlefield => {
    const file = drops.get(entry.slug);
    const dropNames = file
      ? [...file.Normal, ...file.Hard].flatMap((place) =>
          place.items.map((item) => item.name),
        )
      : [];
    const outpost = outposts.get(entry.slug) ?? null;
    const fusionReactor = reactors.get(entry.slug) ?? null;
    return {
      slug: entry.slug,
      name: entry.name,
      region: entry.region,
      regionSlug: slugOf(entry.region),
      rewards: rotations.flatMap((rotation) => {
        const reward = entry.weeks.get(rotation);
        return reward === undefined ? [] : [{ rotation, reward }];
      }),
      missions: entry.missions,
      outpost,
      fusionReactor,
      searchText: fold(
        [
          entry.name,
          entry.region,
          ...entry.missions,
          outpost ?? "",
          fusionReactor ?? "",
          ...new Set(dropNames),
        ].join(" "),
      ),
    };
  });
  if (
    new Set(battlefields.map((entry) => entry.slug)).size !==
    battlefields.length
  ) {
    console.warn(
      "Difficulty Level Rewards: two battlefields share an address.",
    );
  }

  const rewards = battlefields.flatMap((entry) =>
    entry.rewards.map((week) => week.reward),
  );
  const pairs = new Set(
    rewards.flatMap((reward) =>
      reward.kind === "reactor"
        ? [pairOf(reward.attribute, reward.archeType)]
        : [],
    ),
  );
  return {
    battlefields,
    regions: [
      ...new Map(
        battlefields.map((entry) => [
          entry.regionSlug,
          { slug: entry.regionSlug, name: entry.region },
        ]),
      ).values(),
    ],
    rotations,
    attributes: ordered(
      rewards.flatMap((reward) =>
        reward.kind === "reactor" ? [reward.attribute] : [],
      ),
      attributeOrder,
    ),
    archeTypes: ordered(
      rewards.flatMap((reward) =>
        reward.kind === "reactor" ? [reward.archeType] : [],
      ),
      archeOrder,
    ),
    slots: ordered(
      rewards.flatMap((reward) =>
        reward.kind === "component" ? [reward.slot] : [],
      ),
      slotOrder,
    ),
    descendants: sets.descendants.map((descendant) => ({
      slug: descendant.slug,
      name: descendant.name,
      pairs: [...pairs].filter((pair) => {
        const [attribute = "", archeType = ""] = pair.split("|");
        return reactorMatch(descendant, attribute, archeType);
      }),
    })),
    drops,
    placeBattlefields: new Map(
      [...places].map(([id, key]) => [id, key.battlefield]),
    ),
  };
}

/**
 * Pages for drops that aren't Basic or Core Materials, by the item's name; also used by
 * the 400% Infiltration Operations page (ADR 0049).
 */
export async function fetchItemHrefs(): Promise<Map<string, string>> {
  const [amorphous, enhancement, cores] = await Promise.all([
    fetchAmorphousPatterns(),
    fetchEnhancementMaterials(),
    fetchCoreKinds(),
  ]);
  return new Map([
    // The boxes that give Transcendent weapons (Update 1.4.0 and 1.4.5).
    ["Transcendent Weapon Loot", "/weapons?tier=Transcendent"],
    ...amorphous.patterns.map((pattern): [string, string] => [
      `${patternPrefix}${pattern.name}`,
      `/amorphous-materials?pattern=${pattern.slug}`,
    ]),
    ...enhancement.map((item): [string, string] => [
      item.name,
      `/enhancement-materials?material=${item.slug}`,
    ]),
    ...cores.flatMap((kind) =>
      kind.drops.flatMap((grade) =>
        grade.items.flatMap((item): [string, string][] => {
          const href = `/cores?core=${kind.slug}`;
          const plain = item.name.replace(" (Variant AB) ", " ");
          return plainCoreKinds.has(kind.slug) && plain !== item.name
            ? [
                [item.name, href],
                [plain, href],
              ]
            : [[item.name, href]];
        }),
      ),
    ),
  ]);
}

let mapNamesPromise: Promise<ReadonlySet<string>> | null = null;

/**
 * Every map name in the reward list, which names instanced maps too: the Void Erosion
 * Purge page checks its five against it (ADR 0053). Empty when the list fails to load.
 */
export function fetchRewardMapNames(): Promise<ReadonlySet<string>> {
  mapNamesPromise ??= fetchMetadataSet("reward", rewardMapSchema).then(
    (maps) => new Set(maps.map((map) => map.map_name)),
  );
  return mapNamesPromise;
}

let schedulePromise: Promise<DifficultyRewards> | null = null;

/**
 * The page's battlefields, weeks and drop places without what drops there (ADR 0050):
 * the reward list, the drop places and the Descendants alone. The material pages link
 * their drop places with it, and the Reactors, External Components and Descendant pages
 * their rewards; the Amorphous, Enhancement and Cores indexes feed `fetchItemHrefs`,
 * so this can't wait for `fetchDifficultyRewards`. Its checks warn again in the log.
 */
export function fetchRewardSchedule(): Promise<DifficultyRewards> {
  schedulePromise ??= Promise.all([
    fetchMetadataSet("reward", rewardMapSchema),
    fetchAcquisitions(),
    fetchDescendantSkillTypes(),
  ]).then(([rewards, acquisitions, descendants]) =>
    difficultyRewards(
      {
        rewards,
        acquisitions,
        materials: [],
        research: [],
        descendants,
        itemHrefs: new Map(),
      },
      rotationAt(Date.now()),
    ),
  );
  return schedulePromise;
}

let indexPromise: Promise<DifficultyRewards> | null = null;

/** The page's data, fetched once per build worker, from the build's own week on. */
export function fetchDifficultyRewards(): Promise<DifficultyRewards> {
  indexPromise ??= Promise.all([
    fetchMetadataSet("reward", rewardMapSchema),
    fetchAcquisitions(),
    fetchMaterials(),
    fetchResearch(),
    fetchDescendantSkillTypes(),
    fetchItemHrefs(),
  ]).then(
    ([rewards, acquisitions, materials, research, descendants, itemHrefs]) =>
      difficultyRewards(
        { rewards, acquisitions, materials, research, descendants, itemHrefs },
        // The build's own week: the Monday build runs before Tuesday's change.
        rotationAt(Date.now()),
      ),
  );
  return indexPromise;
}
