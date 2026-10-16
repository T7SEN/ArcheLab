# Command palette

## Code path

1. `src/app/layout.tsx` wraps the header, page and footer in `PaletteProvider` (`src/features/command-palette/palette-provider.tsx`). On the server it hands the provider `paletteDescendants()`: each Descendant with a chat icon, and a share link to the builder showing that icon.
2. `PaletteProvider`, a client component:
   - holds the open state and the registered sources;
   - listens for Ctrl+K or ⌘K on `window` and toggles the palette;
   - renders `CommandPalette` beside the page.

   Its built-in sources are pages (`pageCommands`), tools (`toolCommands`) and Descendants (`descendantCommands`), all in `site-commands.ts`.
3. `src/components/site-nav.tsx` passes `PaletteButton` to PillNav's `trailing` slot. The button calls `useOpenPalette()`.
4. `CommandPalette` (`command-palette.tsx`) follows Base UI's documented pattern: `Dialog` with an `Autocomplete` that is always open and inline. When it opens, `paletteGroups(sources)` reads every source's commands. The `Autocomplete` filters them with `matchesCommand` and always highlights the first match. Picking a row stores the command and closes the dialog; `onOpenChangeComplete(false)` then runs it: `router.push` for `go`, the function for `run`.
5. `ChatBuilder` registers two sources with `usePaletteSource`, both built in `src/features/chat/ui/palette-commands.ts`:
   - `chat-actions` (order 0) from `chatActionCommands`;
   - `chat-inserts` (order 40) from `styleCommands` and `iconCommands`, hiding `descendants`.

   Each getter closes over the builder's state of that render.
6. Tests: `src/features/command-palette/commands.test.ts`, `src/features/chat/ui/palette-commands.test.ts`, `tests/e2e/palette.spec.ts`.

## Why it is shaped this way

- **Commands run after the dialog closes.** Closing returns focus to where it was: the editor when Ctrl+K was pressed in it, the search button when that opened it. A command that ran first and focused the editor would then lose focus to that return. Running in `onOpenChangeComplete` puts the command's own focus last. Clipboard writes also need the document focused, which it is again by then.
- **Sources register once and are read on open.** The builder's commands depend on its state (whether there is anything to copy, the current channel). Re-registering on every render would set the provider's state on every keystroke and re-render the whole app. `usePaletteSource` keeps the latest getter in a ref and registers a stable wrapper once per mount. The palette calls it when it opens.
- **The builder hides the Descendants group.** Its icons already include every portrait, and a Descendant command navigates to a share link, which would replace the message being edited.
- **Descendants are plain data from the server.** The provider is on every page. Building the list in the layout keeps the chat registry, about 170 entries, out of the home and legal pages' JavaScript.
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
- A `go` command with a hash on the builder's own page. `router.push` changes the URL without a `hashchange` event, so the builder would not open it. That is why the builder hides Descendants.
- Rendering portraits in palette rows. Opening the palette would download dozens of NEXON PNGs.
