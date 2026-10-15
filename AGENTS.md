# AGENTS.md — ArcheLab

Read this at the start of every session. Operational reference: `SKILL.md`. Product spec: `docs/SPEC.md`, which is local only and gitignored.

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
| `src/lib/nexon` | Server-only NEXON data layer: fetch, validate, cache metadata |
| `src/data` | Versioned data: chat tag registry, curated templates |
| `src/components` | Shared UI: hub shell, tool cards, primitives |
| `src/styles` | Tailwind v4 theme and design tokens |
| `tests/e2e` | Playwright tests |
| `docs/adr` | Architecture decision records |
| `docs/walkthroughs` | Annotated explanations of non-obvious code |

## Conventions

- TypeScript strict. No `any`; no non-null assertion without a comment explaining it.
- The chat engine is framework-free and fully unit-tested.
- Every module that touches NEXON data imports `server-only`.
- UI colors come only from design tokens. Chat tag colors come only from `src/data/chat-tags.json`.
- User-supplied text is rendered as React text nodes only. Never `dangerouslySetInnerHTML`.
- UI copy is sentence case, direct, and player-facing. Game terms (Descendant, Transcendent, Void Intercept) are spelled exactly as the game spells them.

## Critical rules

1. Zero cost. No paid service, plan, or add-on. Anything that could bill, or approach a Vercel Hobby cap, stops for T7SEN's decision.
2. Static by default. Server code exists only where the spec requires it.
3. Every page shows the unofficial-site disclaimer and the NEXON Open API attribution.
4. Never invent game facts: tags, colors, limits, stats. Facts come from `src/data`, NEXON's metadata, or T7SEN's in-game tests. Unknowns are marked provisional.
5. No scope additions, refactors, or improvements beyond the task. Flag them; T7SEN decides when they happen.
6. Before using any API not documented in `SKILL.md`, verify it against the official docs for the pinned version.
7. `docs/SPEC.md` is local only. Read it by path. Never commit, move, or delete it, and never remove its `.gitignore` entry. If it is missing, stop and ask; never recreate it.
8. Never push to `main`. Work on a branch and open a pull request; T7SEN merges.

## Testing

- `pnpm typecheck && pnpm lint && pnpm test` before every commit.
- Engine changes need unit tests and property tests.
- User flows: `pnpm test:e2e`.

## Finish

Run the pre-finish checklist in `SKILL.md` section 12. Record decisions in an ADR and non-obvious code in a walkthrough.
