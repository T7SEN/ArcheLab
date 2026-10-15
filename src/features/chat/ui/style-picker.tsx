"use client";

import type { MouseEvent } from "react";
import { sameStyle, type Style } from "@/features/chat/engine";
import { chatRegistry } from "./chat-registry";
import { stylePropsOf } from "./style-look";
import { styleGroups, type StyleOption } from "./style-options";

const groups = styleGroups(chatRegistry);

/** Keeps the editor's focus and selection while a picker button is clicked. */
export function keepEditorFocus(event: MouseEvent): void {
  event.preventDefault();
}

function describe(option: StyleOption): string {
  const parts = [
    option.label,
    `<${option.name}>`,
    `adds ${String(option.cost)} characters`,
  ];
  if (option.lowContrast) {
    parts.push("hard to read on the chat background");
  }
  if (option.sameAs.length > 0) {
    parts.push(
      `same as ${option.sameAs.map((name) => `<${name}>`).join(", ")}`,
    );
  }
  return parts.join(", ");
}

const pressedRing =
  "aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-accent";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function OptionButton({
  option,
  pressed,
  onPick,
}: {
  option: StyleOption;
  pressed: boolean;
  onPick: (style: Style) => void;
}) {
  const description = describe(option);
  const isColor =
    option.style.type === "tag" && !option.look.bold && !option.look.italic;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={description}
      title={description}
      onMouseDown={keepEditorFocus}
      onClick={() => {
        onPick(option.style);
      }}
      className={`relative flex h-8 min-w-8 items-center justify-center border border-line px-1.5 text-sm ${pressedRing} ${focusRing}`}
      style={{ backgroundColor: chatRegistry.data.chatBackground.hex }}
    >
      {isColor ? (
        <span
          aria-hidden="true"
          className="block size-5"
          style={{ backgroundColor: option.look.color ?? undefined }}
        />
      ) : (
        <span aria-hidden="true" style={stylePropsOf(option.look)}>
          {option.style.type === "size" ? "Aa" : option.label}
        </span>
      )}
      {option.lowContrast ? (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 size-2 rounded-full bg-warn"
        />
      ) : null}
    </button>
  );
}

interface StylePickerProps {
  active: Style | null | "mixed";
  onPick: (style: Style | null) => void;
}

/**
 * Every style the game supports, one button per look. A run holds exactly one style,
 * so picking one replaces the old one; "Channel color" removes it.
 */
export function StylePicker({ active, onPick }: StylePickerProps) {
  const isActive = (style: Style | null): boolean =>
    active !== "mixed" && sameStyle(active, style);
  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-pressed={isActive(null)}
        onMouseDown={keepEditorFocus}
        onClick={() => {
          onPick(null);
        }}
        className={`border border-line px-3 py-1 text-sm text-ink ${pressedRing} ${focusRing}`}
      >
        Channel color (no tag)
      </button>
      {groups.map((group) => (
        <div
          key={group.id}
          role="group"
          aria-labelledby={`style-group-${group.id}`}
        >
          <p
            id={`style-group-${group.id}`}
            className="text-xs font-semibold tracking-wider text-ink-muted uppercase"
          >
            {group.title}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {group.options.map((option) => (
              <OptionButton
                key={option.key}
                option={option}
                pressed={isActive(option.style)}
                onPick={onPick}
              />
            ))}
          </div>
        </div>
      ))}
      <p className="flex items-center gap-2 text-xs text-ink-muted">
        <span aria-hidden="true" className="size-2 rounded-full bg-warn" />
        Hard to read on the chat background.
      </p>
    </div>
  );
}
