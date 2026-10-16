import { moduleTypeTiers } from "@/data/module-tiers";
import { moduleTierOf } from "@/features/game-data/rarity";
import { palette } from "@/styles/tokens";

/**
 * Module tiers as every list shows them (ADR 0025): the modules index, the command
 * palette's list and the home page. Names and colors come from the chat registry
 * (`moduleTierOf`), so call these on the server: the client never loads the registry.
 */

/** What a tier needs of a module version. */
interface TierSource {
  /** NEXON's tier id, such as "Tier4". */
  readonly tier: string;
  readonly type: string | null;
}

export interface ModuleTierOption {
  readonly name: string;
  readonly hex: string;
}

const tierNumber = (tier: string) => Number(tier.replace(/\D/g, "")) || 0;

/**
 * A version's tier: its name, its color, and its place in tier order: Ancestors, then
 * Trigger, then Tier4 down to Tier1 (T7SEN, 2026-10-16).
 */
export function versionTier(
  version: TierSource,
): ModuleTierOption & { readonly rank: number } {
  const tier = moduleTierOf(version.tier, version.type);
  const own = moduleTypeTiers.findIndex((entry) => entry.name === tier?.name);
  return {
    name: tier?.name ?? version.tier,
    hex: tier?.hex ?? palette.primary,
    rank:
      own === -1
        ? moduleTypeTiers.length + 100 - tierNumber(version.tier)
        : own,
  };
}

/** The tiers these versions have, each once, in tier order. */
export function tierOptions(
  versions: readonly TierSource[],
): ModuleTierOption[] {
  return [
    ...new Map(
      versions
        .map(versionTier)
        .sort((a, b) => a.rank - b.rank)
        .map((tier) => [tier.name, { name: tier.name, hex: tier.hex }]),
    ).values(),
  ];
}
