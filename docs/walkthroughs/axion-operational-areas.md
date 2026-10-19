# Axion Operational Areas

`/axion-operational-areas` (ADR 0052): the two Axion Plains Operational Area missions active now, the rotation in the visitor's time, and what drops in each, with favorites and alerts.

## The code path

1. **Build time.** `src/app/axion-operational-areas/page.tsx` calls `fetchAxionOperationalAreas()` (`src/lib/nexon/axion-operational-areas.ts`, server only). `placeOf` reads a drop place's name, after `sourceText` tidies its brackets, as "[Axion Plains] [Hard] - [mission] way" and keeps it when the mission is one of `axionMissions`. Each mission gets its drops (materials before cores, each way it comes), the Amorphous Material Pattern among its completion drops, and its Transcendent chance from `transcendentDrops`. A mission the cycle names without places warns at build and drops out.
2. **The rotation.** `src/features/axion/rotation.ts` (pure): `rotationAt(ms)` counts two-hour rotations from `axionRotation.startsAt`; `pairIn(rotation)` cycles `axionCycle`, negative rotations included; `rotationsBetween(from, to)` lists every rotation running in a span, the one already running at its start first; `rotationsOf(name, from, count)` finds a mission's next turns.
3. **In the browser.** `useAxionMoment` (`use-rotation.ts`) is a `useSyncExternalStore` over one string, the rotation and the start of the local day, so it changes with either; its timer fires at whichever comes first, the next change or local midnight, and again when the tab comes back. The server's snapshot is null, so the static HTML names no rotation. `localDays(now, 7)` (`mission-filters.ts`) builds the days from local midnights with `new Date(y, m, d + i)`, so a day with a clock change is 23 or 25 hours.
4. **The page.** `AxionOperationalAreas` (`axion-index.tsx`) reads `?day=` (a local date the schedule shows) and `?mission=`; the chosen mission is the one in the URL, else the first active. `NowBoxes` draws the top row; `ChangeBox` ticks with `useSecondClock` (from the 400% page); `DayTabs` and `Timeline` the schedule, the strip sliding between days (`useSlideIn`) and scrolling the active card into view; `MissionList` the seven missions with their buttons; `MissionRewards` the chosen one, its tiles from the 400% page (`RewardTile`, `rewardEntries`).
5. **Favorites and alerts.** `saved-missions.ts`: a store over `localStorage` (`savedStore("archelab:axion-missions")`; the Void Erosion Purge page keeps its map alerts in one of its own, ADR 0053), parsed defensively (`parseSavedMissions`), cached by its raw text so the snapshot is stable, kept in memory when storage throws, and refreshed by other tabs' `storage` events. A bell's first press calls `askForNotices`, after the press as browsers require. `useRotationAlerts` remembers the last rotation it saw and shows a `Notification` for each followed mission only when the rotation changes while the page is open, never for the one it opened on.
6. **Scroll to the details.** `useDetailsRequest(opened)` (`src/features/game-data/details-focus.ts`) starts at 1 when the URL names a mission and goes up on each pick; the panel's `useDetailsFocus(request)` scrolls it into view (smooth unless reduced motion) and focuses its heading (`tabIndex={-1}`) each time the count changes. The panel is keyed by mission, so a new mission mounts it with the count already up. `detailsScrollMargin` keeps the floating navbar off its top. The 400% page uses the same pair.

## Why it's shaped this way

- **Times as one store value.** Two stores would re-render twice at local midnight on a change; one string changes once.
- **Local days, not UTC days.** tfdhub lists "every rotation covering your local day"; the rotations don't line up with midnight in every zone, so a day lists the one running at its start.
- **The anchor in UTC.** The cycle is a count from one instant, so time zones and clock changes never move it.
- **Alerts only on a change seen here.** A notice on load would repeat on every visit during the same rotation.
- **No hero countdown.** The top row's middle box shows it; twice was noise.

## What would break it

- A new mission name in `axionCycle` that the drop places spell differently: it drops out with a warning, and its pair shows one mission.
- NEXON renaming the region "Axion Plains" in the drop places: no mission matches, and the page says it couldn't load.
- Reading the clock during render (`Date.now()` in a component): the server's HTML and the browser's first render would disagree.
- Passing `style` to the details panel or giving it another scroll box: `scrollIntoView` would scroll that box instead of the page.

## Checked by

- `src/features/axion/rotation.test.ts`, `mission-filters.test.ts`, `saved-missions.test.ts`, `src/lib/nexon/axion-operational-areas.test.ts`, `src/data/site-pages.test.ts`.
- `tests/e2e/axion-operational-areas.spec.ts` (UTC, a fixed clock; an alert through a stand-in `Notification` and an installed clock), and the scroll check in `infiltration-400.spec.ts`.
