import {
  Copy,
  Eraser,
  Gamepad2,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  Type,
} from "lucide-react";
import type { PaletteCommand } from "@/features/command-palette/commands";
import type { ImageEntry, Style } from "@/features/chat/engine";
import { imageTag } from "@/features/chat/engine/serialize";
import {
  iconGroupOf,
  iconGroups,
  isPortrait,
  isUntested,
} from "./icon-options";
import type { StyleGroup } from "./style-options";

/** What the builder's actions need to know about the message right now. */
export interface ChatActionState {
  readonly canCopy: boolean;
  /** Whether "Copy as written" would copy something different. */
  readonly canCopyWritten: boolean;
  readonly canShare: boolean;
  readonly canClear: boolean;
  readonly channel: string;
  readonly channels: readonly {
    readonly name: string;
    readonly label: string;
    readonly hex: string;
  }[];
  readonly gameBackground: boolean;
}

export interface ChatActions {
  readonly copyMarkup: () => void;
  readonly copyWritten: () => void;
  readonly copyLink: () => void;
  readonly clear: () => void;
  readonly openTemplates: () => void;
  readonly setChannel: (name: string) => void;
  readonly toggleGameBackground: () => void;
}

const group = "Chat builder";

/** The builder's buttons and switches, as palette commands (ADR 0022). */
export function chatActionCommands(
  state: ChatActionState,
  actions: ChatActions,
): PaletteCommand[] {
  const run = (fn: () => void) => ({ kind: "run", run: fn }) as const;
  return [
    {
      id: "chat:copy",
      label: "Copy markup",
      group,
      icon: Copy,
      keywords: ["clipboard"],
      disabled: !state.canCopy,
      action: run(actions.copyMarkup),
    },
    ...(state.canCopyWritten
      ? [
          {
            id: "chat:copy-written",
            label: "Copy markup as written",
            group,
            icon: Copy,
            keywords: ["clipboard"],
            action: run(actions.copyWritten),
          },
        ]
      : []),
    {
      id: "chat:copy-link",
      label: "Copy share link",
      group,
      icon: Link2,
      keywords: ["share", "clipboard"],
      disabled: !state.canShare,
      action: run(actions.copyLink),
    },
    {
      id: "chat:clear",
      label: "Clear message",
      group,
      icon: Eraser,
      keywords: ["empty", "reset"],
      disabled: !state.canClear,
      action: run(actions.clear),
    },
    {
      id: "chat:templates",
      label: "Open templates",
      group,
      icon: LayoutTemplate,
      keywords: ["save", "load", "saved"],
      action: run(actions.openTemplates),
    },
    {
      id: "chat:game-background",
      label: state.gameBackground
        ? "Hide game background"
        : "Show game background",
      group,
      icon: Gamepad2,
      keywords: ["background"],
      action: run(actions.toggleGameBackground),
    },
    ...state.channels.map((channel) => ({
      id: `chat:channel:${channel.name}`,
      label: `${channel.label} chat`,
      group,
      swatch: channel.hex,
      keywords: ["channel"],
      ...(channel.name === state.channel ? { hint: "Current" } : {}),
      action: run(() => {
        actions.setChannel(channel.name);
      }),
    })),
  ];
}

/** Every style from the picker, applied to the selection when picked. */
export function styleCommands(
  groups: readonly StyleGroup[],
  apply: (style: Style) => void,
): PaletteCommand[] {
  return groups.flatMap((styleGroup) =>
    styleGroup.options.map((option) => ({
      id: `style:${option.key}`,
      label: option.label,
      group: "Styles",
      ...(option.look.color === null
        ? { icon: Type }
        : { swatch: option.look.color }),
      hint: `+${String(option.cost)}`,
      keywords: [option.name, ...option.sameAs, styleGroup.title, "style"],
      action: {
        kind: "run",
        run: () => {
          apply(option.style);
        },
      } as const,
    })),
  );
}

/**
 * Every chat icon, inserted at the cursor when picked. Descendant portraits come first,
 * as in the icon picker, then the rest; each part keeps the registry's order. The
 * palette highlights the first match, and the registry lists some character tickets
 * before the portraits, so "lepic" then Enter inserted Lepic's ticket instead of
 * `IconLepic1` (found 2026-10-16).
 */
export function iconCommands(
  images: readonly ImageEntry[],
  insert: (id: string) => void,
): PaletteCommand[] {
  const ordered = [
    ...images.filter((image) => isPortrait(image)),
    ...images.filter((image) => !isPortrait(image)),
  ];
  return ordered.map((image) => {
    const cost = imageTag(image.id).length;
    const groupTitle =
      iconGroups.find((entry) => entry.id === iconGroupOf(image))?.title ?? "";
    const untested = isUntested(image);
    return {
      id: `icon:${image.id}`,
      label: image.label,
      group: "Icons",
      icon: ImageIcon,
      hint: untested ? `+${String(cost)}, untested` : `+${String(cost)}`,
      keywords: [
        image.id,
        "icon",
        ...(isPortrait(image) ? ["descendant", "portrait"] : [groupTitle]),
        ...(untested ? ["untested"] : []),
      ],
      action: {
        kind: "run",
        run: () => {
          insert(image.id);
        },
      } as const,
    };
  });
}
