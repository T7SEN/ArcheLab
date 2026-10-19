# Timers

`/timers` (ADR 0054): Wall Crasher, ETA-0, the resets, Trials, Bounty Operations, the rotation pages, HQ Special Orders and the running events, counting down in the visitor's time.

## The code path

1. **Build time.** `src/app/timers/page.tsx` works out two plain maps for the client: each HQ Special Order reward's page, by its name without its count ("4x Precision Augmentation Core X" → "Precision Augmentation Core X"), from the database items and `fetchItemHrefs` (cores by grade); and each bounty attribute's icon (`elementIconUrls`).
2. **The clock.** `src/features/timers/schedule.ts` (pure): `gameDayStart` floors a moment to the last 07:00 UTC; `gameWeekday` is that start's UTC weekday, so Monday's game day runs Monday 07:00 to Tuesday 07:00 UTC. `nextDayWhere` steps over game day starts to find the next weekly reset, ETA-0's next change or a weekend event's. `wallCrasherAt` uses UTC hours. `eventState` gives each event's status and its next change; `eventGroupOf` its tab.
3. **In the browser.** `Timers` (`timers-index.tsx`) reads one ticking clock (`useSecondClock`, null on the server) and passes it down, so every card agrees to the second. The static HTML shows "--" for each countdown and no events or orders. `?bounty=` marks a target and, through `useDetailsRequest`/`useDetailsFocus`, scrolls the bounty section into view and focuses its heading.
4. **The rotation cards** call the other pages' own pure functions (`pairOn`, `pairIn`, `mapOn`, `rotationAt` and `weekStart` of the reward weeks), so the Timers page never disagrees with them.
5. **HQ Special Orders.** `hqCyclesFrom(now)` keeps the cycles not yet over; the switch picks one (the running one first, "Now"); `HqCycleView` is keyed by cycle so it fades in on a switch.
6. **Events.** `EventsSection` sorts the events not ended by tab order, then still-to-come last, then end; the tabs count each group and hide empty ones; a tab emptied by events ending falls back to All. Each `EventRow` is a button with `aria-expanded` whose details open under it.
7. **The alert.** `alert-settings.ts` keeps `{ on, minutes }` in `localStorage` (wrapped; in memory when blocked). `useWallCrasherAlert` sets one `setTimeout` for the next alert moment, shows a `Notification` when allowed, and sets the next.

## Why it's shaped this way

- **One clock for the page.** Separate timers per card would drift apart by a second and re-render the page several times a second.
- **UTC game days.** The game's day starts at 07:00 UTC everywhere; weekdays (bounty, ETA-0, Descendant's Weekend) belong to that day, not the visitor's calendar day.
- **Exclusive ends.** The notes end at a last minute ("22:59 PST"); stored as the next minute, every cycle and event ends exactly when the next begins.
- **The other pages' functions, not copies.** A rotation shown twice can't disagree with itself.

## What would break it

- An event kind no tab names: it shows under "Other" (`schedule.test.ts` fails, to add it to a tab).
- An HQ cycle added out of order or with a gap: `timers.test.ts` fails.
- Reading the clock during render (`Date.now()` in a component): the server's HTML and the browser's first render would disagree.
- A hidden tab: browsers slow its timers, so an alert can come up to about a minute late; the notice names the spawn time.

## Checked by

- `src/features/timers/schedule.test.ts`, `alert-settings.test.ts`, `src/data/timers.test.ts`, `src/lib/nexon/timer-places.test.ts`, `src/data/site-pages.test.ts`.
- `tests/e2e/timers.spec.ts` (UTC, a fixed clock; the alert through a stand-in `Notification` and an installed clock), and the Tab order in `shell.spec.ts`.
