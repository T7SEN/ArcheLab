# Void Erosion Purge

`/void-erosion-purge` (ADR 0053): today's Normal Stage 10 map, the five-map rotation, alerts for a map, and what each Normal and Challenge stage gives.

## The code path

1. **Build time.** `src/app/void-erosion-purge/page.tsx` calls `fetchVoidErosionPurge()` (`src/lib/nexon/void-erosion-purge.ts`, server only). `purgeMaps` turns `purgeCycle` into the five maps, with their art file and size from `src/data/void-erosion-purge.ts`, and warns of a name `fetchRewardMapNames()` (NEXON's `reward.json`) lacks, unless that list didn't load. `placeOf` reads a drop place's name, after `sourceText` tidies its brackets, as "[Void Erosion Purge] [Normal|Challenge] - [Stage n]" and an optional way after it; no way is "complete". Each stage gets its drops (materials before cores, each way it comes), and the stages sort Normal before Challenge, by number.
2. **The days.** `src/features/void-erosion-purge/purge-day.ts` (pure): `dayAt(ms)` counts days from `purgeRotation.startsAt` (07:00 UTC); `mapOn(day)` cycles `purgeCycle`, negative days included; `daysOf(name, from, count)` finds a map's next days; `dayLabel` names yesterday, today and tomorrow, then the day's UTC date, as the 400% page does.
3. **In the browser.** `usePurgeDay` (`use-purge-day.ts`) is a `useSyncExternalStore` over the day, re-read when the next one starts and when the tab comes back; the server's snapshot is null, so the static HTML names no day. The countdown ticks with the 400% page's `useSecondClock`.
4. **The page.** `VoidErosionPurge` (`purge-index.tsx`) reads `?map=` and `?stage=` (`purge-filters.ts`); the chosen map is the URL's, else today's; the stage is the URL's, else Normal Stage 10. `NowBoxes` and `ResetBox` draw the top row; `DayStrip` the days from yesterday to five ahead, each card a link that picks its map, today's scrolled into view; `MapList` the five-map cycle with a bell each; `MapPanel` the chosen map; `StagePanel` the difficulty and stage switches, and `StageDrops`, keyed by stage so its tab resets, the rewards with the 400% page's `RewardTile` and `rewardEntries`.
5. **The bigger picture.** `MapZoom`: the panel's picture is a Base UI `Dialog.Trigger`; its popup, in a portal over a backdrop, holds the title, a close button and the picture at up to the screen's height. Base UI handles Esc, a click outside, the page's scroll lock and focus going back to the picture.
6. **Alerts.** `savedStore("archelab:purge-maps")` (`src/features/axion/saved-missions.ts`, shared with the Axion page) keeps the followed maps, wrapped, in memory when storage throws. `AlertButton` toggles a map and asks for notices on its first press. `useMapAlerts` remembers the last day it saw and shows a `Notification` only when the day changes while the page is open.
7. **Scroll to the details.** Two requests (`useDetailsRequest`): the map panel's, at 1 when the URL names a map and up on each pick; the stage panel's, at 1 when the URL names a stage and no map. Picking a stage doesn't scroll: its rewards are right there.

## Why it's shaped this way

- **UTC dates, as the 400% page.** The game's day starts at 07:00 UTC everywhere; the change time is also shown in the visitor's own time.
- **Rewards per stage, not per map.** NEXON's drop places are per stage; every Stage 10 map gives Stage 10's rewards.
- **`relative` on each day card.** Each card's screen-reader date is absolutely positioned; without a positioned card it escaped the strip's scroll box and widened the phone page by 1,024px.
- **The art copied, not linked.** tfdhub's permission covers using the pictures; copying them keeps the page off their host.
- **One store, a key per page.** The Axion page's store already handled storage errors, other tabs and stable snapshots; `savedStore(key)` shares it.

## What would break it

- A map renamed in `purgeCycle` but not in `purgeMapArt` and `purgeMapArtSize`: the page shows no picture for it (the data test fails).
- NEXON renaming the place names' "Void Erosion Purge" or "Stage": no stage matches, and the page says the stages couldn't load.
- Reading the clock during render (`Date.now()` in a component): the server's HTML and the browser's first render would disagree.
- Making the day cards' `li` lose `relative`: the page scrolls sideways on phones.
- A Next.js dev server started before `savedStore` existed can keep the old module for server rendering ("savedStore is not a function"); restart it.

## Checked by

- `src/features/void-erosion-purge/purge-day.test.ts`, `purge-filters.test.ts`, `src/data/void-erosion-purge.test.ts`, `src/lib/nexon/void-erosion-purge.test.ts`, `src/data/site-pages.test.ts`.
- `tests/e2e/void-erosion-purge.spec.ts` (UTC, a fixed clock; the bigger picture; an alert through a stand-in `Notification` and an installed clock), and the Tab order in `shell.spec.ts`.
