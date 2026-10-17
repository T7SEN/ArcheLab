# The Fellows page

`/fellows` (ADR 0035): a big card per Fellow, opening its details under its row.

## The code path

1. **NEXON's data.** `src/lib/nexon/fellow-index.ts` (server only) reads `fellow.json` with a schema for the fields used. `fellowGroups` sorts Fellows by id and levels by level, names each stat from `stat.json` (a stat it can't name is left out), and finds the Fellow's research: `researchFor(research, "Fellow", "fellow_id", id)`, then `recipeFor`, as Descendant and weapon pages do. `fetchFellows` memoizes it per build worker.
2. **The notes' facts.** `src/data/fellows.ts` holds the Update 1.4.0 notes' table, row for row (`fellowLevelFacts`), the passives' names (`fellowPassives`), tfdhub.gg's passive pairing (`fellowPassiveOf`, confirmed in game by T7SEN), each Fellow's art file (`fellowArt`) and the Inversion Reinforcement effects (`fellowEffects`, `anyFellowEffect`). The name-keyed records are `Partial`, so a Fellow NEXON adds later shows without a passive or an effect instead of breaking.
3. **The page.** `src/app/fellows/page.tsx` turns each group into a `FellowCard` (`src/features/fellows/fellow-card.ts`): the tier's name and color from the chat registry, the art, passive and effect by name, NEXON's levels and the research.
4. **The cards.** `FellowShowcase` (client) reads `?fellow=` through `useSearch()` inside a `<Suspense>` and `openFellow`. Each card (`ShowcaseCardLink`, `src/features/game-data/showcase.tsx`) is a plain link to `/fellows?fellow=<slug>`; a plain click writes the query instead (`writeSearch`, `fellowSearch`). It shows `ShowcaseArt` and four numbers at the top level, `fellowNumbersAt`, which looks up NEXON's stats and the notes' row for that level.
5. **The details.** They go in a full-width row after the open card's row: `rowEnd` with `useShowcaseColumns` (three columns from 48rem, one below, so on a phone the row is the card's own). `FellowDetails` focuses its heading and scrolls into view (`useRevealDetails`), closes on Escape, and folds away on close (`useClosing`, `DetailsRowItem`). Its `LevelView` slides over the same numbers at every level.

## Why it's shaped this way

- **Big cards.** Three small cards left the page empty (T7SEN, 2026-10-17); a big card shows the art and the numbers players compare first, and the rest is a click away. Of three layouts rendered, T7SEN chose this one.
- **No data files.** Three Fellows of 40 short rows are smaller than one reactor's levels file.
- **The art is the site's own files.** NEXON's data and hosts have none, so the three images T7SEN supplied are WebP files in `public/art/fellows/` (converted from PNG with Playwright's Chromium), an exception to never copying NEXON art into the repository. A Fellow with no file shows an empty tile, and its category's icon in the database search.
- **The passive carried a provisional badge** until T7SEN confirmed the pairing in game; `fellowPassiveStatus` keeps the switch. The Auto-Dismantle Cycle is in the notes' Fellow table with no Fellow named, so every Fellow shows it.
- **Percentages:** NEXON's and the notes' ratios are fractions; the page shows them as the reactors index does.

## What would break it

- A Fellow renamed in NEXON's data: `fellowPassiveOf`, `fellowEffects` and `fellowArt` miss it, and it shows without its passive, effect or art.
- A `fellow_detail` level outside the notes' 1 to 40: that level shows NEXON's stats only.
- Changing `showcaseGridClass`'s breakpoint without `useShowcaseColumns`: the details land after the wrong card.
