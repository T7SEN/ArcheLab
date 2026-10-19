# The Basic Materials page, and the material pages' boxes

`/basic-materials` (ADR 0045): the 65 materials of the game's Basic tab, as an index built like the Amorphous Materials one (`docs/walkthroughs/amorphous-materials.md`); this covers what differs, and the boxes every material page shares.

## The code path

1. **The list.** `src/data/basic-materials.ts` holds the 65 by NEXON id, with each tier and the Library's description, in the game's order. NEXON's data files them as `ResearchMaterial` with every part, so nothing else can pick them out.
2. **The sets.** `fetchBasicMaterials` (`src/lib/nexon/basic-material-index.ts`) reads `consumable-material.json`, `research.json`, `acquisition-detail.json` and `fetchBuildTargets` (the Descendants, weapons, Fellows and vehicles by id, shared with the Amorphous index). `basicMaterialIndex` keeps the listed materials NEXON has and gives each its art, its drop places (`sourceText`: no bracket padding, no doubled spaces) and its uses.
3. **The uses.** `usesOf` walks each research that takes the material: a result that is a Descendant, weapon, Fellow or vehicle is a use; an `UpgradeMaterial` result is an Enhancement Material (its slug as the Enhancement page writes it); any other result is a part, so each research taking that part adds what it makes. Uses sort in the For filter's order, then A–Z.
4. **The grid.** `BasicIndex` shows tier and For chips and a search (`basic-filters.ts`: `usesSummary`, `hrefOfUse`, the URL filters, `filterBasic`), and draws all 65 cards in the roomy grid. A card's small box (`CardText`) holds `usesSummary` or, for a material no research takes, its description. `BasicDetails` lists the uses by kind as links and the drop places in `PlaceGroups`.
5. **Links back.** `recipeFor` (`src/lib/nexon/recipe.ts`) sets `RecipeItem.href` through `materialHref` for any ingredient with a page (a basic material, Core Material, Shape Stabilizer or Miscellaneous item); `ResearchRecipe` links that name, so every research recipe on the site opens the material.

## The shared boxes

- **`groupPlaces`** (`src/features/game-data/places.ts`) splits each place name at the first " - " (else ": ") outside brackets: what comes before is the box's title ("[Axion Plains] [Hard]"), the rest is the place. The place runs to its last "]"; what follows is a way ("complete", "Mission Monster"). One place's ways merge onto one line. Names with neither mark go last, untitled.
- **`PlaceGroups`** (`place-groups.tsx`) draws the groups with `BoxColumns` (CSS columns by container query, so the boxes fill the space they're in) and `Box`; each way is a small tag. `isWideBox` lets a box with most of the lines span the row, its lines in columns of their own. The Cores page builds its "Applies to" lists from `BoxColumns` and `Box` too.
- **`CardText` and `CardTags`** (`card-tags.tsx`): a card's description in a small box (Basic and Enhancement Materials, Mutant Cells), or names with notes in small boxes (an Amorphous pattern's rewards and chances).

## Why it's shaped this way

- **A list by id, the rest from NEXON.** Names, art, drop places and uses follow NEXON's data each build; only which items are basic materials, their tiers and descriptions need the list.
- **Outside brackets only.** NEXON writes names like "[Trials - Protocol 001]" and "[Amorphous Material Pattern: Bunny]"; splitting inside them showed "[Trials" over "Protocol 001] …".
- **Ways as tags.** Joined with " · ", "Support Complete · complete" read as one phrase; as tags they stay the game's words and read as separate ways.
- **Columns, not rows.** Archive Shard has 118 places; in rows, its biggest box left gaps beside it and the details ran 2,200 px tall.

## What would break it

- NEXON changing a basic material's id: it drops off the page until the list follows (the unit test pins 65).
- A place name with " - " outside its brackets that isn't a group: it would show as a box of its own (none on 2026-10-18).
- A new research type that makes a Descendant part without a `Character` research after it: its use wouldn't resolve, and the material would show fewer uses.
