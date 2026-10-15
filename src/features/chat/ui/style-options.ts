import type { ChatRegistry, Style, TagEntry } from "@/features/chat/engine";
import { closeTag, openTag } from "@/features/chat/engine/serialize";
import { contrastRatio, minimumTextContrast } from "./contrast";
import { lookOf, type StyleLook } from "./style-look";

export type StyleGroupId =
  "common" | "rarity" | "grays" | "quest" | "more" | "text" | "sizes";

export interface StyleOption {
  /** Stable key, such as `tag:red` or `size:ChatSender_Big`. */
  readonly key: string;
  readonly style: Style;
  /** The name as written in markup. */
  readonly name: string;
  readonly label: string;
  readonly look: StyleLook;
  /** Characters the opening and closing tags add to a message. */
  readonly cost: number;
  /** Contrast against the chat background. */
  readonly contrast: number;
  readonly lowContrast: boolean;
  /** Longer tag names that render exactly the same. */
  readonly sameAs: readonly string[];
}

export interface StyleGroup {
  readonly id: StyleGroupId;
  readonly title: string;
  readonly options: readonly StyleOption[];
}

const groupTitles: Record<StyleGroupId, string> = {
  common: "Common colors",
  rarity: "Rarity",
  grays: "Grays",
  quest: "Quest colors",
  more: "More colors",
  text: "Bold and italic",
  sizes: "Text sizes",
};

/** The color tags players report most, across languages (SPEC.md section 4.1). */
const commonNames = new Set([
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "lightblue",
  "field",
  "default",
  "peagreen",
  "friendly",
  "enemy",
  "guide",
]);

function colorGroupOf(name: string): StyleGroupId {
  if (commonNames.has(name)) {
    return "common";
  }
  if (/^tier\d$/.test(name)) {
    return "rarity";
  }
  if (/^Gray\d0$/.test(name)) {
    return "grays";
  }
  if (/^Quest[A-Z]/.test(name)) {
    return "quest";
  }
  return "more";
}

export function styleKey(style: Style): string {
  return style.type === "tag" ? `tag:${style.name}` : `size:${style.id}`;
}

function lookKey(tag: TagEntry): string {
  return `${tag.hex ?? "none"}|${tag.weight}|${tag.slant}`;
}

function option(
  style: Style,
  name: string,
  label: string,
  sameAs: readonly string[],
  registry: ChatRegistry,
): StyleOption {
  const look = lookOf(style, registry);
  const contrast = contrastRatio(
    look.color ?? registry.data.chatBackground.hex,
    registry.data.chatBackground.hex,
  );
  return {
    key: styleKey(style),
    style,
    name,
    label,
    look,
    cost: openTag(style).length + closeTag.length,
    contrast,
    lowContrast: contrast < minimumTextContrast,
    sameAs,
  };
}

/**
 * The style picker's groups. A run holds exactly one style, so bold, italic and the
 * text sizes are styles like the colors. Tags that render exactly the same appear
 * once, under the shortest name, which is also what the optimizer writes. A look
 * belongs to the group of its first registry entry, so white sits with the common
 * colors as `Plain`.
 */
export function styleGroups(registry: ChatRegistry): StyleGroup[] {
  const looks = new Map<string, TagEntry[]>();
  for (const tag of registry.data.tags) {
    const entries = looks.get(lookKey(tag)) ?? [];
    entries.push(tag);
    looks.set(lookKey(tag), entries);
  }
  const grouped = new Map<StyleGroupId, StyleOption[]>();
  const add = (group: StyleGroupId, entry: StyleOption): void => {
    const options = grouped.get(group) ?? [];
    options.push(entry);
    grouped.set(group, options);
  };
  for (const entries of looks.values()) {
    // Every list holds at least the tag that created it.
    const [first] = entries;
    const shortest = entries.reduce((best, tag) =>
      tag.name.length < best.name.length ? tag : best,
    );
    const sameAs = entries
      .filter((tag) => tag !== shortest)
      .map((tag) => tag.name);
    const group = first.kind === "style" ? "text" : colorGroupOf(first.name);
    add(
      group,
      option(
        { type: "tag", name: shortest.name },
        shortest.name,
        shortest.label,
        sameAs,
        registry,
      ),
    );
  }
  for (const size of registry.data.sizes) {
    add(
      "sizes",
      option({ type: "size", id: size.id }, size.id, size.label, [], registry),
    );
  }
  return Object.entries(groupTitles).flatMap(([id, title]) => {
    const options = grouped.get(id as StyleGroupId) ?? [];
    return options.length === 0
      ? []
      : [{ id: id as StyleGroupId, title, options }];
  });
}
