# The database page

`/database` (ADR 0034): one search over every item, and a card per category.

## The code path

1. **Build time.** `src/app/database/page.tsx` calls `fetchDatabaseItems()` (`src/lib/nexon/database-items.ts`, server only). It reads the same lists the indexes read (`fetchDescendantSummaries`, `fetchWeaponSummaries`, `fetchModuleGroups`, `fetchReactorGroups`, `fetchComponentGroups`, `fetchFellows`, `fetchVehicles`, `fetchMutantCells`, `fetchCosmetics`, `fetchAmorphousPatterns`; ADR 0040 for the Mutant Cells, ADR 0041 for the patterns), and turns each into `DatabaseItem`s: a name, a category, where it opens, a short note, keywords, art and a tier color. The page uses them for the count and the category cards only.
2. **The same list as a file.** `src/app/database/items/route.ts` returns `{ items }` from the same function. `dynamic = "force-static"` makes it a file in the build, like `/modules/list`.
3. **In the browser.** `DatabaseSearch` (`src/features/database/database-search.tsx`) reads `?q=` through `useSearch()` inside a `<Suspense>`; the fallback, an empty search, is the static HTML. Focus on the box, or a non-empty `q`, sets `needed`, and an effect calls `loadDatabaseItems()`.
4. **One fetch per visit.** `loadDatabaseItems()` (`src/features/database/database-items.ts`) keeps its promise in a module variable, so every caller shares one request. On failure it clears the promise, so "Try again" (which bumps `attempt` and re-runs the effect) asks again.
5. **Checking the file.** `readDatabaseItems` checks every entry's fields and category before anything is drawn; a bad file counts as a failed load.
6. **Matching.** `searchDatabase(items, q)` folds spaces, needs two characters, and scores each item with `rank`: 0 exact name, 1 name starts with the search, 2 a word of the name starts with it, 3 the name holds every word, 4 only the category, note or keywords do. Null when any word appears nowhere. Ties go by `databaseCategories` order, then A–Z.
7. **Typing.** `onChange` calls `writeSearch`, the indexes' URL writer: the box shows the change at once, and the URL catches up after typing stops (Safari and Firefox limit history updates).

## Why it's shaped this way

- **The file loads on focus, not with the page.** Most visits pick a category; they never pay for the list (99 KB compressed since the cosmetics and patterns joined it, ADR 0039, ADR 0041).
- **`artFit` lives in `database-items.ts`, not in the client file.** The server page calls it for the category cards, and a server component can't call a function exported from a `"use client"` module.
- **Modules link to `/modules?module=<slug>`**, which opens the details in the grid and draws the batches up to that card (ADR 0031).
- **The category cards' art is the first four items of each list**, in the order the lists come: Descendants newest first, weapons highest tier first, modules, reactors and external components A–Z, cosmetics highest tier first (so the card leads with Ultimate art), Amorphous Material Patterns named ones first.

## What would break it

- Renaming a category in `databaseCategories` without the server side: `readDatabaseItems` would reject every item of the old name and the search would say it couldn't load.
- Making `/database/items` dynamic: every search would run a function on Vercel.
- Calling `loadDatabaseItems()` during render instead of in the effect: the page would fetch the list on every visit.
