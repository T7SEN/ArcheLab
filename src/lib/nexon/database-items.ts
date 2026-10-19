import "server-only";
import { cosmeticTypeName } from "@/data/cosmetics";
import { fellowArt, fellowPassiveOf, fellowPassives } from "@/data/fellows";
import { socketIconUrl } from "@/data/module-icons";
import { mutantCellSlug } from "@/data/mutant-cells";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import { vehicleKind } from "@/features/vehicles/vehicle-card";
import {
  cardDescendants,
  shownVersion,
} from "@/features/cosmetics/cosmetic-filters";
import type { DatabaseItem } from "@/features/database/database-items";
import { rarityOf } from "@/features/game-data/rarity";
import { versionTier } from "@/features/modules/module-tiers";
import { coreEquipment, rollNames } from "@/features/cores/core-filters";
import { fetchComponentGroups } from "@/lib/nexon/component-index";
import { fetchCoreKinds } from "@/lib/nexon/core-index";
import { fetchDifficultyRewards } from "@/lib/nexon/difficulty-rewards";
import { fetchAxionOperationalAreas } from "@/lib/nexon/axion-operational-areas";
import { fetchInfiltration400 } from "@/lib/nexon/infiltration-400";
import { fetchAmorphousPatterns } from "@/lib/nexon/amorphous-index";
import { fetchBasicMaterials } from "@/lib/nexon/basic-material-index";
import { fetchCoreMaterials } from "@/lib/nexon/core-material-index";
import { fetchCosmetics } from "@/lib/nexon/cosmetic-index";
import { fetchEnhancementMaterials } from "@/lib/nexon/enhancement-index";
import { fetchMiscellaneous } from "@/lib/nexon/miscellaneous-index";
import { fetchMutantCells } from "@/lib/nexon/mutant-cell-index";
import { fetchDescendantSummaries } from "@/lib/nexon/descendant-page";
import { fetchFellows } from "@/lib/nexon/fellow-index";
import { fetchVehicles } from "@/lib/nexon/vehicle-index";
import { fetchVoidErosionPurge } from "@/lib/nexon/void-erosion-purge";
import { bountyTargets, trials, wallCrasher } from "@/data/timers";
import { fetchModuleGroups } from "@/lib/nexon/module-index";
import { fetchReactorGroups } from "@/lib/nexon/reactor-index";
import { fetchWeaponSummaries } from "@/lib/nexon/weapon-page";
import { palette } from "@/styles/tokens";

/** The game's own color for Ultimate characters, verified in game (chat-tags.json). */
const ultimateColor =
  chatRegistry.tagsByName.get("ultimatecharacter")?.hex ?? palette.primary;

const present = (values: readonly (string | null)[]): string[] =>
  values.flatMap((value) => (value === null || value === "" ? [] : [value]));

/**
 * Every item the database page searches (ADR 0034), from the same sets as the pages,
 * each with its page or its details, a short note, words that find it, its art and its
 * tier's color. Fetched once per build; each set comes empty when NEXON can't be reached.
 */
