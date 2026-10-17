import "server-only";
import { cosmeticTypeName } from "@/data/cosmetics";
import { fellowArt, fellowPassiveOf, fellowPassives } from "@/data/fellows";
import { socketIconUrl } from "@/data/module-icons";
import {
  mutantCellImageUrl,
  mutantCells,
  mutantCellSlug,
} from "@/data/mutant-cells";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import { vehicleKind } from "@/features/vehicles/vehicle-card";
import {
  cardDescendants,
  shownVersion,
} from "@/features/cosmetics/cosmetic-filters";
import type { DatabaseItem } from "@/features/database/database-items";
import { rarityOf } from "@/features/game-data/rarity";
import { versionTier } from "@/features/modules/module-tiers";
import { fetchComponentGroups } from "@/lib/nexon/component-index";
import { fetchCosmetics } from "@/lib/nexon/cosmetic-index";
import { fetchDescendantSummaries } from "@/lib/nexon/descendant-page";
import { fetchFellows } from "@/lib/nexon/fellow-index";
import { fetchVehicles } from "@/lib/nexon/vehicle-index";
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
    cosmetics,
  ] = await Promise.all([
    fetchDescendantSummaries(),
    fetchWeaponSummaries(),
    fetchModuleGroups(),
    fetchReactorGroups(),
    fetchComponentGroups(),
    fetchFellows(),
    fetchVehicles(),
    fetchCosmetics(),
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

  // The site's own data, from the update notes (ADR 0038), each with its icon (its
  // socket's when none is listed).
  const mutantCellItems = mutantCells.map((cell): DatabaseItem => ({
    name: cell.name,
    category: "Mutant Cells",
    href: `/mutant-cells?cell=${mutantCellSlug(cell.name)}`,
    hint: cell.socket,
    keywords: ["Mutant Cell", "Arche Tuning"],
    imageUrl: mutantCellImageUrl(cell.name) ?? socketIconUrl(cell.socket) ?? "",
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
  ];
}
