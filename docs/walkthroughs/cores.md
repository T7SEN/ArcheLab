# The Cores page

`/cores` (ADR 0044): every kind of core that goes in Ultimate weapons' and external components' core slots, from NEXON's data, as an index built like the modules index (`docs/walkthroughs/modules.md`); this covers what differs.

## The code path

1. **The sets.** `fetchCoreKinds` (`src/lib/nexon/core-index.ts`) reads `core-type.json` and the materials (`fetchCoreTypeSets`, shared with weapon pages), the language-free `core-slot.json` (its own schema, which also reads `available_external_component_id`), `acquisition-detail.json`, each Ultimate weapon's slot ids and summary (`weapon-page.ts`), and the external components index's cards (`fetchComponentGroups`).
2. **What each slot takes.** For each weapon, `coreSlotTypesOf` gives its five slot types and `slotNameOf` their names ("Free", "Firepower"). `fitsOf` turns a slot type into the one-set core types it takes: a typed slot its own type, a Free slot the six whose sets its Free Augmentation variant holds. So `takenBy` knows, for each one-set type, every weapon and the slots that take it; the external component slots give each type its pieces.
3. **The kinds.** The one-set types some slot takes are the versions, grouped by NEXON's name ("Firepower Augmentation") into kinds, in id order. `coreTypesFrom` (`core-types.ts`, shared with weapon pages) gives each version's grades with their core items and rolls; a firearm's Hit version also takes the plain Hit core (`weaponCoreAlsoTakes`). A version's weapon types are the types of the weapons that take it. A kind's weapons are sorted by type, then name, each with its slots across its versions. Its drops are, for each grade, its versions' core items once each, and for Defense and Recovery their plain cores too (`plainCoreKinds`, ADR 0050), with their `acquisition_detail` places (`sourceText`) and a link for each place that is a 400% operation (`withPlaceLinks`, `fetchPlaceHrefs`). Its external component cards are the cards with a piece that takes it, with that piece's rarity name for the index's tier filter.
4. **The filters.** `parseCoreFilters` (`src/features/cores/core-filters.ts`) reads `for`, `type`, `q` and `core`, ignoring values the index doesn't offer. `filterCores` keeps the kinds for the chosen equipment, with a version for the chosen weapon type (`shownVersions`), holding every search word. With a type chosen, the search, the card's rolls (`rollNames`) and the details see only that type's version and weapons (`shownWeapons`).
5. **The grid.** `CoreIndex` (`core-index.tsx`) shows the search, the For chips, the Weapon type dropdown (`FilterSelect`) and the cards in the roomy grid. Choosing External Components clears the weapon type, and a weapon type clears External Components, so the two never leave the grid empty. The open kind's `CoreDetails` goes in the row under its card's row (`rowEnd`). A grade's drop places use the material pages' boxes (`PlaceGroups`, `src/features/game-data/place-groups.tsx`, ADR 0045), one set per core item, and so do the lists of what takes it, headed "Applies to" (`BoxColumns` and `Box`): a box per weapon type, and the external component cards split into sets and components with no set (`componentGroups`, the external components index's words). A box holding most of a list's lines spans the row, its lines in columns (`isWideBox`): the Sets box does.
6. **The details.** `CoreDetails` (`core-details.tsx`) keeps its own grade, starting at the highest; the switch slides the rolls in (`useSlideIn`) and changes the header's art and the drop places. Versions are headed by their weapon types when there are several, or when a type is chosen. Weapons are grouped by type (`weaponsByType`), each with `slotSummary`. External component cards link `/external-components?tier=<rarity>&component=<slug>`.
7. **Links back.** `CoreTypeGrid` (`src/features/game-data/core-type-grid.tsx`) links each type's name with `coreHref`: on a weapon page with the weapon's type, so the Cores page opens on that version.
8. **Links in.** The database page's items list each kind with what it goes in as the hint and its core items' names and rolls as keywords, opening `/cores?core=<slot>`.

## Why it's shaped this way

- **By kind, not by item or version.** A player asks what a Firepower core rolls; the answer depends on the weapon, so the versions sit side by side in one card's details, and a weapon type narrows them to one (T7SEN chose kinds).
- **What slots take, not what NEXON lists.** `core-type.json` holds types no slot takes (melee Tactical, Precision and Special; two Free variants); showing them would claim cores the game doesn't use.
- **Slots counted per weapon.** "Free, Firepower ×2" says how many of a weapon's five slots a core can fill, which a list of weapons alone doesn't.
- **Drops per grade.** Low grades come from a quest or Craft Core, high ones from Void Erosion Purge and Hard missions; one list for all grades would hide that.
- **External components by card.** All 124 pieces would be a wall of names; their 31 cards open the pieces on the external components index.

## What would break it

- NEXON renaming a core type: a new card with the new name, and links from weapon pages built from the old name still work only if the slot word stays the same (`coreSlotName` drops " Augmentation").
- A Free Augmentation type with one set: it would read as a kind of its own.
- NEXON moving `core-slot.json` under the language folder: no slots, so no cards (and weapon pages lose their core slots too).
- The external components index renaming its `tier` or `component` query keys: the component links open the index unfiltered.
