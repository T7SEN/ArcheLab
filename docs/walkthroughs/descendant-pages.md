# Descendant pages

## Code path

1. `src/lib/nexon/descendant-page.ts` (server-only) fetches through `fetchMetadataSet`, once per build process:
   - `descendant.json` on its own (`descendantsPromise`), for every list of Descendants: `fetchDescendantSummaries()` gives each one's slug, name, Ultimate flag, portrait, attributes and Arche types, newest first by id (`descendantSummaries`);
   - with `stat`, `module`, `research` and `consumable-material` (`setsPromise`), for the pages: `fetchDescendantPage(slug)` returns `descendantPageFrom(sets, slug)`. All four come through `shared-sets.ts`: `stat`, `research` and `consumable-material` shared with the weapon pages (ADR 0024), `module` with the modules index (ADR 0025). The recipe comes through `researchFor` and `recipeFor` in `recipe.ts`.
   - `fetchDescendantLinks()` gives each Descendant's link by NEXON id, for the modules index's "Equipped by".
   - `fetchDescendantSkillTypes()` gives each Descendant's skills' attributes and Arche types, for the reactors index; the page's Reactors section lists the reactors matching one of its skills (`reactor-cards.tsx`, ADR 0026).
2. `descendantPageFrom` builds plain data:
   - levels and stats in the Descendant's own order (`statsOf`); on an Ultimate's page each stat also carries its base's values at the same levels (`baseValues`);
   - the pair: the two Descendants sharing a `descendant_group_id`, base first (`pair`), and `baseName` on an Ultimate's page;
   - skills as NEXON lists them, and the attributes and Arche types, each once, with any Arche types T7SEN found in game that NEXON leaves out after them (`archeTypesOf`, from `src/data/arche-types.ts`; Raven's Singular);
   - the modules whose `available_descendant_id` holds this Descendant, with capacity at their lowest and highest levels (null when NEXON lists none), the effect at the highest, and `ultimateOnly` when the Ultimate's base can't equip it;
   - the `Character` research, with each part's `CharacterMaterial` recipe one level down and the Amorphous Material Patterns named in `acquisition_detail` (`AM:<id>`), only those still in the game (`patternInGame`), each linking its details on the Amorphous Materials index (`ResearchRecipe`'s `Sources`; ADR 0041);
   - `previous` and `next` in the newest-first order.
