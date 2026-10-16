import { moduleTypeTier } from "@/data/module-tiers";
import { chatRegistry } from "@/features/chat/ui/chat-registry";

export interface Rarity {
  /** The game's rarity name, such as "Transcendent". */
  readonly name: string;
  /** The tier's color, verified in game for the `<tierN>` chat tags. */
  readonly hex: string;
}

/**
 * A NEXON tier id ("Tier4") as the game names and colors it. Both come from the chat
 * registry's `<tier1>` to `<tier4>` tags, verified in game (SKILL.md section 6: one
 * source for rarity colors). An unknown tier has no rarity.
 */
export function rarityOf(tierId: string): Rarity | null {
  const tag = chatRegistry.tagsByName.get(tierId.toLowerCase());
  const name =
    tag === undefined ? undefined : /\((\w+) rarity\)/.exec(tag.label)?.[1];
  const hex = tag?.hex ?? null;
  return hex === null || name === undefined ? null : { name, hex };
}

/**
 * A module's tier as the game names and colors it: Ancestors or Trigger for those
 * modules, tiers of their own in the color of the rarity they share it with
 * (`src/data/module-tiers.ts`), otherwise its rarity.
 */
export function moduleTierOf(
  tierId: string,
  moduleType: string | null,
): Rarity | null {
  const own = moduleTypeTier(moduleType);
  if (own === null) {
    return rarityOf(tierId);
  }
  const color = rarityOf(own.colorOf);
  return color === null ? null : { name: own.name, hex: color.hex };
}
