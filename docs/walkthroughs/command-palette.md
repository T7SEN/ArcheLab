# Command palette

## Code path

1. `src/app/layout.tsx` wraps the header, page and footer in `PaletteProvider` (`src/features/command-palette/palette-provider.tsx`). The layout is async: it hands the provider `paletteDescendants(await fetchDescendantSummaries())`, each Descendant in NEXON's data with its page address, A–Z (ADR 0023), and `paletteWeapons(await fetchWeaponSummaries())`, each weapon with its page, rarity and type (ADR 0024).
2. `PaletteProvider`, a client component:
   - holds the open state and the registered sources;
   - listens for Ctrl+K or ⌘K on `window` and toggles the palette;
   - renders `CommandPalette` beside the page.

   Its built-in sources are pages (`pageCommands`, order 10), tools (`toolCommands`, 20), Descendants (`descendantCommands`, 30) and weapons (`weaponCommands`, 35), all in `site-commands.ts`. Command ids come from page addresses, so two entries with one name could never share a React key.
3. `src/components/site-nav.tsx` passes `PaletteButton` to PillNav's `trailing` slot. The button calls `useOpenPalette()`.
4. `CommandPalette` (`command-palette.tsx`) follows Base UI's documented pattern: `Dialog` with an `Autocomplete` that is always open and inline. When it opens, `paletteGroups(sources)` reads every source's commands. The `Autocomplete` filters them with `matchesCommand` and always highlights the first match. Picking a row stores the command and closes the dialog; `onOpenChangeComplete(false)` then runs it: `router.push` for `go`, the function for `run`.
5. `ChatBuilder` registers two sources with `usePaletteSource`, both built in `src/features/chat/ui/palette-commands.ts`:
   - `chat-actions` (order 0) from `chatActionCommands`;
   - `chat-inserts` (order 25) from `styleCommands` and `iconCommands`, ahead of the Descendants and weapons (ADR 0023). `iconCommands` lists the Descendant portraits first, then the other icons, each in the registry's order: the palette highlights the first match, and the registry lists some character tickets before the portraits, so "lepic" then Enter inserted Lepic's ticket (fixed 2026-10-16).

   Each getter closes over the builder's state of that render.
6. Tests: `src/features/command-palette/commands.test.ts`, `src/features/chat/ui/palette-commands.test.ts`, `tests/e2e/palette.spec.ts`.

## Why it is shaped this way

- **Commands run after the dialog closes.** Closing returns focus to where it was: the editor when Ctrl+K was pressed in it, the search button when that opened it. A command that ran first and focused the editor would then lose focus to that return. Running in `onOpenChangeComplete` puts the command's own focus last. Clipboard writes also need the document focused, which it is again by then.
- **Sources register once and are read on open.** The builder's commands depend on its state (whether there is anything to copy, the current channel). Re-registering on every render would set the provider's state on every keystroke and re-render the whole app. `usePaletteSource` keeps the latest getter in a ref and registers a stable wrapper once per mount. The palette calls it when it opens.
- **The builder's inserts come before the Descendants.** Its source has order 25, after pages (10) and tools (20) but before Descendants (30), so a Descendant's name then Enter inserts the icon instead of leaving the page and the message. Until ADR 0023 the builder hid the Descendants group, whose rows replaced the message with a share link; `hides` has no user now.
- **Descendants are plain data from the server.** The provider is on every page. Building the list in the layout from NEXON's data sends the browser names and addresses only.
- **The trailing pill is measured.** PillNav folds its links by comparing the logo, links and gaps against the header's width. The search pill joins that sum; otherwise the links would overflow before folding. Folded, `group-data-[collapsed]/nav:ml-auto` moves it beside the menu button.
- **The shortcut reads the letter, or the key's position.** `event.key` is the letter the layout types. With an Arabic or Russian layout, Ctrl and the K key give "ن" or "л", so `shortcut.ts` falls back to `event.code === "KeyK"` when the key isn't a Latin letter. Checking `code` alone would break Dvorak, where the letter K sits elsewhere.
- **Disabled rows go last** (`paletteGroups`). Base UI's `autoHighlight="always"` highlights the first row even when it is disabled, and Enter would then do nothing.
- **The opener gets focus back explicitly.** Base UI returns focus to the element focused before opening. After a click in Safari that is the page, because buttons don't take focus on click there. The provider keeps the button that opened the palette and passes it as `finalFocus`.
- **Taps pick on release.** Base UI's row cancels `pointerdown` (keeping the search field focused) and picks on `click`. WebKit, as Playwright runs it, sends no click after that, so the row also picks on `pointerup` when the same touch or pen went down on it. `pick` ignores a second call once the dialog is closing or closed.

## What would break it

- Removing the `pointerup` pick: taps on rows stop working in WebKit (the touch test catches it).
- Toggling on repeated keydowns: a held Ctrl+K flickers the palette.
- Running a command before the dialog has closed. An editor command would lose focus to the dialog's focus return.
- Passing `usePaletteSource` a new `hides` array on each render: it would re-register every render. Use a module constant.
- A `PaletteCommand` id used twice. Autocomplete keys rows by it, so two rows would collide.
- A `go` command with a hash on the builder's own page. `router.push` changes the URL without a `hashchange` event, so the builder would not open it. Descendant rows open pages without a hash, so this no longer touches them.
- Rendering portraits in palette rows. Opening the palette would download dozens of NEXON PNGs.
