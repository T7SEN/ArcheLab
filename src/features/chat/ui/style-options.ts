import type { ChatRegistry, Style, TagEntry } from "@/features/chat/engine";
import { closeTag, openTag } from "@/features/chat/engine/serialize";
import { contrastRatio, minimumTextContrast } from "./contrast";
import { lookOf, type StyleLook } from "./style-look";

export type StyleGroupId = "colors" | "rarity" | "neutrals" | "text" | "sizes";

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
  colors: "Colors",
  rarity: "Rarity",
  neutrals: "Whites and grays",
  text: "Bold and italic",
  sizes: "Text sizes",
};

/**
 * Colors whose chroma (max channel minus min channel, 0 to 1) is below this read as
 * white or gray: the grays, `Plain`, `Glacier`'s ice white, `CharSkew`.
 */
const neutralChroma = 0.15;

/** Hues from here up to 360° sort with the reds at the start of the wheel. */
const redWrapDegrees = 345;

interface Hsl {
  readonly hue: number;
  readonly lightness: number;
  readonly chroma: number;
}

function hslOf(hex: string): Hsl {
  const [red, green, blue] = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  let hue = 0;
  if (chroma > 0) {
    if (max === red) {
      hue = ((((green - blue) / chroma) % 6) + 6) % 6;
    } else if (max === green) {
      hue = (blue - red) / chroma + 2;
    } else {
      hue = (red - green) / chroma + 4;
    }
  }
  // Hues just below 360° are reds: start the wheel there, so reds sort together.
  const degrees = hue * 60;
  return {
    hue: degrees >= redWrapDegrees ? degrees - 360 : degrees,
    lightness: (max + min) / 2,
    chroma,
  };
}

/**
 * Groups by what a color looks like, not where its tag name came from. The rarity
 * colors stay together because they mean something in game: item rarity.
 */
function groupOf(tag: TagEntry): StyleGroupId {
  if (tag.kind === "style") {
    return "text";
  }
  if (/^tier\d$/.test(tag.name)) {
    return "rarity";
  }
  return tag.hex !== null && hslOf(tag.hex).chroma < neutralChroma
    ? "neutrals"
    : "colors";
}

/** Colors run around the color wheel; whites and grays run from light to dark. */
function compareLooks(group: StyleGroupId) {
  return (a: StyleOption, b: StyleOption): number => {
    if (a.look.color === null || b.look.color === null) {
      return 0;
    }
    const first = hslOf(a.look.color);
    const second = hslOf(b.look.color);
    if (group === "colors") {
      return first.hue - second.hue || first.lightness - second.lightness;
    }
    if (group === "neutrals") {
      return second.lightness - first.lightness;
    }
    return 0;
  };
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
 * The groups and options matching a search, by label, tag name, same-looking names or
 * group title, ignoring case. An empty search keeps everything.
 */
export function filterGroups(
  groups: readonly StyleGroup[],
  query: string,
): StyleGroup[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return [...groups];
  }
  return groups.flatMap((group) => {
    const options = group.options.filter((entry) =>
      [entry.label, entry.name, ...entry.sameAs, group.title].some((text) =>
        text.toLowerCase().includes(needle),
      ),
    );
    return options.length === 0 ? [] : [{ ...group, options }];
  });
}

/**
 * The style picker's groups. A run holds exactly one style, so bold, italic and the
 * text sizes are styles like the colors. Tags that render exactly the same appear
 * once, under the shortest name, which is also what the optimizer writes.
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
    const group = groupOf(first);
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
  return Object.entries(groupTitles).flatMap(([key, title]) => {
    const id = key as StyleGroupId;
    const options = (grouped.get(id) ?? []).sort(compareLooks(id));
    return options.length === 0 ? [] : [{ id, title, options }];
  });
}
