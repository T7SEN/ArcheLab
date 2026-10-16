import { UserRound } from "lucide-react";
import { allPages, legalPages } from "@/data/site-pages";
import { tools } from "@/data/tools";
import type { PaletteCommand } from "./commands";

/** A Descendant the palette offers: picking it opens the builder with its icon. */
export interface PaletteDescendant {
  readonly name: string;
  /** The builder with a share link holding the Descendant's chat icon. */
  readonly href: string;
  readonly ultimate: boolean;
}

const legalHrefs = new Set(legalPages.map((page) => page.href));

/** Every page, from the navbar's and the footer's lists. */
export function pageCommands(): PaletteCommand[] {
  return allPages.map((page) => ({
    id: `page:${page.href}`,
    label: page.label,
    group: "Pages",
    icon: page.icon,
    keywords: legalHrefs.has(page.href) ? ["legal"] : [],
    action: { kind: "go", href: page.href },
  }));
}

/** Every tool in the registry; the coming-soon ones show but can't be picked. */
export function toolCommands(): PaletteCommand[] {
  return tools.map((tool) => ({
    id: `tool:${tool.slug}`,
    label: tool.name,
    group: "Tools",
    icon: tool.icon,
    keywords: [tool.description],
    ...(tool.status === "live"
      ? { action: { kind: "go", href: tool.href } as const }
      : { hint: "Soon", disabled: true }),
  }));
}

/** Each Descendant with a chat icon, opening the builder with that icon. */
export function descendantCommands(
  descendants: readonly PaletteDescendant[],
): PaletteCommand[] {
  return descendants.map((descendant) => ({
    id: `descendant:${descendant.name}`,
    label: descendant.name,
    group: "Descendants",
    icon: UserRound,
    keywords: ["descendant", "icon", "portrait"],
    ...(descendant.ultimate ? { hint: "Ultimate" } : {}),
    action: { kind: "go", href: descendant.href },
  }));
}
