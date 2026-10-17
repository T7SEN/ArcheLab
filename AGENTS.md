# AGENTS.md — ArcheLab

Read this at the start of every session. Operational reference: `SKILL.md`. Product spec: `docs/SPEC.md`, which is local only and gitignored. Sourced research reports live in `reports/` with their notes in `research_notes/`, both local only and gitignored. Before touching chat tags, read the verified in-game results in `docs/SPEC.md` section 4.1 and `reports/TFD in-game chat tests.md`, then `reports/TFD chat rich text tags.md` for sources. The in-game results supersede that report. The game's update notes from 1.4.0 on, with their data, are in `reports/TFD update notes 1.4.0 and later.md`; add each new one there. The Mutant Cells come from the notes of 1.2.18 to 1.3.12, in `reports/TFD Mutant Cells.md`.

## Project

ArcheLab is an unofficial tools hub for The First Descendant, a NEXON game. The first tool is the chat-message builder: players compose colored chat messages with the game's rich-text tags, preview them in game colors, and copy markup that fits the chat limit. More tools follow, built on NEXON's public game metadata. The site must cost nothing to run.

## Setup

- Node 26 (pinned in `.node-version`) and pnpm 12 (pinned in `package.json`).
- `pnpm install`, then `pnpm dev` (http://localhost:3000).
- No secrets exist today. Any future secret lives in `.env.local` locally and in Vercel environment variables, never in code.

## Layout

| Path | Purpose |
|---|---|
| `src/app` | Routes (App Router). Hub at `/`, tools under `/tools/<slug>` |
| `src/features/chat/engine` | Pure TypeScript: parse, serialize, count, optimize, share codec. No React, no DOM |
| `src/features/chat/ui` | Builder interface: editor, markup panel, preview, counter, templates, sharing |
| `src/features/command-palette` | The command palette: command sources, the Ctrl+K dialog, the navbar's search button |
| `src/features/descendants` | Descendant pages: skills, exclusive modules; the index grid and its filters |
| `src/features/weapons` | Weapon pages: the grouped base stats, rounds icons; the index grid and its filters |
| `src/features/modules` | The modules index: the grid, its filters, a module's details in the grid and its levels |
| `src/features/reactors` | The reactors index: the grid, its filters, a reactor's details in the grid and its levels |
| `src/features/external-components` | The external components index: the grid, its filters, a card's details in the grid (set bonuses, each piece's base stat by level) |
| `src/features/changelog` | The Changelog's timeline: React Bits' BranchedMenu over the updates, following the scroll |
| `src/features/vehicles` | The Vehicles page: big cards with key numbers, a vehicle's details under its row (every stat in its group, research) |
| `src/features/mutant-cells` | The Mutant Cells index: the grid in batches, its socket filter and search, a cell's effects in the grid |
| `src/features/fellows` | The Fellows page: big cards with key numbers, a Fellow's details under its row (passive, Inversion Reinforcement effects, levels, research) |
| `src/features/database` | The database page: every item in one list, its search, the search box and results |
| `src/features/game-data` | Shared by the Descendant, weapon, module, reactor, external component, Fellow and vehicle pages: the level slider, research recipe, rarity, page sections, page tabs, previous and next, index filters in the URL, details in an index's grid, the wide art tile, core types and their grade switch, an index's animated grid items, the showcase cards |
| `src/lib/nexon` | Server-only NEXON data layer: fetch, validate, cache metadata |
| `src/lib` | Also: page metadata and the public address (`site-metadata.ts`), link preview images (`og-image.tsx`) |
| `src/assets` | Files read at build time: the Rajdhani font for link previews, with its license |
| `scripts` | Maintenance scripts: `make-favicon.mjs` (`pnpm favicon`) |
| `src/data` | Versioned data: community report links and open checks, where Transcendent weapons come from, chat tag registry, the site's page list, the tool registry, Arche types NEXON's data leaves out, rounds and module icons, melee modules, module tiers, external component sub-stats and core slots, Fellow facts from the update notes, every Mutant Cell from the update notes, weapon core slots and types, how the game writes core options |
| `src/components` | Shared UI: hub shell, tool cards, the site's motion helpers and page entrance; `ui/` holds the shadcn/ui components, `react-bits/` the adapted React Bits effects |
| `src/styles` | Tailwind v4 theme and design tokens |
| `tests/e2e` | Playwright tests |
| `docs/adr` | Architecture decision records (local only, gitignored) |
| `docs/walkthroughs` | Annotated explanations of non-obvious code |

