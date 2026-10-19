# The Enhancement Materials page

`/enhancement-materials` (ADR 0043): every item NEXON's `UpgradeMaterial` research makes, as an index built like the Amorphous Materials one (`docs/walkthroughs/amorphous-materials.md`); this covers what differs.

## The code path

1. **The sets.** `fetchEnhancementMaterials` (`src/lib/nexon/enhancement-index.ts`) reads `research.json`, `consumable-material.json` and `acquisition-detail.json`.
2. **The items.** `enhancementIndex` groups the `UpgradeMaterial` research by its result, so an item with three recipes is one item with three ways. Each way comes from `recipeFor` (`recipe.ts`, shared with the Descendant and weapon pages), then `withGameCounts` swaps in the game's count from `ingredientCounts` (`src/data/enhancement-materials.ts`): Core Binder's 20,000 Void Abyss Metal Fragments. The tier and description come from the same file, matched by name; items sort in its order (the game's), then A–Z. Drop places leave out `RS`, NEXON's "Obtainable through Research".
3. **The grid.** `EnhancementIndex` shows tier chips and a search (`enhancement-filters.ts`: the search reads names, descriptions and every ingredient, parts' own recipes too) and draws the 23 cards in the roomy grid, each description in a small box (`CardText`).
4. **The details.** `EnhancementDetails` shows the description, the drop places in `PlaceGroups` (`docs/walkthroughs/basic-materials.md`), then a `ResearchRecipe` per way. With several, each is titled by its first ingredient (`wayTitle`: "From Solenoid") and set `compact` (one column of ingredients), side by side: two or three across on wide screens.

## Why it's shaped this way

- **One card per item.** The game lists 33 recipe tiles, but players look for the item; its ways sit together in its details (T7SEN chose this).
- **The Library in `src/data`.** No keyless set has the items' tiers or descriptions; the Library does, matched by name.
- **The game's count wins.** T7SEN's screenshot shows 20,000 where NEXON says 2,000; the override keeps NEXON's recipe otherwise.
- **No "Obtainable through Research".** Every item here is researched, and the page already says how.

## What would break it

- NEXON renaming an item: it shows without a tier or description until the list follows.
- A new research type for these items: they drop off the page (only `UpgradeMaterial` counts).
- NEXON changing Core Binder's recipe: the override still applies to its Void Abyss Metal Fragments.
