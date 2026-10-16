# Reactors index

## Code path

1. `src/lib/nexon/reactor-index.ts` (server-only) fetches `reactor.json` once per build worker with `stat.json` (`fetchStats` in `shared-sets.ts`) and each Descendant's skill types (`fetchDescendantSkillTypes` in `descendant-page.ts`). `reactorGroups` shapes plain data:
   - one group per reactor name, A–Z, with a slug from `slugOf`, its tiers highest first, each with its art and its levels (Skill Power, Sub Attack Power, enchant bonuses named from `stat.json`), lowest first;
   - its boosts, named from `stat.json`, and the attribute and Arche type they boost: a boost's stat name less " Skill Power Boost Ratio", kept when a Descendant's skill uses that word;
   - the Descendants it suits, newest first (`reactorMatch`): one skill of both; or an Arche type T7SEN found in game (`extraArcheTypes`, from `arche-types.ts`) when all their skills have the reactor's attribute, (Raven's Singular). Such a Descendant shows like any other: no note, and on its page the reactor's card has no "Matches" line, since no skill of both is listed.
   `fetchReactorGroups` memoizes it; the index, the data files, Descendant pages, the layout (palette) and the home page all read it.
2. `src/app/reactors/page.tsx` (static) turns groups into `ReactorCard`s without levels, with tier names and colors from the chat registry (`rarityOf`, on the server), and orders the attributes and Arche types as the Descendants index does. The index renders inside `<Suspense>` with the unfiltered index as the fallback.
3. `src/app/reactors/data/[slug]/route.ts` prerenders one JSON file per reactor: `{ levels: { [reactorId]: ReactorLevel[] } }`.
4. `src/features/reactors/reactor-index.tsx` (client) reads the URL query (`useSearch`, `parseReactorFilters`), filters (`filterReactors`: attribute, Arche type, and search words matching the name, attribute or Arche type), and puts the open reactor's details in a full-width row after its card's row (`rowEnd` and `useGridColumns` from `src/features/game-data/details-row.ts`), keyed by reactor. Cards are plain links to `/reactors?reactor=<slug>` that open or close the details in place.
5. `reactor-details.tsx` (client): `useRevealDetails` (`game-data/reveal-details.ts`) focuses the name and scrolls the details into view; `dataFileHook(readReactorLevels)` (`game-data/data-file.ts`) loads the levels once per visit; the tier switch and `LevelView` (keyed by tier, starting at the highest level) show the numbers; Escape or the close button closes, and focus goes back to the card.
6. Links in: `src/features/descendants/reactor-cards.tsx` (a Descendant page's Reactors section, built in its page from `fetchReactorGroups` and the page's skills), `src/features/command-palette/palette-reactors.ts` and `reactorCommands` (the Reactors group), `src/components/reactor-showcase.tsx` (the home carousel), and `sitePages` (navbar, footer, sitemap).

## Why it is shaped this way

- **The boosts name the types.** NEXON's coefficients point at `stat.json` entries named in the same words as skills' attributes and Arche types, so matching them needs no hand-made map of "Burning" or "Phase".
- **Found Arche types count only when unambiguous.** `arche-types.ts` says a Descendant has a type, not which skills take it. When every skill has one attribute, the pair is certain; otherwise it isn't counted.
- **No tier filter.** Every reactor comes in every tier; the tier is a switch in the details.
- **Levels in data files.** 300 levels a reactor would add about 600 KB to the index for data most visitors never open.
- **Shared pieces.** The row placement, the data-file loader and the open behavior are the modules index's, moved to `src/features/game-data`, so both behave the same.
- **Prefetch.** The reactors index's data is about 5 KB compressed, so the navbar may prefetch it; links that add a query (`?reactor=`), which Next.js prefetches separately, don't.

## What would break it

- NEXON renaming a boost stat away from "… Skill Power Boost Ratio": the reactor loses its attribute and Arche type, its filters and its Descendants, but keeps its boosts by name.
- Descendants' skills naming an attribute differently from the boost stats: no reactor would match them.
- Changing the grid's `grid-cols-*` classes without `gridColumns` in `details-row.ts`: details land mid-row (both indexes).

## Checked by

- `src/lib/nexon/reactor-index.test.ts`, `src/features/reactors/reactor-filters.test.ts`, `src/features/command-palette/commands.test.ts`, `src/features/game-data/details-row.test.ts`.
- `tests/e2e/reactors.spec.ts`, the palette test in three browsers, the home carousel test, and the 390px check in `shell.spec.ts`.
