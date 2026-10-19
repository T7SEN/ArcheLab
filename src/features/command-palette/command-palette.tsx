"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog } from "@base-ui/react/dialog";
import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef } from "react";
import {
  matchesCommand,
  paletteGroups,
  type PaletteCommand,
  type PaletteGroup,
  type PaletteSource,
} from "./commands";

const kbdClass =
  "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[0.625rem] leading-none text-muted-foreground";

/**
 * The command palette's dialog (ADR 0022), after Base UI's own pattern: a dialog
 * holding an always-open, inline autocomplete. Picking a command closes the dialog
 * and runs the command once it has closed, so focus has come back first and an
 * editor command can take it.
 */
export function CommandPalette({
  open,
  onOpenChange,
  sources,
  opener,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: readonly PaletteSource[];
  /** The button that opened it, if any: focus goes back there on close. */
  opener: HTMLElement | null;
}) {
  const router = useRouter();
  const hintsId = useId();
  const picked = useRef<PaletteCommand | null>(null);
  // The row a touch or pen went down on, to pick it when the same touch lifts.
  const touchedRow = useRef<EventTarget | null>(null);
  // Read when it opens, so a page's commands match its state at that moment.
  const groups = useMemo<PaletteGroup[]>(
    () => (open ? paletteGroups(sources) : []),
    [open, sources],
  );

  // A tap can reach this twice (release, then click); the command still runs once,
  // when the dialog has closed.
  const pick = (command: PaletteCommand): void => {
    if (!open || command.disabled === true) {
      return;
    }
    picked.current = command;
    onOpenChange(false);
  };

  const perform = (command: PaletteCommand): void => {
    const action = command.action;
    if (action?.kind === "go") {
      router.push(action.href);
    } else if (action?.kind === "run") {
      action.run();
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => {
        const command = picked.current;
        picked.current = null;
        if (!isOpen && command !== null) {
          perform(command);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-background/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs motion-reduce:transition-none" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden px-4 pt-[12dvh] pb-4">
          <Dialog.Popup
            // Without an opener (Ctrl+K), Base UI returns focus where it was.
            finalFocus={
              opener === null
                ? true
                : () => (opener.isConnected ? opener : true)
            }
            className="flex max-h-[min(34rem,calc(100dvh-8rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border bg-popover/95 text-sm text-popover-foreground shadow-2xl shadow-primary/15 backdrop-blur-md transition-[translate,scale,opacity] duration-150 data-ending-style:-translate-y-2 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:-translate-y-2 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <Dialog.Title className="sr-only">Search ArcheLab</Dialog.Title>
            <Autocomplete.Root
              open
              inline
              items={groups}
              filter={matchesCommand}
              itemToStringValue={(command: PaletteCommand) => command.label}
              autoHighlight="always"
              keepHighlight
            >
              <div className="flex items-center gap-3 border-b px-4">
                <Search
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <Autocomplete.Input
                  aria-label="Search pages, tools, Descendants, weapons and more"
                  aria-describedby={hintsId}
                  placeholder="Search pages, tools, Descendants, weapons…"
                  className="h-13 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                />
                <Dialog.Close
                  className={kbdClass}
                  aria-label="Esc, close search"
                >
                  Esc
                </Dialog.Close>
              </div>

              <div className="min-h-0 flex-1 [scroll-padding-block:0.5rem] overflow-y-auto overscroll-contain p-2">
                <Autocomplete.Empty className="px-3 py-10 text-center text-muted-foreground empty:p-0">
                  Nothing matches. Try a page, a tool, a Descendant or a weapon.
                </Autocomplete.Empty>
                <Autocomplete.List className="grid gap-2">
                  {(group: PaletteGroup) => (
                    <Autocomplete.Group key={group.value} items={group.items}>
                      <Autocomplete.GroupLabel className="px-3 pt-1 pb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {group.value}
                      </Autocomplete.GroupLabel>
                      <Autocomplete.Collection>
                        {(command: PaletteCommand) => (
                          <Autocomplete.Item
                            key={command.id}
                            value={command}
                            disabled={command.disabled}
                            onClick={() => {
                              pick(command);
                            }}
                            // Base UI cancels a row's pointerdown so the search field
                            // keeps focus, and WebKit then can skip the tap's click: a
                            // tap picks on release instead. A scroll ends in
                            // pointercancel, so it never picks.
                            onPointerDown={(event) => {
                              touchedRow.current =
                                event.pointerType === "mouse"
                                  ? null
                                  : event.currentTarget;
                            }}
                            onPointerUp={(event) => {
                              const tapped =
                                touchedRow.current === event.currentTarget;
                              touchedRow.current = null;
                              if (tapped) {
                                pick(command);
                              }
                            }}
                            className="group grid min-h-10 cursor-default [scroll-margin-block:0.5rem] grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2 text-foreground/90 outline-none select-none data-highlighted:bg-accent data-highlighted:text-foreground data-disabled:opacity-50"
                          >
                            <CommandIcon command={command} />
                            <span className="truncate">{command.label}</span>
                            {command.hint === undefined ? (
                              <span />
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground group-data-highlighted:text-foreground/80">
                                {command.hint}
                              </span>
                            )}
                          </Autocomplete.Item>
                        )}
                      </Autocomplete.Collection>
                    </Autocomplete.Group>
                  )}
                </Autocomplete.List>
              </div>

              <div
                id={hintsId}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-background/40 px-4 py-2.5 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <kbd className={kbdClass}>↑</kbd>
                  <kbd className={kbdClass}>↓</kbd>
                  to move
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className={kbdClass}>
                    <CornerDownLeft aria-label="Enter" className="size-3" />
                  </kbd>
                  to open
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className={kbdClass}>Esc</kbd>
                  to close
                </span>
              </div>
            </Autocomplete.Root>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A command's color dot or icon; an empty slot keeps the labels aligned. */
function CommandIcon({ command }: { command: PaletteCommand }) {
  if (command.swatch !== undefined) {
    return (
      <span
        aria-hidden="true"
        className="size-3 justify-self-center rounded-full ring-1 ring-foreground/20"
        style={{ backgroundColor: command.swatch }}
      />
    );
  }
  const Icon = command.icon;
  return Icon === undefined ? (
    <span aria-hidden="true" />
  ) : (
    <Icon
      aria-hidden="true"
      className="size-4 text-muted-foreground group-data-highlighted:text-primary"
    />
  );
}
