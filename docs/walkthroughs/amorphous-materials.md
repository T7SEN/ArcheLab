# The Amorphous Materials page

`/amorphous-materials` (ADR 0041): the Amorphous Material Patterns still in the game, from NEXON's data and T7SEN's in-game list, as an index built like the modules index (`docs/walkthroughs/modules.md`); this covers what differs.

## The code path

1. **The sets.** `fetchAmorphousPatterns` (`src/lib/nexon/amorphous-index.ts`) reads `consumable-material.json` (shared, `fetchMaterials`), `amorphous-reward.json`, `acquisition-detail.json` and `research.json`, and the Descendant, weapon, Fellow and vehicle lists for their ids and pages. `amorphous-reward.json` lives above the language folder; `metadataUrl` (`metadata.ts`) knows which sets do.
2. **The patterns.** `amorphousIndex` keeps the materials of type `AmorphousMaterial` named "Amorphous Material Pattern: …" whose name after the prefix is in `inGamePatterns` (`src/data/amorphous-materials.ts`, T7SEN's list of 44). For each, its `amorphous_reward` gives the opening that needs no Shape Stabilizer, whose items become rewards with their chances; an item NEXON doesn't list is left out, and a pattern with no rewards too. Its `acquisition_detail` ids become drop places (`sourceText` drops NEXON's bracket padding). `patternTier` gives its tier (Rare for Bunny and Freyna, Ultimate otherwise). Patterns sort highest tier first, then A–Z.
3. **The builds.** `buildOf` names what each reward is part of: the one build NEXON's research leads to, directly or through a part, else the longest build name the item's name starts with ("Ultimate Valby Spiral Catalyst Blueprint"). `patternKind` names what the pattern is for: the build it is named after, else the kind most of its rewards build.
4. **The filters.** `parseAmorphousFilters` reads `for`, `q` and `pattern` from the URL, ignoring values the index doesn't offer. `filterAmorphous` keeps the patterns of the chosen kind and those holding every search word in the name, rewards, builds or drop places.
5. **The grid.** `AmorphousIndex` shows the For chips (each with its index's navbar icon, like the weapons' Rounds filter) and draws the cards in the roomy grid (`roomyGridClass`, `useGridColumns("roomy")`): one to four columns. A card shows the art in its tier's color, the name, a tier badge and its rewards in a two-column grid, names wrapping and chances right-aligned. The open pattern's `AmorphousDetails` goes in the row under its card's row (`rowEnd`).
6. **Links in.** The database page's items (`src/lib/nexon/database-items.ts`) list each pattern under its game name with its tier, its builds as keywords, opening `/amorphous-materials?pattern=<slug>`. The page isn't prefetched (`prefetch: false` in `sitePages`), and the database page reads that flag for its cards and results.

## Why it's shaped this way

- **T7SEN's list, not NEXON's.** NEXON still lists 204 removed patterns and Hagios Sheepdog's; the game shows 44. The list lives in `src/data` so a new pattern NEXON adds stays off the page until it's added there.
- **NEXON's data for everything else.** No set says where a pattern opens, and some list no drop places; the page says "Not listed yet" rather than guess.
- **Research first, then names.** Codes are research inputs, so research finds their Descendant. Blueprints aren't inputs in today's `research.json`, but each is named for what it makes; the longest match keeps "Ultimate Bunny" from reading as "Bunny".
- **For, not Builds.** Every pattern is named for one Descendant, weapon, Fellow or vehicle, so four chips find it faster than a list of 69 builds (T7SEN).
- **A roomier grid.** Five rewards by name don't fit a fifth of the page; at five columns they were cut where they differ.

## What would break it

- NEXON renaming a pattern: it drops off the page until `inGamePatterns` follows (the unit test pins 44).
- NEXON moving `amorphous-reward.json` under the language folder, or renaming the prefix "Amorphous Material Pattern: ": the index comes up empty.
- A Blueprint named for a build that isn't the start of its name: its reward shows without "For …".
- A new tier: `patternTier` knows only Rare and Ultimate; a third shows as Ultimate until `src/data` says otherwise.
