# Weapon pages

## Code path

1. `src/lib/nexon/weapon-page.ts` (server-only) fetches `weapon.json` once per build (`weaponsPromise`), with `stat`, `research` and `consumable-material` from `shared-sets.ts`, shared with the Descendant pages.
   - `fetchWeaponSummaries()` lists every weapon in the index's order (`weaponSummaries`): highest tier first, then NEXON's id order, which runs by type.
   - `fetchWeaponPage(slug)` returns `weaponPageFrom(sets, slug)`:
     - the levels, lowest first, and each ATK type's value at every level (`attackOf`), types in NEXON's order;
     - the base stats in NEXON's order, named from `stat.json`;
     - the unique ability, or null;
     - the number of core slots;
     - the `Equipment` research's recipe (`researchFor` and `recipeFor` in `recipe.ts`);
     - `previous` and `next` in the index's order.
2. `src/app/weapons/[slug]/page.tsx`:
   - `generateStaticParams` maps the summaries to slugs, and `dynamicParams = false` makes any other slug a 404;
   - `generateMetadata` and the page each call `fetchWeaponPage(slug)`; a null result calls `notFound()`;
   - `dynamicRoutes` in `site-pages.ts` names the route's source, which `site-pages.test.ts` requires.
3. The page renders the hero ("← All weapons", the badges, the name, type and rounds with its icon, the summary, key stats, the art), the section links (`SectionLinks`), then sections (`PageSection`):
   - **Unique ability** first, when the weapon has one (T7SEN, 2026-10-16);
   - **ATK:** `StatLevels` from `src/features/game-data/` with `what="ATK"`;
   - **Stats:** `WeaponStats` (`src/features/weapons/weapon-stats.tsx`), cards from `groupStats` in `stat-groups.ts`;
   - **Core slot** and **Research** (`ResearchRecipe`) when the weapon has them;
   - **Builds:** a placeholder;
   - "More weapons": `NeighborLinks`.

   The tier's name and color come from `rarityOf` (the chat registry's tier tags), resolved on the server.
4. `src/app/weapons/page.tsx` (the index, static) fetches the summaries, resolves each tier's name and color, orders the types (A–Z) and rounds (known order first), and renders, inside `<Suspense>`, `WeaponIndexFromUrl` (client, `weapon-index.tsx`), with the unfiltered `WeaponIndex` as the fallback the static HTML holds:
   - `useSearch()` from `src/features/game-data/url-query.ts` returns the query: a change not yet in the URL from memory, otherwise Next.js's `useSearchParams` (see the Descendant pages walkthrough for why);
   - `parseWeaponFilters` turns it into filters, ignoring values the index doesn't offer, and `filterWeapons` filters and sorts (`weapon-filters.ts`, pure);
   - every control writes `weaponFiltersToSearch` through `writeSearch`; the URL gets it without a blank search (`urlSearchOf`), which stays in the box (see the Descendant pages walkthrough).
5. Rounds icons: `RoundsIcon` (`rounds-icon.tsx`) draws `roundsIconUrl(rounds)` from `src/data/rounds-icons.ts`, NEXON's Library icon for each rounds type, beside the name on the hero, the index's chips and cards, and the home carousel's cards.
6. Links elsewhere:
   - the navbar and footer list `/weapons` (`sitePages`), and on a weapon's page the navbar marks Weapons (`navbarCurrent`);
   - the home Weapons carousel's cards link to `/weapons/<slug>` (`WeaponItem.slug`), and its header to the index;
   - the root layout passes `paletteWeapons(await fetchWeaponSummaries())` to the command palette;
   - `sitemap.ts` lists `siteHrefs(descendantSlugs, weaponSlugs)`.
7. Tests:
   - unit: `src/lib/nexon/weapon-page.test.ts`, `src/features/weapons/weapon-filters.test.ts`;
   - e2e: `tests/e2e/weapon.spec.ts`, and the weapon cases in `home.spec.ts`, `palette.spec.ts`, `metadata.spec.ts` and `shell.spec.ts`.

## Why it is shaped this way

- **The transform is pure,** as on the Descendant pages: the unit test feeds a small real-shaped slice, with levels out of order, an ATK type missing at one level, and a stat without a name.
- **Shared sets, fetched once.** `stat.json`, `research.json` and `consumable-material.json` serve both kinds of page. Their schemas and promises live in `shared-sets.ts`, so a build that renders Descendant and weapon pages fetches each once per process.
- **Highest tier first, not newest first.** Weapon ids encode type, tier and a count, not release order, so sorting by id groups by type. The index's order is tier, then that id order; claiming "newest" would state a fact the data doesn't hold.
- **The stat groups are ArcheLab's, in data.** NEXON lists base stats flat. `stat-groups.ts` places all 46 names known on 2026-10-16 by what they do. A name NEXON adds later shows under "Other" rather than vanishing, and the unit test covers that.
- **No units.** NEXON's numbers come without units (Reload Time 1.48, Firearm Critical Hit Damage 1.8). Adding seconds or percent signs would state facts the data doesn't.
- **The core slot says only what is known.** Ultimate weapons have one slot id each, but no keyless set says which core types a slot takes (`core-slot` is 403). The section says so instead of listing every core type.
- **Rounds icons are NEXON's, matched on NEXON's own page.** The Library's weapons page shows each weapon with its rounds icon, which settled that Enhanced Ammo is `EnhancedRounds`. The icons are linked from NEXON's CDN, like the attribute icons.
- **Tier colors resolve on the server.** The index and palette need rarity names and colors from the chat registry; the server passes them as plain props, so no client component loads the registry.
- **Long names wrap.** A weapon card's name may take two lines ("Emperor's Guard Lance") rather than being cut off; `min-w-0` on the caption lets the tier badge keep its place.
- **The art comes first on phones.** NEXON's weapon art is a 1024 by 304 banner. Beside the text on wide screens, it leads the hero on phones, as a Descendant's portrait does. Its alt text follows the portrait's, "Monster Hunter's art": the weapon's name alone repeated the heading (found 2026-10-16).
- **Key stats are named through a group.** A `<dl>` has no ARIA role that takes a name, so screen readers dropped its "Key stats" label; a `role="group"` wrapper carries it and the `<dl>` keeps its terms and definitions. The ATK slider is named "Level" with the level as its value text, as on the Descendant pages. `weapon.spec.ts` checks all three names.

## What would break it

- Fetching `stat`, `research` or `consumable-material` with `fetchMetadataSet` directly instead of through `shared-sets.ts`: each kind of page fetches them again.
- Sorting the index or neighbors by weapon id alone and calling it "newest": ids group by type.
- Moving a stat into a group by a guess at what it does: groups are presentation, but a wrong one misleads. Unknown names belong in "Other" until placed.
- Listing core types on the Core slot section without a source that says which fit.
- Copy that names NEXON or its data as the source ("as NEXON lists it", "straight from NEXON's data"): only the footer and the legal pages do (AGENTS.md conventions).
- A rounds type NEXON adds later: it shows without an icon until `rounds-icons.ts` maps it from the Library's own page.
- Importing `rarity.ts` or the chat registry into `weapon-index.tsx` or another client component: the registry ships with the page.
- Removing `w-0 overflow-hidden` from PillNav's measuring copy: with four links every page scrolls sideways on phones (`shell.spec.ts` catches it).
