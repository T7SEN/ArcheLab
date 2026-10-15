"use client";

import { cn } from "cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ImageEntry } from "@/features/chat/engine";
import { imageTag } from "@/features/chat/engine/serialize";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { ChatIcon } from "./chat-icon";
import { chatRegistry } from "./chat-registry";
import { keepEditorFocus } from "./keep-editor-focus";

/** A Descendant portrait icon, as opposed to the other chat icons. */
export function isPortrait(image: ImageEntry): boolean {
  return image.art.kind === "descendant";
}

/** Not tested in game yet: the id comes from a community source (SPEC.md section 4.1). */
export function isUntested(image: ImageEntry): boolean {
  return image.source === "community";
}

/**
 * Picker sections for the icons that are not Descendant portraits, grouped by what
 * their ids name (T7SEN, 2026-10-15). Their appearance is mostly undescribed, so the
 * id is the only guide; an id that fits no group lands in Other.
 */
export const iconGroups = [
  { id: "currency", title: "Currency" },
  { id: "portraits", title: "Other portraits" },
  { id: "missions", title: "Bosses and missions" },
  { id: "npcs", title: "NPCs" },
  { id: "damage", title: "Damage types" },
  { id: "buttons", title: "Mouse and gamepad buttons" },
  { id: "tickets", title: "Character tickets" },
  { id: "other", title: "Other" },
] as const;

export type IconGroupId = (typeof iconGroups)[number]["id"];

const currencies = new Set(["cash", "bluecash", "redcash", "gold"]);

const damageTypes = new Set([
  "blazer",
  "burst",
  "crush",
  "piercing",
  "demonic",
  "electricity",
  "glacier",
  "plain",
]);

/** The picker section of an icon that is not a Descendant portrait. */
export function iconGroupOf(image: ImageEntry): IconGroupId {
  const id = image.id.toLowerCase();
  // The ids named as currency: Silver emblem, Silver card, Caliber, Gold (T7SEN,
  // 2026-10-15). The research report lists Qulipothium and DimensionalFragment with
  // them as resources, but their ids do not name a currency, so they land in Other.
  if (currencies.has(id)) {
    return "currency";
  }
  // Portrait ids like the Descendants' (Icon<Name><n>), with no API portrait.
  if (/^icon[a-z]+\d+$/.test(id)) {
    return "portraits";
  }
  if (/^(hard)?bossicon$|^mission|^questmain$|^subvulguspost$/.test(id)) {
    return "missions";
  }
  if (id.startsWith("npc")) {
    return "npcs";
  }
  if (damageTypes.has(id)) {
    return "damage";
  }
  if (/^(mouse|gamepad)\d+$/.test(id)) {
    return "buttons";
  }
  if (id.startsWith("icon_characterticket_")) {
    return "tickets";
  }
  return "other";
}

function groupTitleOf(image: ImageEntry): string {
  const group = iconGroupOf(image);
  return iconGroups.find((entry) => entry.id === group)?.title ?? "";
}

/** The image ids matching a search by label, id or section, ignoring case. */
export function filterImages(query: string): ImageEntry[] {
  const needle = query.trim().toLowerCase();
  return chatRegistry.data.images.filter(
    (image) =>
      needle === "" ||
      [
        image.label,
        image.id,
        "icon",
        ...(isPortrait(image)
          ? ["descendant", "portrait"]
          : [groupTitleOf(image)]),
      ].some((text) => text.toLowerCase().includes(needle)),
  );
}

/** "Bunny icon", but "Boss icon" rather than "Boss icon icon". */
function iconName(label: string): string {
  return /\bicon$/i.test(label) ? label : `${label} icon`;
}

const buttonBase =
  "relative rounded-md border border-input bg-secondary/70 text-xs transition-colors outline-none hover:border-ring/60 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface IconButtonProps {
  image: ImageEntry;
  portraits: PortraitUrls;
  /** A chip (icon and cost in a row) or a portrait tile (portrait, name, cost). */
  layout: "chip" | "tile";
  onPick: (id: string) => void;
}

function IconButton({ image, portraits, layout, onPick }: IconButtonProps) {
  const tag = imageTag(image.id);
  const cost = tag.length;
  const untested = isUntested(image);
  const name = iconName(image.label);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`${name}, adds ${String(cost)} characters${untested ? ", not tested in game yet" : ""}`}
            onMouseDown={keepEditorFocus}
            onClick={() => {
              onPick(image.id);
            }}
            className={cn(
              buttonBase,
              layout === "chip"
                ? "flex h-9 items-center gap-1.5 px-1.5"
                : "flex flex-col items-center gap-0.5 px-1 pt-1.5 pb-1",
            )}
          />
        }
      >
        {layout === "chip" ? (
          <>
            <span aria-hidden="true">
              <ChatIcon id={image.id} portraits={portraits} />
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              +{cost}
            </span>
          </>
        ) : (
          <>
            {/* Chat icons are 2em tall, so 18px text makes a 36px portrait. */}
            <span aria-hidden="true" className="text-[18px] leading-none">
              <ChatIcon id={image.id} portraits={portraits} />
            </span>
            <span
              aria-hidden="true"
              className="w-full truncate text-center text-[11px] text-foreground"
            >
              {image.label}
            </span>
            <span
              aria-hidden="true"
              className="text-[10px] text-muted-foreground"
            >
              +{cost}
            </span>
          </>
        )}
        {untested ? <UntestedMark /> : null}
      </TooltipTrigger>
      <TooltipContent>
        <span className="grid gap-0.5">
          <span className="font-medium text-foreground">{name}</span>
          <span className="text-muted-foreground">
            <code className="font-mono text-primary">{tag}</code> · +{cost}{" "}
            characters
          </span>
          {untested ? (
            <span className="text-muted-foreground">
              Not tested in game yet: it may show as text.
            </span>
          ) : null}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

/** The corner mark on an icon whose id is not tested in game yet. */
export function UntestedMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full bg-muted text-[9px] leading-none font-bold text-muted-foreground ring-2 ring-card",
        className,
      )}
    >
      ?
    </span>
  );
}

/** A to Z by label, numbers in order: "Mission 2" before "Mission 10". */
function byLabel(images: readonly ImageEntry[]): ImageEntry[] {
  return [...images].sort((a, b) =>
    a.label.localeCompare(b.label, "en", { numeric: true }),
  );
}

interface IconOptionsProps {
  images: readonly ImageEntry[];
  portraits: PortraitUrls;
  onPick: (id: string) => void;
}

/** Icon buttons. Each icon inserts at the cursor, outside any run (T26). */
export function IconOptions({ images, portraits, onPick }: IconOptionsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {byLabel(images).map((image) => (
        <IconButton
          key={image.id}
          image={image}
          portraits={portraits}
          layout="chip"
          onPick={onPick}
        />
      ))}
    </div>
  );
}

/** Descendant portraits as tiles with their names, A to Z. */
export function PortraitOptions({
  images,
  portraits,
  onPick,
}: IconOptionsProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {byLabel(images).map((image) => (
        <IconButton
          key={image.id}
          image={image}
          portraits={portraits}
          layout="tile"
          onPick={onPick}
        />
      ))}
    </div>
  );
}
