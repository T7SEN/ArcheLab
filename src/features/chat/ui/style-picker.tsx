"use client";

import { RemoveFormatting, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sameStyle, type Style } from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { chatRegistry } from "./chat-registry";
import { filterImages, IconOptions } from "./icon-options";
import { keepEditorFocus } from "./keep-editor-focus";
import { stylePropsOf } from "./style-look";
import { filterGroups, styleGroups, type StyleOption } from "./style-options";

const groups = styleGroups(chatRegistry);
const chatBackground = chatRegistry.data.chatBackground.hex;
const iconsSection = "icons";
/** Sections open on first view; the rest stay one click away. */
const initiallyOpen = ["colors", "rarity", iconsSection];

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
        className="block size-4 rounded-[3px]"
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
            className="relative flex min-h-7 min-w-7 items-center justify-center rounded-md border border-input px-1.5 text-xs transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/60"
            style={{ backgroundColor: chatBackground }}
          />
        }
      >
        {face}
        {option.lowContrast ? (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-warning ring-2 ring-card"
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
  portraits: PortraitUrls;
  onPickStyle: (style: Style | null) => void;
  onPickImage: (id: string) => void;
}

/**
 * Every style the game supports, one button per look, plus the verified icons. A run
 * holds exactly one style, so picking one replaces the old one; "Channel color"
 * removes it. A search narrows every section and opens the ones that match.
 */
export function StylePicker({
  active,
  portraits,
  onPickStyle,
  onPickImage,
}: StylePickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>(initiallyOpen);
  const searching = query.trim() !== "";
  const shownGroups = filterGroups(groups, query);
  const shownImages = filterImages(query);
  const shownSections = [
    ...shownGroups.map((group) => group.id),
    ...(shownImages.length > 0 ? [iconsSection] : []),
  ];
  const isActive = (style: Style | null): boolean =>
    active !== "mixed" && sameStyle(active, style);

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search styles and icons"
          placeholder="Search: red, rarity, gray, Bunny…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          className="pl-8"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={isActive(null)}
        onMouseDown={keepEditorFocus}
        onClick={() => {
          onPickStyle(null);
        }}
        className="w-fit aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/60"
      >
        <RemoveFormatting aria-hidden="true" />
        Channel color (no tag)
      </Button>
      {shownSections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing matches &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <Accordion
          multiple
          value={searching ? shownSections : open}
          onValueChange={(value) => {
            if (!searching) {
              setOpen(value.map(String));
            }
          }}
        >
          {shownGroups.map((group) => (
            <AccordionItem key={group.id} value={group.id}>
              <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                {group.title} ({group.options.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-1">
                  {group.options.map((option) => (
                    <OptionButton
                      key={option.key}
                      option={option}
                      pressed={isActive(option.style)}
                      onPick={onPickStyle}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          {shownImages.length > 0 ? (
            <AccordionItem value={iconsSection}>
              <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                Icons ({shownImages.length})
              </AccordionTrigger>
              <AccordionContent>
                <IconOptions
                  images={shownImages}
                  portraits={portraits}
                  onPick={onPickImage}
                />
              </AccordionContent>
            </AccordionItem>
          ) : null}
        </Accordion>
      )}
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-warning" />
        Hard to read on the chat background.
      </p>
    </div>
  );
}
