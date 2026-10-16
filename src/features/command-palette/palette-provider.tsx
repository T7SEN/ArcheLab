"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CommandPalette } from "./command-palette";
import type { PaletteCommand, PaletteSource } from "./commands";
import { isPaletteShortcut } from "./shortcut";
import {
  descendantCommands,
  pageCommands,
  toolCommands,
  type PaletteDescendant,
} from "./site-commands";

interface PaletteContextValue {
  /** Opens the palette; focus goes back to `opener` when it closes. */
  open: (opener: HTMLElement | null) => void;
  register: (source: PaletteSource) => () => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

/**
 * The command palette for every page (ADR 0022): it holds the open state and the
 * command sources, and opens on Ctrl+K or ⌘K anywhere, the chat editor included.
 * `descendants` is plain data the server layout reads from the chat registry.
 */
export function PaletteProvider({
  descendants,
  children,
}: {
  descendants: readonly PaletteDescendant[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // The button that opened it. Safari never focuses a clicked button, so focus would
  // otherwise land on the page when the palette closes.
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });
  const [registered, setRegistered] = useState<readonly PaletteSource[]>([]);

  const register = useCallback((source: PaletteSource) => {
    setRegistered((current) => [
      ...current.filter((entry) => entry.id !== source.id),
      source,
    ]);
    return () => {
      setRegistered((current) => current.filter((entry) => entry !== source));
    };
  }, []);

  const sources = useMemo<readonly PaletteSource[]>(() => {
    const builtIn: PaletteSource[] = [
      { id: "pages", order: 10, commands: pageCommands },
      { id: "tools", order: 20, commands: toolCommands },
      {
        id: "descendants",
        order: 30,
        commands: () => descendantCommands(descendants),
      },
    ];
    return [...builtIn, ...registered];
  }, [descendants, registered]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isPaletteShortcut(event)) {
        // The browser's own Ctrl+K (its search bar) gives way to the palette.
        event.preventDefault();
        // A held shortcut repeats; only the first press toggles, or it would flicker.
        if (!event.repeat) {
          // Opened from the keyboard, focus goes back where it was.
          if (!openRef.current) {
            setOpener(null);
          }
          setOpen((current) => !current);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const value = useMemo<PaletteContextValue>(
    () => ({
      open: (from) => {
        setOpener(from);
        setOpen(true);
      },
      register,
    }),
    [register],
  );

  return (
    <PaletteContext value={value}>
      {children}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        sources={sources}
        opener={opener}
      />
    </PaletteContext>
  );
}

/** Opens the palette from a visible button, which gets focus back when it closes. */
export function useOpenPalette(): (opener: HTMLElement | null) => void {
  const context = use(PaletteContext);
  return context?.open ?? noop;
}

function noop(): void {
  // Outside the provider there is no palette to open.
}

/**
 * Adds a page's own commands while it is mounted (ADR 0022). `commands` is read when
 * the palette opens, so it can close over the page's current state; registering
 * happens once per mount, not on every render.
 */
export function usePaletteSource(
  id: string,
  order: number,
  commands: () => readonly PaletteCommand[],
  hides?: readonly string[],
): void {
  const context = use(PaletteContext);
  const latest = useRef(commands);
  useEffect(() => {
    latest.current = commands;
  });
  useEffect(() => {
    if (context === null) {
      return undefined;
    }
    return context.register({
      id,
      order,
      hides,
      commands: () => latest.current(),
    });
  }, [context, id, order, hides]);
}
