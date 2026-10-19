# The Core Materials page

`/core-materials` (ADR 0047): every part that researches a Descendant, weapon, Fellow, vehicle or Enhancement Material, as an index built like the Basic Materials one (`docs/walkthroughs/basic-materials.md`); this covers what differs.

## The code path

1. **Which items.** `coreMaterialIds` (`src/lib/nexon/material-links.ts`) walks `research.json`: each input of a `Character`, `Equipment`, `Fellow` or `Vehicle` research, or of a part's (`CharacterMaterial`, `EquipmentMaterial`, `FellowMaterial`, `VehicleMaterial`), that isn't a basic material; and each `ResearchMaterial` input of an `UpgradeMaterial` research (the Enhancement Material Blueprints). The set is cached per research list in a `WeakMap`, since `materialHref` asks it for every ingredient of every recipe on the site.
2. **The sets.** `fetchCoreMaterials` (`src/lib/nexon/core-material-index.ts`) reads `consumable-material.json`, `research.json`, `acquisition-detail.json`, `fetchBuildTargets`, the Amorphous Materials index and the place links (`fetchPlaceHrefs`). `coreMaterialIndex` keeps the materials in the set and gives each its tier (`coreMaterialTier`, `src/data/core-materials.ts`), its uses (`usesOf`, shared with Basic Materials), its own recipe one level deep (`recipeFor`), the patterns that give it, its drop places and their links.
3. **Patterns.** `givenBy` maps each reward id of each pattern on the Amorphous Materials index to the pattern and its chance, so only patterns still in the game show; the `AM:` ids among a material's drop places are left out for the same reason, with `RS` ("Obtainable through Research"), which the recipe shows.
4. **The grid.** `CoreMaterialIndex` shows tier and For chips and a search (`core-material-filters.ts`: `forText`, the URL filters, `filterCoreMaterials`) and draws the cards 60 at a time as the page scrolls (`useCardBatches`, `MoreCards`). A card's small box holds `forText`: "For Ultimate Bunny". `CoreMaterialDetails` shows "Used for", the recipe (`ResearchRecipe`), "From Amorphous Material Patterns" and "Where to find it".
5. **Links back.** `materialHref` returns `/core-materials?material=<slug>` for an id in the set, so every research recipe (`RecipeItem.href`) and every pattern's rewards link the material.

## Why it's shaped this way

- **The research data, not a list.** The Library lists 565, 93 of them Blueprints no longer usable; what research takes is the usable set, and it follows each update without a hand-kept list.
- **Tiers kept by id.** Nothing in NEXON's keyless data gives a tier, and the tier of what an item builds is wrong for 227 of 469.
- **Batches.** 469 cards, drawn 60 at a time like the other long indexes (Modules, Mutant Cells, Cosmetics, Amorphous Materials; ADR 0031).

## What would break it

- A new research type that builds a Descendant, weapon, Fellow or vehicle part: its inputs wouldn't count until `buildResearch` lists it.
- NEXON filing a basic material under a build research's parts list it doesn't today: it stays on Basic Materials, since basic ids are checked first.
- A new Ultimate Core Material not added to `ultimateCoreMaterials`: it shows as Rare.
