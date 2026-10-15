"use client";

import { RemoveFormatting } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sameStyle, type Style } from "@/features/chat/engine";
import { chatRegistry } from "./chat-registry";
import { stylePropsOf } from "./style-look";
import { styleGroups, type StyleOption } from "./style-options";

const groups = styleGroups(chatRegistry);
const chatBackground = chatRegistry.data.chatBackground.hex;

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

/** A swatch button with a tooltip naming the style, its tag and its cost. */
function OptionButton({
  option,
  pressed,
  onPick,
}: {
  option: StyleOption;
  pressed: boolean;
  onPick: (style: Style) => void;
}) {
  const isColor =
    option.style.type === "tag" && !option.look.bold && !option.look.italic;
  let face: ReactNode;
  if (isColor) {
    face = (
      <span
        aria-hidden="true"
        className="block size-5 rounded-sm"
        style={{ backgroundColor: option.look.color ?? undefined }}
      />
    );
  } else {
    face = (
      <span aria-hidden="true" style={stylePropsOf(option.look)}>
        {option.style.type === "size" ? "Aa" : option.label}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-pressed={pressed}
            aria-label={describe(option)}
            onMouseDown={keepEditorFocus}
            onClick={() => {
              onPick(option.style);
            }}
            className="relative flex h-9 min-w-9 items-center justify-center rounded-md border border-input px-2 text-sm transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/60"
            style={{ backgroundColor: chatBackground }}
          />
        }
      >
        {face}
        {option.lowContrast ? (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 size-2 rounded-full bg-warning ring-2 ring-card"
          />
        ) : null}
      </TooltipTrigger>
      <TooltipContent>
        <span className="grid gap-0.5">
          <span className="font-medium">{option.label}</span>
          <span className="font-mono">
            &lt;{option.name}&gt; · +{option.cost} characters
          </span>
          {option.lowContrast ? (
            <span>Hard to read on the chat background</span>
          ) : null}
          {option.sameAs.length > 0 ? (
            <span>
              Same as {option.sameAs.map((name) => `<${name}>`).join(", ")}
            </span>
          ) : null}
        </span>
      </TooltipContent>
    </Tooltip>
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
    <div className="grid gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={isActive(null)}
        onMouseDown={keepEditorFocus}
        onClick={() => {
          onPick(null);
        }}
        className="w-fit aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/60"
      >
        <RemoveFormatting aria-hidden="true" />
        Channel color (no tag)
      </Button>
      {groups.map((group) => (
        <div
          key={group.id}
          role="group"
          aria-labelledby={`style-group-${group.id}`}
        >
          <h3
            id={`style-group-${group.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {group.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
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
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span aria-hidden="true" className="size-2 rounded-full bg-warning" />
        Hard to read on the chat background.
      </p>
    </div>
  );
}