export async function fetchDatabaseItems(): Promise<DatabaseItem[]> {
  const [
    descendants,
    weapons,
    modules,
    reactors,
    components,
    fellows,
    vehicles,
    mutantCells,
    cosmetics,
    amorphous,
    enhancement,
    basic,
    coreMaterials,
    cores,
    miscellaneous,
    rewards,
    operations400,
    axionMissions,
    purge,
  ] = await Promise.all([
    fetchDescendantSummaries(),
    fetchWeaponSummaries(),
    fetchModuleGroups(),
    fetchReactorGroups(),
    fetchComponentGroups(),
    fetchFellows(),
    fetchVehicles(),
    fetchMutantCells(),
    fetchCosmetics(),
    fetchAmorphousPatterns(),
    fetchEnhancementMaterials(),
    fetchBasicMaterials(),
    fetchCoreMaterials(),
    fetchCoreKinds(),
    fetchMiscellaneous(),
    fetchDifficultyRewards(),
    fetchInfiltration400(),
    fetchAxionOperationalAreas(),
    fetchVoidErosionPurge(),
  ]);

  const descendantItems = descendants.map((descendant): DatabaseItem => ({
    name: descendant.name,
    category: "Descendants",
    href: `/descendants/${descendant.slug}`,
    hint: descendant.ultimate ? "Ultimate" : "",
    keywords: ["Descendant", ...descendant.elements, ...descendant.archeTypes],
    imageUrl: descendant.imageUrl,
    hex: descendant.ultimate ? ultimateColor : palette.primary,
  }));

  const weaponItems = weapons.map((weapon): DatabaseItem => {
    const rarity = rarityOf(weapon.tier);
    return {
      name: weapon.name,
      category: "Weapons",
      href: `/weapons/${weapon.slug}`,
      hint: present([rarity?.name ?? null, weapon.type]).join(" · "),
      keywords: present(["weapon", weapon.rounds]),
      imageUrl: weapon.imageUrl,
      hex: rarity?.hex ?? palette.primary,
    };
  });

  const moduleItems = modules.flatMap((group): DatabaseItem[] => {
    // The version of its highest tier stands for the card, as on the modules index.
    const top = [...group.variants]
      .map((variant) => ({ variant, tier: versionTier(variant) }))
      .sort((a, b) => a.tier.rank - b.tier.rank)
      .at(0);
    if (top === undefined) {
      return [];
    }
    return [
      {
        name: group.name,
        category: "Modules",
        href: `/modules?module=${group.slug}`,
        hint: top.tier.name,
        keywords: [
          "module",
          ...new Set(
            group.variants.flatMap((variant) =>
              present([variant.category, variant.type, variant.socket]),
            ),
          ),
        ],
        imageUrl: top.variant.imageUrl,
        hex: top.tier.hex,
      },
    ];
  });

  const reactorItems = reactors.flatMap((group): DatabaseItem[] => {
    const top = group.versions.at(0);
    if (top === undefined) {
      return [];
    }
    return [
      {
        name: group.name,
        category: "Reactors",
        href: `/reactors?reactor=${group.slug}`,
        hint: present([group.attribute, group.archeType]).join(" · "),
        keywords: ["reactor"],
        imageUrl: top.imageUrl,
        hex: rarityOf(top.tier)?.hex ?? palette.primary,
      },
    ];
  });

  const componentItems = components.flatMap((group): DatabaseItem[] => {
    const top = group.pieces.at(0);
    if (top === undefined) {
      return [];
    }
    const tiers = [
      ...new Set(
        group.pieces.map((piece) => rarityOf(piece.tier)?.name ?? piece.tier),
      ),
    ];
    // The pieces' names without their slots: "Volcanic" finds Active Volcano.
    const names = new Set(
      group.pieces.map((piece) =>
        piece.name.endsWith(` ${piece.slot}`)
          ? piece.name.slice(0, -piece.slot.length - 1)
          : piece.name,
      ),
    );
    names.delete(group.name);
    return [
      {
        name: group.name,
        category: "External Components",
        href: `/external-components?component=${group.slug}`,
        hint:
          group.kind === "set"
            ? `Set · ${tiers.at(0) ?? ""}`
            : `${String(tiers.length)} tiers`,
        keywords: ["external component", ...tiers, ...names],
        imageUrl: top.imageUrl,
        hex: rarityOf(top.tier)?.hex ?? palette.primary,
      },
    ];
  });

  // Their art is the site's own files: NEXON's data has none (ADR 0035).
  const fellowItems = fellows.map((fellow): DatabaseItem => {
    const rarity = rarityOf(fellow.tier);
    const passive = fellowPassiveOf[fellow.name];
    const passiveName =
      passive === undefined ? null : fellowPassives[passive].name;
    return {
      name: fellow.name,
      category: "Fellows",
      href: `/fellows?fellow=${fellow.slug}`,
      hint: present([rarity?.name ?? null, passiveName]).join(" · "),
      keywords: present(["fellow", passiveName]),
      imageUrl: fellowArt[fellow.name] ?? "",
      hex: rarity?.hex ?? palette.primary,
    };
  });

  const vehicleItems = vehicles.map((vehicle): DatabaseItem => {
    const rarity = rarityOf(vehicle.tier);
    const kind = vehicleKind(vehicle);
    return {
      name: vehicle.name,
      category: "Vehicles",
      href: `/vehicles?vehicle=${vehicle.slug}`,
      hint: present([rarity?.name ?? null, kind]).join(" · "),
      keywords: ["vehicle", kind],
      imageUrl: vehicle.imageUrl,
      hex: rarity?.hex ?? palette.primary,
    };
  });

  // NEXON's Mutant Cells (ADR 0040), each with its icon (its socket's when NEXON lists
  // none).
  const mutantCellItems = mutantCells.map((cell): DatabaseItem => ({
    name: cell.name,
    category: "Mutant Cells",
    href: `/mutant-cells?cell=${mutantCellSlug(cell.name)}`,
    hint: cell.socket,
    keywords: ["Mutant Cell", "Arche Tuning"],
    imageUrl: cell.imageUrl ?? socketIconUrl(cell.socket) ?? "",
    hex: palette.primary,
  }));

  // Highest tier first, so the database page's Cosmetics card leads with Ultimate art.
  // A cosmetic's Descendants find it: "bunny pajamas" (ADR 0039).
  const descendantNames = new Map(
    cosmetics.descendants.map((descendant) => [
      descendant.slug,
      descendant.name,
    ]),
  );
  const cosmeticItems = cosmetics.cards
    .map((card) => ({
      card,
      rarity: card.tier === null ? null : rarityOf(card.tier),
    }))
    .sort(
      (a, b) =>
        (b.card.tier ?? "").localeCompare(a.card.tier ?? "", "en", {
          numeric: true,
        }) || a.card.name.localeCompare(b.card.name),
    )
    .map(({ card, rarity }): DatabaseItem => {
      const type = cosmeticTypeName(card.type);
      return {
        name: card.name,
        category: "Cosmetics",
        href: `/cosmetics?cosmetic=${card.slug}`,
        hint: rarity === null ? type : `${rarity.name} · ${type}`,
        keywords: card.everyone
          ? ["Cosmetic", "Every Descendant"]
          : [
              "Cosmetic",
              ...present(
                cardDescendants(card).map(
                  (slug) => descendantNames.get(slug) ?? null,
                ),
              ),
            ],
        imageUrl: shownVersion(card, null).imageUrl ?? "",
        hex: rarity?.hex ?? palette.mutedForeground,
      };
    });

  // Each pattern still in the game under its game name, with its tier, found by what
  // its rewards build too (ADR 0041).
  const amorphousItems = amorphous.patterns.map((pattern): DatabaseItem => {
    const rarity = rarityOf(pattern.tier);
    return {
      name: `Amorphous Material Pattern: ${pattern.name}`,
      category: "Amorphous Materials",
      href: `/amorphous-materials?pattern=${pattern.slug}`,
      hint: rarity?.name ?? "",
      keywords: [
        ...new Set(
          pattern.rewards.flatMap((reward) =>
            reward.build === null ? [] : [reward.build.name],
          ),
        ),
      ],
      imageUrl: pattern.imageUrl,
      hex: rarity?.hex ?? palette.primary,
    };
  });

  // Each regular Shape Stabilizer, found by what it researches (T7SEN, 2026-10-18).
  const stabilizerItems = amorphous.stabilizers.map(
    (stabilizer): DatabaseItem => {
      const rarity = rarityOf(stabilizer.tier);
      return {
        name: stabilizer.name,
        category: "Amorphous Materials",
        href: `/amorphous-materials?stabilizer=${stabilizer.slug}`,
        hint: rarity?.name ?? "",
        keywords: [
          "Shape Stabilizer",
          ...stabilizer.uses.map((use) => use.name),
        ],
        imageUrl: stabilizer.imageUrl,
        hex: rarity?.hex ?? palette.primary,
      };
    },
  );

  // Each enhancement material with its tier (ADR 0043).
  const enhancementItems = enhancement.map((item): DatabaseItem => {
    const rarity = item.tier === null ? null : rarityOf(item.tier);
    return {
      name: item.name,
      category: "Enhancement Materials",
      href: `/enhancement-materials?material=${item.slug}`,
      hint: rarity?.name ?? "",
      keywords: ["Enhancement Material", "Research"],
      imageUrl: item.imageUrl,
      hex: rarity?.hex ?? palette.primary,
    };
  });

  // Each basic material with its tier (ADR 0045). What it goes into doesn't find it: a
  // Descendant's name finds the Descendant, not every material it takes.
  const basicItems = basic.map((item): DatabaseItem => {
    const rarity = rarityOf(item.tier);
    return {
      name: item.name,
      category: "Basic Materials",
      href: `/basic-materials?material=${item.slug}`,
      hint: rarity?.name ?? "",
      keywords: ["Basic Material", "Material"],
      imageUrl: item.imageUrl,
      hex: rarity?.hex ?? palette.primary,
    };
  });

  // Each Core Material with its tier (ADR 0047), found by its name: a Descendant's name
  // finds the Descendant, and "bunny code" its Code.
  const coreMaterialItems = coreMaterials.map((item): DatabaseItem => {
    const rarity = rarityOf(item.tier);
    return {
      name: item.name,
      category: "Core Materials",
      href: `/core-materials?material=${item.slug}`,
      hint: rarity?.name ?? "",
      keywords: ["Core Material", "Material"],
      imageUrl: item.imageUrl,
      hex: rarity?.hex ?? palette.primary,
    };
  });

  // Each kind of core, found by its core items' names and what it rolls (ADR 0044). A
  // weapon's name finds the weapon, not every core it takes.
  const coreItems = cores.map((kind): DatabaseItem => ({
    name: kind.name,
    category: "Cores",
    href: `/cores?core=${kind.slug}`,
    hint:
      coreEquipment.find((entry) => entry.equipment === kind.equipment)
        ?.label ?? "",
    keywords: [
      "Core",
      ...new Set(
        kind.drops.flatMap((grade) =>
          grade.items.map((item) => item.name.replace(/ [IVX]+$/, "")),
        ),
      ),
      ...rollNames(kind.versions),
    ],
    imageUrl: kind.imageUrl,
    hex: palette.primary,
  }));

  // Each Miscellaneous item with its tier (ADR 0050), found by its name.
  const miscellaneousItems = miscellaneous.map((item): DatabaseItem => {
    const rarity = rarityOf(item.tier);
    return {
      name: item.name,
      category: "Miscellaneous",
      href: `/miscellaneous?item=${item.slug}`,
      hint: rarity?.name ?? "",
      keywords: ["Miscellaneous"],
      imageUrl: item.imageUrl,
      hex: rarity?.hex ?? palette.primary,
    };
  });

  // Each battlefield of the Difficulty Level Rewards, found by its region, missions,
  // outpost and Void Fusion Reactor (ADR 0048). It has no art of its own.
  const battlefieldItems = rewards.battlefields.map(
    (battlefield): DatabaseItem => ({
      name: battlefield.name,
      category: "Difficulty Level Rewards",
      href: `/difficulty-level-rewards?battlefield=${battlefield.slug}`,
      hint: battlefield.region,
      keywords: [
        "Battlefield",
        battlefield.region,
        ...battlefield.missions,
        ...(battlefield.outpost === null ? [] : [battlefield.outpost]),
        ...(battlefield.fusionReactor === null
          ? []
          : [battlefield.fusionReactor]),
      ],
      imageUrl: "",
      hex: palette.primary,
    }),
  );

  // Each Infiltration Operation that has a 400% difficulty, found by its region (ADR
  // 0049). It has no art of its own.
  const operation400Items = operations400.map((operation): DatabaseItem => ({
    name: operation.name,
    category: "400% Infiltration Operations",
    href: `/infiltration-400?operation=${operation.slug}`,
    hint: operation.region,
    keywords: ["400%", "Infiltration Operation", operation.region],
    imageUrl: "",
    hex: palette.primary,
  }));

  // Each Axion Operational Area mission, found by the pattern its completion gives (ADR
  // 0052). It has no art of its own.
  const axionItems = axionMissions.map((mission): DatabaseItem => ({
    name: mission.name,
    category: "Axion Operational Areas",
    href: `/axion-operational-areas?mission=${mission.slug}`,
    hint: "Axion Plains",
    keywords: [
      "Axion Plains",
      "Operational Area",
      ...(mission.pattern === null ? [] : [mission.pattern.name]),
    ],
    imageUrl: "",
    hex: palette.primary,
  }));

  // Each of Void Erosion Purge's Stage 10 maps, with its picture (ADR 0053).
  const purgeItems = purge.maps.map((map): DatabaseItem => ({
    name: map.name,
    category: "Void Erosion Purge",
    href: `/void-erosion-purge?map=${map.slug}`,
    hint: "Normal Stage 10",
    keywords: ["Void Erosion Purge", "Stage 10", "map"],
    imageUrl: map.imageUrl,
    hex: palette.primary,
  }));

  // The Timers page's timers, each opening its own (ADR 0054); the bounty targets find
  // Bounty Operations.
  const timerItems = (
    [
      [
        wallCrasher.name,
        "wall-crasher",
        "Every hour",
        ["Axion Plains", "Intercept Battle"],
      ],
      ["ETA-0", "eta-0", "Friday to Monday", ["shop", "Albion"]],
      ["Daily reset", "daily-reset", "07:00 UTC", ["reset"]],
      ["Weekly reset", "weekly-reset", "Thursday", ["reset"]],
      [
        "Bounty Operations",
        "bounty-operations",
        "A target each day",
        bountyTargets.map((target) => target.name),
      ],
      [
        "Trials",
        "trials",
        trials.paused.showing,
        trials.dungeons.map((dungeon) => dungeon.legion),
      ],
      [
        "HQ Special Orders",
        "hq-special-orders",
        "Every three days",
        ["orders"],
      ],
    ] as const
  ).map(([name, anchor, hint, keywords]): DatabaseItem => ({
    name,
    category: "Timers",
    href: `/timers#${anchor}`,
    hint,
    keywords: ["timer", ...keywords],
    imageUrl: "",
    hex: palette.primary,
  }));

  return [
    ...descendantItems,
    ...weaponItems,
    ...moduleItems,
    ...reactorItems,
    ...componentItems,
    ...fellowItems,
    ...vehicleItems,
    ...mutantCellItems,
    ...cosmeticItems,
    ...amorphousItems,
    ...stabilizerItems,
    ...enhancementItems,
    ...basicItems,
    ...coreMaterialItems,
    ...coreItems,
    ...miscellaneousItems,
    ...battlefieldItems,
    ...operation400Items,
    ...axionItems,
    ...purgeItems,
    ...timerItems,
  ];
}