3. `src/app/descendants/[slug]/page.tsx`: `generateStaticParams` maps the summaries to slugs, and `dynamicParams = false` makes any other slug a 404. `generateMetadata` and the page each call `fetchDescendantPage(slug)`; a null result calls `notFound()`. `dynamicRoutes` in `site-pages.ts` names the route's source, which `site-pages.test.ts` requires.
4. The page renders the hero ("← All Descendants", the badge, the pair switch as links with `aria-current`, the name, attribute and Arche chips, key stats, and the chat button when the Descendant has a chat icon), then its sections as browser-style tabs (`PageTabs`, ADR 0029), from `src/features/descendants` and, shared with the weapon pages, `src/features/game-data` (`StatLevels`, `ResearchRecipe`, `rarity.ts`):
   - `StatLevels` (client: the level slider); given `baseName`, each card adds a `Difference`: "+114 vs Bunny" or "Same as Bunny";
   - `SkillsSection` (client: the Transcendent module Select), around `SkillList`, which marks the skills the picked module's effect names;
   - `ModuleCards`, with rarity names and colors from `src/features/game-data/rarity.ts` and the chat registry's tier tags, and a gold "Ultimate only" chip;
   - `ResearchRecipe` (native `<details>` for each part), in the How to obtain tab (`#obtain`; named Research until 2026-10-17, ADR 0032);
   - the Builds placeholder; after the tabs, "More Descendants": previous and next (`NeighborLink`, `rel="prev"` and `"next"`).

   `PageTabs` (`src/features/game-data/page-tabs.tsx`, client) takes each section as `{ id, label, title?, icon, description, content }`:
   - Base UI's Tabs, controlled: the open tab is the address's hash, read with `useSyncExternalStore` (`subscribe` listens to `hashchange`; the server snapshot is empty, so the HTML opens on the first tab). A hash that names no tab opens the first.
   - `select` (Base UI's `onValueChange`, user changes only, `reason === "none"`) replaces the address with `#id`, or the bare path for the first tab, through `history.replaceState(null, …)`, tells the store's listeners, and, if the strip is stuck (the root's top above the strip's), scrolls the root to the top under the navbar (`scroll-mt`, `behavior: "instant"`).
   - The strip is `sticky` under the navbar. A sentinel one navbar height plus 2px above its resting place, watched by an IntersectionObserver, sets `data-stuck` on it, and a `::before` then fills the navbar's band.
   - Each tab has an anchor: a hidden `span` with its id at the root's top, so `#research` in a link lands the strip under the navbar.
   - The open tab's shape is a `Tabs.Indicator` (first in the list, behind the tabs), placed by Base UI's `--active-tab-*` variables and sliding on `left` and `width`; its feet are its `::before` and `::after`. `renderBeforeHydration` places it before React loads.
   - Panels are `keepMounted`: hidden ones stay in the HTML. Each opens with an `sr-only` `h2` (`title ?? label`) and its description. An opening panel transitions from `data-starting-style` (transparent, 16px toward its tab's side, by `data-activation-direction`); a closing one has `data-ending-style:transition-none`. They sit in an `overflow-x-clip` wrapper.
   - An effect keyed on the open tab scrolls the strip sideways to it when it is out of view (phones).

   The page resolves attribute icon URLs (`elementIconUrls`), the Ultimate color (the registry's `ultimatecharacter` tag) and rarity colors on the server and passes them as plain props. `type-icons.tsx` draws them: `ElementIcon` from a URL, `ArcheIcon` as ArcheLab's own symbol per Arche type. The chat button is a share link from `descendantChatIds()` and `shareHash`.
5. `src/app/descendants/page.tsx` (the index, static) fetches the summaries, orders the attributes and Arche types it offers (known names in a fixed order, any new ones after, A–Z), and renders, inside `<Suspense>`, `DescendantIndexFromUrl` (client, `descendant-index.tsx`), with the unfiltered `DescendantIndex` as the fallback the static HTML holds:
   - `useSearch()` (`src/features/game-data/url-query.ts`, shared with the weapons index) returns the query: a change not yet in the URL from memory, otherwise Next.js's `useSearchParams`, which follows every navigation;
   - `parseFilters` turns the query into filters, ignoring values the index doesn't offer, and `filterDescendants` filters and sorts the cards (`index-filters.ts`, pure);
   - every control calls `writeFilters` → `writeSearch(filtersToSearch(…))` (defaults left out): the grid follows at once, and the URL 300ms after the last change, with `history.replaceState(null, …)` so Next.js takes it into its router. The URL gets `urlSearchOf(…)`, the query without blank values: a search of only spaces stays in memory and in the box, and out of the URL.
6. Links elsewhere:
   - the navbar and footer list `/descendants` (`sitePages`), and on a Descendant's page the navbar marks Descendants as the section (`navbarCurrent`, `aria-current="true"`);
   - the home carousel's cards link to `/descendants/<slug>` (`DescendantItem.slug`, from `showcase.ts`), and its header to the index;
   - the root layout passes `paletteDescendants(await fetchDescendantSummaries())` to the command palette;
   - `sitemap.ts` lists `siteHrefs(slugs)`.
7. Tests: `src/lib/nexon/descendant-page.test.ts`, `src/features/descendants/index-filters.test.ts`, `src/features/game-data/url-query.test.ts`, `tests/e2e/descendant.spec.ts`, `tests/e2e/index-url.spec.ts`, and the Descendant cases in `home.spec.ts`, `palette.spec.ts` and `metadata.spec.ts`.

## Why it is shaped this way

- **The transform is pure.** Fetching and shaping are split so the unit test can feed a small slice of real-shaped data. NEXON's oddities each have a test: levels out of order, a stat missing at one level, a module level list out of order, an Amorphous source.
- **One fetch per set per build.** `module.json` is 1.5 MB and `consumable-material.json` 0.7 MB. With a page per Descendant, a fetch per page would download them dozens of times. The promise lives for one build process; the next build fetches afresh, so the 30-day rule holds (ADR 0008).
- **`descendant.json` on its own.** The palette is on every page, so the root layout needs the list on every page it prerenders. Fetching only `descendant.json` for that keeps the module and material sets to the Descendant pages.
- **Pairs come from the group id.** `descendant_group_id` ties an Ultimate to its base; the "Ultimate " prefix only says which member is which.
- **Stats keep the Descendant's own order.** `stat.json` has a global `stat_order_no` that puts Max MP first. The Descendant's `stat_detail` lists HP, Shield, MP, DEF, as the game shows them.
- **Rarity comes from the chat registry.** NEXON gives `Tier1`–`Tier4` with no names or colors. The registry's verified `<tierN>` tags carry both, the one source for rarity colors (SKILL.md section 6).
- **The slider is a native range input.** It brings keyboard steps, Home and End, and touch with no new component. Its name is "Level" and `aria-valuetext` reads the level ("20"), so a screen reader hears "Level, slider, 20"; the big number beside the label is `aria-hidden`, since inside the label it made the name "Level 20, Level 20" (found 2026-10-16). The stats list's label carries the level, so a screen reader hears what changed.
- **The hero's key stats are named through a group.** A `<dl>` has no ARIA role that takes a name, so screen readers dropped its `aria-label`; a `role="group"` wrapper carries "At level 40" and the `<dl>` keeps its terms and definitions (found 2026-10-16, invisible to Lighthouse). `descendant.spec.ts` checks the name and the slider's.
- **Icons and colors are resolved on the server.** `SkillsSection` and `DescendantIndex` are client components, so anything they import ships to the browser. Reading the chat registry there would ship all of it; the pages read it on the server and pass only the URLs and colors they need.
- **The switch marks what the effect names, nothing more.** NEXON has no changed skill text, so `changesSkills` is the skills whose names appear in the module's effect. A module whose effect names no skill (Law of the Back Alley) marks none, and the panel says so, rather than guessing which skill it changes.
- **`ArcheIcon` is a switch, not a lookup.** Picking a component from a map during render trips React Compiler's `static-components` rule; returning each icon from a `switch` keeps them static.
- **Sections are tabs, like a browser's (T7SEN, 2026-10-17; ADR 0029).** They replaced section links that glided down one long page. The open tab is in the hash, not the query: `useSearchParams` would need a Suspense boundary on a prerendered page, and the hash was already a section's address.
- **A switch replaces the address.** Tabs add no history entries, so Back leaves the page; `null` as the state lets Next.js take the new address into its router, which kept Back from the next page on the right page (section links needed Next.js links for the same reason, found 2026-10-16).
- **Only closed tabs react to hover** (T7SEN, 2026-10-17). A hover fill on the open tab replaced its solid one, so the strip showed through it beside its solid feet; a closed tab's hover box reached into the open tab's foot. The open tab has no hover style, and a closed tab's hover is a pill inset 8px from its sides, clear of the 8px feet.
- **The open tab's shape is an indicator, not the tab** (T7SEN asked for slide animations, 2026-10-17). One element can glide from tab to tab; a shape on each tab could only appear and vanish. The tabs keep their text and icon colors, which change at once.
- **A closing panel doesn't animate.** Base UI keeps a panel shown until its animations end; an exit animation, or an entry still running when you switch again, would leave two panels stacked for a moment.
- **Anchors are spans, not the tabs.** With the ids on the tab buttons, a link to `#modules` made the browser focus the tab on load, focus ring and all (found 2026-10-17).
- **Every panel stays in the page.** Search engines see every section, and the level slider and the module switch keep their place across switches. Only the open panel is visible, so Ctrl+F finds the open tab's text only, and without JavaScript only Stats shows.
- **The stuck strip fills the navbar's band.** The navbar floats; without the fill, the page scrolled between it and the strip. The sentinel sits 2px further up so a strip resting exactly under the navbar (where a switch leaves it) counts as stuck.
- **Research parts use `<details>`.** It opens with no JavaScript, works with the keyboard, and keeps the page short until a player wants the counts.
- **The index's filters live in the URL, read in the browser.** A filtered view can be shared. A static page can't see the query on the server, so the HTML holds the unfiltered index (the Suspense fallback), and the browser renders the filtered one; Next.js requires the Suspense boundary for `useSearchParams` on a prerendered page. `useSearchParams` follows every navigation, including a link to the same index, which reading `location` missed (old filters stayed on screen, found 2026-10-16). `replaceState` keeps keystrokes out of the history. Under `pnpm dev` the server sees the query and streams the filtered index instead, and React shows a streamed boundary only on the next animation frame: in a hidden tab, or a browser pane the app isn't showing, the unfiltered index stays until the tab is visible (checked 2026-10-16, ADR 0025). Test filters in a visible tab, or against `pnpm start`.
- **The grid doesn't wait on the URL.** Writing the URL on every keystroke froze the search: Safari throws after 100 history updates in 10 seconds and Firefox ignores them past its limit, while the box shows what the query holds. A change now shows from memory and reaches the URL once typing pauses, retried if refused; its echo from Next.js is recognised (`written`), and any other URL change (a link, Back) drops a change not yet written. A click anywhere writes a pending change at once (a capture listener on the document, ahead of React's handlers): a write that waited could land while Next.js was moving to a link's page, and Next.js then stayed put. `index-url.spec.ts` checks all of this in the three browsers, one test with slowed page data.
- **A blank search stays in the box, not the URL.** `filtersToSearch` keeps every search, so a space typed first reads back as typed; `urlSearchOf` leaves blank values out of the URL, where they would be a blank search. Leaving it out of the query itself erased the space as it was typed (found 2026-10-16). `flush` keeps such a query in memory after writing the rest, until the URL moves without us, and a blank search alone offers no "Clear filters". The property tests check both round trips: every search through the query, and through the URL a blank one as none.
- **Unknown filter values are ignored, not errors.** A link naming an attribute NEXON later renames still opens a working page.
- **The builder's inserts outrank the Descendants in the palette.** On `/tools/chat`, "bunny" then Enter must insert the icon, not leave the page and the message, so the builder's source has order 25 and the Descendants 30.
- **Missing Arche types are data from T7SEN, not inferred.** NEXON states a Transcendent module's new Arche type for one module only (Ines's Time of the Hunting Hounds). Raven's Singular comes from T7SEN's in-game check and lives in `src/data/arche-types.ts` with its date, like the chat tags. Summaries and pages both use `archeTypesOf`, so the hero, the index card and the filter agree.
- **The build's validation warnings are expected: 13 in `stat.json`, 13 in `consumable-material.json`.** A different count means NEXON's data changed. `stat.json` has 10 per-Descendant resource names with ids like `105000109:101000002` that no Descendant's stats use, and 3 stats with a null `stat_order_no`, a field no page reads. `consumable-material.json` has 13 items without an image: 3 event tokens, Trade Storage Slots +1 and 9 EX-P Serums. None of them is used anywhere else in NEXON's data, so none reaches a page (checked 2026-10-17; ADR 0023). `module.json`'s Trigger modules, with no capacity and no Descendant, were dropped here too until the modules index allowed a null capacity (ADR 0025); a module card hides its capacity when it is null.

## What would break it

- Adding a page under `src/app` with another dynamic route without listing it in `dynamicRoutes`. The page test fails.
- Changing a Descendant's name in NEXON's data: its slug changes, and the old address becomes a 404.
- Two Descendants whose names give the same slug: one page would hide the other.
- Removing `consumable-material` from `metadataSets`. The research section loses its names and disappears.
- Decoding `acquisition_detail` codes before they are confirmed: it would state game facts the data does not. `research_time` is confirmed as seconds (T7SEN, 2026-10-17) and shows with each recipe through `formatDuration`.
- Importing `element-icons.ts`, `rarity.ts` or the chat registry into a client component: the registry ships with the page.
- Matching module effects to skills loosely (by word): an effect mentioning a common word would mark unrelated skills.
- Fetching a set per page instead of once per build: builds slow down and fetch megabytes again for every Descendant.
- Rendering any route at request time: the root layout would fetch `descendant.json` on every request (Hobby caps; ask T7SEN first).
- Reading `window.location` during render: the server and client renders differ when the URL has filters, and same-page links go unnoticed.
- Calling `useSearchParams` outside the index's `<Suspense>`: the build fails (Next.js's missing-Suspense error), or the whole page renders in the browser.
- Writing the URL on every change, or passing `history.state` instead of `null` to `replaceState`: Safari and Firefox freeze the search past their limits, and Next.js's router loses track of the URL.
- Writing filters with `pushState`: Back would step through every letter typed.
- Leaving a blank search out of `filtersToSearch` again: a space typed first vanishes from the box. Writing `pending.search` to the URL instead of `urlSearchOf(…)`: links carry `?q=+`.
- Putting `aria-label` back on the hero's `<dl>`, or the slider's number back in its name: screen readers drop the first and read the level twice for the second.
- Adding an Arche type to `arche-types.ts` from a module's wording or a community site: it states a game fact nobody checked. Only T7SEN's in-game checks go there.
- Keying `extraArcheTypes` by anything but NEXON's exact `descendant_name`: the entry silently stops matching.
- Giving the builder's palette source an order above 30: "bunny" then Enter on the builder would open Bunny's page.
- Giving a tab an id another element on the page uses: the anchor and the element clash, and a link lands on either.
- Writing the tab with `pushState`: every switch becomes a Back step. Reading `location.hash` during render instead of through the store: the server's and the browser's HTML differ on a link with a hash.
- Giving the open tab a hover background, or a closed tab's hover pill less than the feet's 8px of inset: the shapes overlap again. The pill and the tab's content are positioned (`relative`) so the content paints over the pill.
- Putting anything but the indicator before the first tab, or using `first:` for the first tab's divider: the indicator is the list's first child, so `first-of-type` (the first button) marks the first tab. With `first:` the Stats tab grew a stray divider (found 2026-10-17).
- Moving the indicator after the tabs: it paints over their labels. Giving it `overflow` or the list `overflow-y`: its feet are clipped.
- Removing `data-ending-style:transition-none` or the `overflow-x-clip` wrapper: fast switching stacks two panels, and a sliding panel widens the page on phones.
- Dropping `keepMounted`: hidden sections leave the HTML, and sliders reset on every switch.
- Putting `overflow` back on the strip itself rather than its list: the open tab can no longer cover the hairline, and the feet are clipped.
- Scrolling smoothly in a test right before a switch: the glide is still moving when the tab opens, and the panel lands off its mark (found 2026-10-17).
