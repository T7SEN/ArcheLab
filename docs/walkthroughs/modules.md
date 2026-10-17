# Modules index

## Code path

1. `src/lib/nexon/shared-sets.ts` (server-only) fetches `module.json` once per build worker (`fetchModules`), for Descendant pages and the modules index alike. Its schema reads what both use; `module_class` and `available_weapon_type` fall back to null when they fail, and `module_capacity` may be null (Trigger modules).
2. `src/lib/nexon/module-index.ts` (server-only) adds `weapon-type.json` (weapon type names by id) and each Descendant's link by id (`fetchDescendantLinks` in `descendant-page.ts`), then `moduleGroups` shapes plain data:
   - one group per module name, A–Z, with a slug from `slugOf`;
   - each version (`ModuleVariant`) with a label that tells it apart, its category ("Descendant", a rounds class, or "Melee Weapon" when `isMeleeModule` in `src/data/melee-modules.ts` says so), rounds, weapon type names, tier id, socket, type, slots, owners, art, capacity from the lowest to the highest level, and every level;
   - versions in a fixed order (`moduleCategoryOrder`, then weapon type, then id); a module whose class or weapon types failed validation is left out.
   `fetchModuleGroups` memoizes it per build worker.
3. `src/app/modules/page.tsx` (static) turns groups into `ModuleCard`s without levels, with tier ids as rarity names (`rarityOf`, on the server), and builds the filter options: tiers highest first with their colors, sockets A–Z, classes in `moduleCategoryOrder`, types A–Z, slots in Main, Skill, Sub, Trigger order, owners A–Z. The index renders inside `<Suspense>` with the unfiltered index as the fallback, as on the other indexes.
4. `src/app/modules/data/[slug]/route.ts` prerenders one JSON file per group: `{ levels: { [moduleId]: ModuleLevel[] } }`. `dynamicParams = false` makes any other slug a 404.
5. `src/features/modules/module-index.tsx` (client) reads the URL query (`useSearch`), parses it (`parseModuleFilters` in `module-filters.ts`), filters and sorts (`filterModules`: a card passes when one of its versions passes every filter, in the tiers' order), and writes changes with `writeSearch`. `?module=<slug>` opens a module's details: the index reads the grid's columns (`useGridColumns` in `src/features/game-data/details-row.ts`, shared with the reactors index) and puts a full-width `<li>` after the last card of the opened card's row (`rowEnd`), keyed by module. Cards say `aria-expanded` and `aria-controls`; a second click closes the details, and closing gives focus back to the card (by its id, `module-card-<slug>`).
   The index draws its cards in batches (T7SEN, 2026-10-17; ADR 0031): `useCardBatches(query without the open card, batchesThrough(openIndex))` says how many batches of 60 to draw (`card-batches.ts`), `drawn` is that slice of the filtered cards, and the details row's place comes from `drawn`. `MoreCards`, under the grid, watches itself with an IntersectionObserver a screen ahead and calls `more` while it stays near. New filters start again from one batch; an open card's batches stay drawn after it closes.
6. `module-details.tsx` (client) is a `<section>` named by its title. On mount it focuses the title (`tabIndex={-1}`) and scrolls itself into view: a short `scrollIntoView` for a card in view (smooth through the page's `scroll-behavior`), or two instant jumps for a shared link, the second two frames later, once the cards around it have drawn at their real height. Escape inside it, or its close button, closes it. It is keyed by the module, starts on the version the index passes (`matchingVariants(...)[0]`), and loads the group's file once per visit (`loadLevels`, a promise cache; a failure is dropped from the cache so "Try again" asks again, and `readLevelsFile` rejects anything that isn't one). `LevelView` is keyed by the version and starts at the highest level. `ModuleEffect` renders `effectBlocks(effect)`: text, or a Trigger module's titled tables.
7. Links in: `src/app/modules/list/route.ts` serves the palette's module list (slug, name, highest tier, types and classes as keywords); `src/components/module-showcase.tsx` is the home page's tier tiles; Descendant pages' module cards link each name to `/modules?module=<slug>`. All of them, and the index, take tier names, colors and order from `src/features/modules/module-tiers.ts` (`versionTier`, `tierOptions`). Nothing prefetches `/modules`: the navbar's and footer's link has `prefetch: false` from `sitePages`, and the other links set it too.
8. Icons: `fact-icons.tsx` draws the Library's socket, slot and Descendant icons (`src/data/module-icons.ts`) and rounds icons (`RoundsIcon`), and lucide's sword for melee.

## Why it is shaped this way

- **One page, not 573.** Each static page costs about 365 KB of output (HTML, RSC, segments), and Hobby lists a 100 MB cap on CLI uploads (ADR 0025). The index and its data files add about 7 MB.
- **Levels in data files.** Every version's levels would put about 1.5 MB more into the page; the details need one group's at a time, and a file is a few KB.
- **Grouped by name.** 149 names cover 577 modules that differ by rounds class, weapon type or melee use; as separate cards they look alike.
- **Melee by id range.** NEXON's data marks melee modules only with a rounds class, which firearm modules share. The Library lists exactly the 125 modules with ids starting `25209` and `25210` as melee (2026-10-16). Effect text isn't enough: 29 of them never say "Melee".
- **Cards are plain links.** A plain click opens or closes the details in place; a modified click opens `/modules?module=<slug>` as a link would. A Next.js `Link` would prefetch the same page for every card in view.
- **Rarity on the server.** Tier names and colors come from the chat registry, so the client bundle never loads it, as on the weapons index.
- **The schema is shared.** Descendant pages and the index read one `module.json` per build worker. Fields only the index uses fall back to null instead of dropping the entry from Descendant pages.

- **Details in the grid, under the card's row** (T7SEN, 2026-10-16, after a side panel). The grid's columns are set by CSS, so `details-row.ts` mirrors its breakpoints; a row inserted after the opened card itself would leave a gap in its row.
- **Two tiers by type.** Ancestors and Trigger are tiers of their own in game (T7SEN), though NEXON gives them `Tier4` and `Tier3`; `src/data/module-tiers.ts` and `moduleTierOf` in `rarity.ts`. Each names the rarity whose color it shares in game (`colorOf`: Transcendent's for Ancestors, Ultimate's for Trigger), so the color never depends on NEXON's tier id.

## What would break it

- Deriving the batches from the open card alone, without keeping them in state: closing a shared link's details undraws hundreds of cards and the page shrinks under the reader.
- Watching the loading strip with one observer for its whole life: an observer reports only changes, so a strip still in view after a batch never asks for the next one, and a tall screen stops filling.
- Counting the grid's links to count cards, in a test: open details hold links of their own ("Equipped by").

- Making `module_capacity` required again: the 43 Trigger modules disappear from every build.
- Changing the grid's `grid-cols-*` classes without `gridColumns`: details land mid-row.
- Reading the open card with `shown.at(index)` when nothing is open: `at(-1)` is the last card, whose details then always showed (caught by e2e, 2026-10-16).
- Dropping `prefetch: false` from the Modules entry in `sitePages`, or a `Link` to `/modules` without it: every page prefetches about 35 KB compressed (368 KB to parse). `modules.spec.ts` checks the home page fetches nothing from `/modules`.
- A smooth scroll to details far down the page: `content-visibility` guesses off-screen card heights, and the scroll overshot to the page's end.
- A Next.js `Link` on the cards: hundreds of prefetches per visit.
- Putting levels back into `ModuleCard`: the page grows by about 1.5 MB.
- NEXON adding melee modules under a new id range: they show as firearm modules until `melee-modules.ts` lists it.
- Renaming a module's class: `moduleCategoryOrder` puts unknown classes last, A–Z, and the class filter offers them, without icons.
- Removing `weapon-type` from `metadataSets`: weapon types show as ids such as `WeaponSniperRifle`.

## Checked by

- `src/lib/nexon/module-index.test.ts`, `src/features/modules/module-filters.test.ts`, `src/features/modules/effect-blocks.test.ts`.
- `tests/e2e/modules.spec.ts` (Chromium) and the 390px check in `shell.spec.ts`.
