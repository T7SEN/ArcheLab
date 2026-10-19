# The daily check

`.github/workflows/daily-check.yml` (ADR 0055): every day at 07:23 UTC, live checks of the site's data, issues for what needs a person, and a rebuild when NEXON's data changed.

## The code path

1. **The workflow** installs the project, restores `.daily-check/state` (the last run's NEXON set versions) from the Actions cache, and runs `pnpm check:daily` with `continue-on-error`, so a failed check becomes an issue rather than a failed run.
2. **`pnpm check:daily`** runs Vitest with `vitest.checks.config.mts`: only `src/checks/*.check.ts`, a 3-minute timeout per check, and a JSON report at `.daily-check/report.json`.
   - `site-data.check.ts` sends a HEAD request to each of `metadataSets` and writes their versions (ETag, Last-Modified, size) to `.daily-check/nexon-sets.json`; loads every page's data through `fetchDatabaseItems` with `console.warn` spied on, failing with the warnings the build would log; and checks the hand-kept schedules' horizons.
   - `rotations.check.ts` fetches tfdhub's three rotation pages, trying each up to three times 5 seconds apart (a slow connection timed out once on 2026-10-19), and compares them, through the parsers in `tfdhub.ts`, with the site's own pure functions (`pairOn`, `pairIn`, `mapOn`) for the same moment. tfdhub's 400% page names its day, so that one is compared on its own date; the other two accept the rotation before ours, in case tfdhub served a cached page.
3. **`scripts/daily-check/run.mjs`** reads the report (`checkResults` in `lib.mjs`), lists the open `daily-check` issues and matches them by a hidden marker (`<!-- daily-check:check:<key> -->`): a failed check without one gets an issue, a passing check with one gets a comment and is closed. It reads Steam's news (`newsWorth` keeps NEXON's posts about updates, hotfixes, patches, events, maintenance and dev notes from the last week) and opens a `game-news` issue for each post no issue carries the marker of, open or closed. It compares the set versions (`changedSets`) and writes `rebuild=true` to `GITHUB_OUTPUT` when one changed.
4. **The workflow** saves `.daily-check/state` under a new cache key, and with `rebuild=true` starts CI on `main` (`gh workflow run ci.yml`, which `workflow_dispatch` allows), so the rebuild passes every check and the e2e suite before it deploys.

## Why it's shaped this way

- **Vitest for the live checks:** they import the site's own TypeScript (the fetchers, the rotation functions, the set list) through the same aliases as the unit tests, so a check can't drift from the code it checks.
- **Markers, not titles:** an issue retitled by hand is still found; Steam's post ids never repeat.
- **HEAD for the versions:** a few hundred bytes a set instead of downloading ten megabytes.
- **No change on a first run or a failed answer:** a blank version would otherwise look like a change and rebuild the site with missing data.
- **Links, not text:** the issue points to NEXON's post instead of republishing it.

## What would break it

- tfdhub changing its markup: the check fails with "has changed its layout"; update the patterns in `src/checks/tfdhub.ts` and its test's samples.
- Steam renaming its feed (`steam_community_announcements`): no news issues; `newsWorth` would need the new name.
- The Actions cache evicted (after 7 days unused): the next run only notes the versions again.
- A token without `issues: write` or `actions: write`: the runner or the rebuild step fails, and GitHub reports the failed run.

## Checked by

- `src/checks/tfdhub.test.ts` and `scripts/daily-check/lib.test.mjs` (in `pnpm test`).
- The workflow's own runs; `node scripts/daily-check/run.mjs --dry-run` prints what it would do.