## Conventions

- TypeScript strict. No `any`; no non-null assertion without a comment explaining it.
- The chat engine is framework-free and fully unit-tested.
- Every module that touches NEXON data imports `server-only`.
- UI colors come only from design tokens: CSS variables in `globals.css`, or `palette` in `src/styles/tokens.ts` for canvas and WebGL. Chat tag colors come only from `src/data/chat-tags.json`.
- User-supplied text is rendered as React text nodes only. Never `dangerouslySetInnerHTML`.
- Every player-facing page is listed in `src/data/site-pages.ts`: `sitePages` for the navbar, `legalPages` for the footer's Legal column, and `dynamicRoutes` for routes such as `/descendants/[slug]` with where its pages come from. A unit test fails while a page under `src/app` is missing.
- Every page exports `metadata` from `pageMetadata` in `src/lib/site-metadata.ts`, for its canonical address and link preview. An e2e test fails without it.
- UI copy is sentence case, direct, and player-facing. Game terms (Descendant, Transcendent, Void Intercept) are spelled exactly as the game spells them.
- Every change that adds, fixes or removes something players can see goes in the Changelog, `src/data/changelog.ts`, in players' words and in the same change: under that day's entry, or a new entry for a new day (T7SEN, 2026-10-17). Version 1 shipped on 17 October 2026 as 1.0.0. The site's version is the same in `package.json` and the Changelog's newest version, always: change both together (T7SEN, 2026-10-17; `changelog.test.ts` fails otherwise).
- Site copy never names NEXON or its data as the source: no "from NEXON's data", "straight from NEXON's data", "as NEXON lists them", "built on NEXON's game data" or anything like it, in page text, link previews, alt text or labels. Only the footer's attribution and the legal pages name NEXON (T7SEN, 2026-10-16).

## Critical rules

1. Zero cost. No paid service, plan, or add-on. Anything that could bill, or approach a Vercel Hobby cap, stops for T7SEN's decision.
2. Static by default. Server code exists only where the spec requires it.
3. Every page shows the unofficial-site disclaimer and the NEXON Open API attribution.
4. Never invent game facts: tags, colors, limits, stats. Facts come from `src/data`, NEXON's metadata, the game's official update notes (`reports/TFD update notes 1.4.0 and later.md`; T7SEN, 2026-10-17; for Mutant Cells, the notes of 1.2.18 to 1.3.12, compared with tfdhub.gg, `reports/TFD Mutant Cells.md`; T7SEN, 2026-10-17), or in-game checks: T7SEN's own tests, or a player's report whose screenshot T7SEN has checked (ADR 0028). Unknowns are marked provisional.
5. No scope additions, refactors, or improvements beyond the task. Flag them; T7SEN decides when they happen.
6. Before using any API not documented in `SKILL.md`, verify it against the official docs for the pinned version.
7. `docs/SPEC.md` is local only. Read it by path. Never commit, move, or delete it, and never remove its `.gitignore` entry. If it is missing, stop and ask; never recreate it.
8. Work directly in the local `main` checkout: edit and test files, but never commit, push, branch or open a pull request. T7SEN commits and pushes (set by T7SEN on 2026-10-15). Every push to `main` deploys production.

## Testing

- `pnpm typecheck && pnpm lint && pnpm test` after every change, so `main` is always ready for T7SEN to commit.
- Engine changes need unit tests and property tests.
- User flows: locally, `pnpm build`, then only the e2e specs the change touches, in Chromium (`pnpm exec playwright test tests/e2e/<spec>.ts --project=chromium`). The full suite, in all three browsers, runs in GitHub Actions on every push to `main`, which deploys only if it passes (T7SEN, 2026-10-17, to save resources on their PC). Run the full suite locally only when T7SEN asks.

## Finish

Run the pre-finish checklist in `SKILL.md` section 12. Record decisions in an ADR and non-obvious code in a walkthrough.
