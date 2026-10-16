import type { LucideIcon } from "lucide-react";

/** What picking a command does: go to a page, or run an action on this one. */
export type PaletteAction =
  | { readonly kind: "go"; readonly href: string }
  | { readonly kind: "run"; readonly run: () => void };

/** One row in the command palette (ADR 0022). */
export interface PaletteCommand {
  /** Unique across every source, such as `page:/privacy` or `style:tag:red`. */
  readonly id: string;
  readonly label: string;
  /** The title of the group it is listed under. */
  readonly group: string;
  /** More words that find it, besides its label and group. */
  readonly keywords?: readonly string[];
  /** A short note at the right of the row, such as "Ultimate" or "+21". */
  readonly hint?: string;
  readonly icon?: LucideIcon;
  /** A color dot in place of the icon, for chat colors and channels. */
  readonly swatch?: string;
  /** Shown but not pickable, such as a tool that is coming soon. */
  readonly disabled?: boolean;
  readonly action?: PaletteAction;
}

/**
 * Where commands come from (ADR 0022). The site's pages, tools and Descendants are
 * built in; a page adds its own while it is open (the chat builder's actions, styles
 * and icons), and later sources, such as builds from the database, plug in the same way.
 */
export interface PaletteSource {
  readonly id: string;
  /** Sources list in this order, lowest first. */
  readonly order: number;
  /** Read each time the palette opens, so the commands match the page's state. */
  readonly commands: () => readonly PaletteCommand[];
  /** Built-in sources this one stands in for while it is registered. */
  readonly hides?: readonly string[];
}

/** A group as Base UI's Autocomplete takes it: a title and its items. */
export interface PaletteGroup {
  readonly value: string;
  readonly items: readonly PaletteCommand[];
}

/**
 * Whether a command matches a search: every word of the query appears in its label,
 * its group or one of its keywords, ignoring case. An empty query matches everything.
 */
export function matchesCommand(
  command: PaletteCommand,
  query: string,
): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const haystack = [command.label, command.group, ...(command.keywords ?? [])]
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/**
 * The palette's groups from its sources: lowest `order` first, without the sources
 * another one hides, each group where its first command appears. Within a group the
 * commands that can't be picked go last, so the palette never highlights one first:
 * Enter on it would do nothing.
 */
export function paletteGroups(
  sources: readonly PaletteSource[],
): PaletteGroup[] {
  const hidden = new Set(sources.flatMap((source) => source.hides ?? []));
  const commands = [...sources]
    .filter((source) => !hidden.has(source.id))
    .sort((a, b) => a.order - b.order)
    .flatMap((source) => source.commands());
  const groups = new Map<string, PaletteCommand[]>();
  for (const command of commands) {
    const items = groups.get(command.group) ?? [];
    items.push(command);
    groups.set(command.group, items);
  }
  return [...groups].map(([value, items]) => ({
    value,
    items: [
      ...items.filter((item) => item.disabled !== true),
      ...items.filter((item) => item.disabled === true),
    ],
  }));
}
