# External components index

## Code path

1. `src/lib/nexon/component-index.ts` (server-only) fetches `external-component.json` once per build worker with `stat.json` (`fetchStats` in `shared-sets.ts`). `componentGroups` shapes plain data:
   - one group per set (`set_option_detail[0].set_option`), and one per name for components with no set, the slot left out of the name ("HP Support Sensor" is HP Support), A–Z, with a slug from `slugOf`;
   - a set's bonuses by piece count, from its first piece (all four carry the same), with a literal "\n" turned into a line break (Shell Crusher's 4-set effect has one; the game shows a line break);
   - its pieces, highest tier first, then in `slotOrder` (Auxiliary Power, Sensor, Memory, Processor), each with its stat's name from `stat.json`, its core slot count (`available_core_slot.length` times `coreSlotsPerListed`, two: `src/data/component-core-slots.ts`) and its levels, lowest first.
   `fetchComponentGroups` memoizes it; the index, the data files, the layout (palette) and the home page all read it.
2. `src/app/external-components/page.tsx` (static) turns groups into `ComponentCard`s without levels, with tier names and colors from the chat registry (`rarityOf`, on the server), and the tiers the filter offers, highest first. The index renders inside `<Suspense>` with the unfiltered index as the fallback.
3. `src/app/external-components/data/[slug]/route.ts` prerenders one JSON file per card: `{ levels: { [componentId]: ComponentLevel[] } }`, read back by `readComponentLevels` in `component-levels.ts`.
4. `src/features/external-components/component-index.tsx` (client) reads the URL query (`useSearch`, `parseComponentFilters`), filters (`filterComponents`: a tier any piece has, and search words matching the name, the pieces' names or the bonuses; sorted by highest tier, then A–Z), and puts the open card's details in a full-width row after its card's row (`rowEnd` and `useGridColumns` from `src/features/game-data/details-row.ts`), keyed by card. Cards are plain links to `/external-components?component=<slug>` that open or close the details in place; their art is the top piece's, in `WideTile` (`game-data/wide-tile.tsx`).
5. `component-details.tsx` (client): `useRevealDetails` focuses the name and scrolls the details into view; `dataFileHook(readComponentLevels)` loads the levels once per visit; `tiersOf` lists the card's tiers, and a switch shows when there is more than one, opening on the index's tier filter when the card has it. `ComponentDetails` holds the picked slot (`slot`, so a tier switch keeps it) and the level (`levelIndex`, null for the highest; a tier switch sets it back to null). On the left, the Pieces list (a vertical toggle group) has a row per piece with its art, name, slot and base stat at that level (`statAt`); a row picks the piece. On the right, `PieceView` shows the picked piece's art, name, slot and core slot, the level slider, its base stat at that level, and its slot's possible sub-stats, with the provisional badge while `subStats.provisional`. A set's bonuses take a full-width row under both columns. Escape or the close button closes, and focus goes back to the card.
   The core slots: for a piece with any, `CoreSlots` heads a `CoreTypeGrid` (`src/features/game-data/core-type-grid.tsx`, shared with weapon pages) of the two core types `fetchComponentCoreSlots` reads through `fetchCoreTypes` (`src/lib/nexon/core-types.ts`) for the ids in `src/data/component-core-slots.ts`, at the grade picked (I to X, starting at X): each type's core item and its options' ranges (`formatCoreRange` in `src/features/game-data/core-types.ts`). The page passes them to the index once.
   The sub-stats: `src/data/component-sub-stats.ts` lists stat ids by slot (tfdhub.gg's lists, T7SEN's choice, verified by T7SEN in game); `componentSubStats` in `component-index.ts` names them from `stat.json`, and the page passes them to the index once per slot (`SubStats`), not once per piece.
6. Links in: `src/features/command-palette/palette-components.ts` and `componentCommands` (the External Components group, order 50), `src/components/component-showcase.tsx` (the home carousel), and `sitePages` (the navbar's Database menu, the footer, the sitemap).

## The navbar's Database menu

1. `src/data/site-pages.ts`: the database pages carry `group: "Database"`. `navbarEntries()` returns a page's own entry, or one group entry, at its first page's place, holding the group's pages in order.
2. `src/components/site-nav.tsx` maps entries to PillNav items: a link, or a `PillNavGroup` whose links carry their page icons.
3. `src/components/react-bits/pill-nav.tsx`:
   - The bar renders a group as a button (`isGroup`), with the same faces, fill and dot as a link, plus a chevron that turns while open. `activeIndex` counts a group active when one of its links is the current page or section, and the button then takes `aria-current="true"`.
   - `toggleMenu` stores the open group's index, the menu's left edge (centered under the button, 16px inside the screen) and the page it opened on. `shownMenu` is that state only while it is the same page and the bar is unfolded, so moving to another page closes the menu with no effect.
   - The menu (`DROPDOWN`) is the nav's child, right after the bar: glass inside the bar's glass would blur only the bar, and this place keeps Tab running from the button into the links.
   - An effect listens while the menu is open: a pointerdown outside the button and the menu closes it; Escape closes it and focuses the button. `leaveMenu` closes it when focus moves to anything else, but not on a blur to nothing, which a press elsewhere causes and the pointerdown handles. Folding closes it too (`evaluate`).
   - Folded, a group is a `HEADING` label over a nested list of its rows, named by the label.

## Why it is shaped this way

- **One card per set.** A set's bonuses belong to all four pieces; a card per piece would repeat them four times.
- **No-set names as one card.** HP Support, Shield Enhancement and DEF Support come in three tiers each, like a reactor, so the tier is a switch in the details.
- **One piece at a time, all four compared.** T7SEN asked to see one piece at a time, and each piece's sub-stats would make four at once a long list. The list on the left still shows every piece's base stat at the level shown, which also fills the left side T7SEN found too empty. The level lives in `ComponentDetails`, not the panel, so the list and the panel agree.
- **Sub-stats by slot.** The lists are the same for every tier and set of a slot, so the index carries 26 names, not 180 lists.
- **Core slots as a count.** NEXON lists one core slot id per Ultimate piece, and the game shows two core slots for it (T7SEN, 2026-10-17); the details say "2 core slots". Which core types fit is not in the keyless data; T7SEN stated it (one Recovery and one Defense Augmentation core), and `core-type.json` gives everything else.
- **Levels in data files.** About 1 KB compressed per card, loaded when its details open, as for modules and reactors.
- **A disclosure, not a menu widget.** The Database button opens a list of links; ARIA's menu role is for application commands and expects arrow keys.

## What would break it

- NEXON giving a set's pieces different bonuses: the card shows the first piece's.
- A component name with no set that doesn't end in its slot: it gets a card of its own name.
- A stat id in `component-sub-stats.ts` that `stat.json` stops naming: it drops out of the list quietly (`componentSubStats`), and the count in the heading drops with it.
- NEXON changing the core type ids in `component-core-slots.ts`: the Core slots section drops the missing type quietly, or disappears with both.
- A link placed after the Database group in `sitePages`: Tab would reach it before the group's menu links.
- Changing the menu's `w-60` without `menuWidth` in `toggleMenu`: the menu is no longer centered and can pass the screen's edge.

## Checked by

- `src/lib/nexon/component-index.test.ts`, `src/features/external-components/component-filters.test.ts`, `src/features/command-palette/commands.test.ts`, `src/data/site-pages.test.ts`.
- `tests/e2e/external-components.spec.ts`, the Database menu and folded group tests in `shell.spec.ts`, the 390px check, and `index-url.spec.ts` through the menu in three browsers.
