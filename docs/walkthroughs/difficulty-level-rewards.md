# Difficulty Level Rewards

The page at `/difficulty-level-rewards` (ADR 0048) shows each battlefield's reward in the current week and every published week after it, and what drops in each battlefield. Its data is fetched at build time; which week it is gets worked out in the visitor's browser.

## Code path

1. **Data, at build time.** `src/lib/nexon/difficulty-rewards.ts` (`difficultyRewards`, pure; `fetchDifficultyRewards`, once per build worker):
   - reads `reward.json` and keeps every battlefield with rewards, by region and name. Any problem with its shape (two rewards in one rotation, an unknown reward type, a reactor without its types, a battlefield missing weeks) logs a warning and returns no battlefields, so the page shows its load-failed box;
   - joins Update 1.4.0's table (`src/data/battlefield-missions.ts`) to it through the table's aliases ("The Sterile Land" is "Sterile Land", "Fallen Theater" is "The Fallen Theater");
   - places drop places by kind: missions (`BaseMission`, `RouteMission`) by their name within their region through the table; outposts (`VulgusPostField`) by the name before ": Vulgus Strategic Outpost"; Void Fusion Reactors (`VoidFusionField`) by the name after "Void Fusion Reactor - <region> ", both through `src/data/difficulty-rewards.ts`' aliases. Exact names only: "Ruins Path" is in The Lumber Yard;
   - lists each place's items from `consumable-material.json`, with their ways and their pages (`materialHref`, then Amorphous Material Patterns, Enhancement Materials and cores by name);
   - keeps the rotations from the build's own week on (`rotationAt(Date.now())`).
2. **Drops, per battlefield.** `src/app/difficulty-level-rewards/data/[battlefield]/route.ts` serves each battlefield's drops as a static JSON file; `battlefield-drops.ts` reads it in the browser (`dataFileHook`).
3. **The week, in the browser.** `use-reward-week.ts`: `useCurrentRotation` is `useSyncExternalStore` whose server snapshot is null and whose client snapshot is `currentRotation(Date.now(), firstShipped)`. Its subscription sets one timer for the next week's start and re-reads when the tab becomes visible. `useMinuteClock` is a second store for the countdown, so the grid doesn't re-render each minute.
4. **Filters.** `reward-filters.ts` (pure): `parseRewardFilters` reads the URL, ignoring weeks that have passed and values the page doesn't offer; `filterBattlefields` applies the reward filters in one week and Region and search in all; `weekMatches` gives each week's matches, for the chips' counts and the week-by-week list.
5. **The page.** `reward-index.tsx` lays out the panel (`WeekSwitch`, search, chips, selects), the status line, `RewardFinder` for a full pick, and one grid per region with the open battlefield's details under its row (`rowEnd` within its region).

## Why it is shaped this way

- **The week can't be rendered at build time.** The weekly build runs on Mondays and the rewards change on Tuesdays at 07:00 UTC, so a rendered "this week" would be wrong most of the week. A null server snapshot keeps the static HTML free of any week, and React replaces it after hydrating without a mismatch.
- **One basis for labels.** A week's chip and URL key are its UTC start date, so a link means the same week everywhere; only the time line shows local times, which is why a viewer in California sees the chip "3 Nov" over "Mon 2 Nov, 23:00 PST".
- **Never the past.** `reward.json` is a schedule NEXON rewrites: its first rows never ran as written. Showing only the current week and later ones keeps the page from presenting a guess as history.
- **Drops load per battlefield.** All 37 battlefields' drops are about 70 KB; the page needs none of it until a battlefield opens.

## What would break it

- **NEXON changes the reset time or skips a week.** The anchor in `src/data/difficulty-rewards.ts` then needs moving; until T7SEN checks it in game it is marked provisional.
- **NEXON renames a battlefield or a mission.** The join warns at build and leaves the battlefield or place out; update the aliases.
- **A new reward type.** The shape check fails and the page shows its load-failed box until `rewardOf` learns it.
- **Rendering the week on the server**, or reading `Date.now()` outside the store's client snapshot: the static HTML would name a week that may have ended, and hydration would mismatch.
- **Calling `fetchDifficultyRewards` from an index its drops link** (Amorphous, Enhancement, Cores, through `fetchItemHrefs`): each would wait for the other and the build would hang. Other pages that need the battlefields, their places or their rewards use `fetchRewardSchedule`, the same data without the drops (`place-links.ts`, `reward-links.ts`; ADR 0050).
