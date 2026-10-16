"use client";

import { Search } from "lucide-react";
import { useOpenPalette } from "./palette-provider";

/**
 * The navbar's way into the command palette (ADR 0022), for touch and mouse players;
 * keyboard players also have Ctrl+K or ⌘K. It fills the round pill PillNav gives it.
 */
export function PaletteButton() {
  const openPalette = useOpenPalette();
  return (
    <button
      type="button"
      aria-label="Search"
      aria-keyshortcuts="Control+K Meta+K"
      title="Search (Ctrl+K or ⌘K)"
      onClick={(event) => {
        openPalette(event.currentTarget);
      }}
      className="absolute inset-0 grid cursor-pointer place-items-center rounded-full text-foreground outline-none hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Search aria-hidden="true" className="size-[1.15rem]" />
    </button>
  );
}
