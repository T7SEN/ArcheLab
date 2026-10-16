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
