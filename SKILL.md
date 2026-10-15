---
name: archelab
description: Complete working reference for the ArcheLab repo, an unofficial The First Descendant tools hub built with Next.js 16 (App Router, static by default) on Vercel Hobby. Covers the chat-message builder (tag registry, parser, serializer, character counter, markup optimizer, share codec, editor, preview, templates), the server-only NEXON metadata layer, the hub shell, design tokens, zero-cost constraints and Hobby caps, testing (Vitest, property tests, Playwright), CI, deployment and docs. Use this skill for ANY task in this repository, even when the task looks small or purely cosmetic.
---

# ArcheLab

Product spec: `docs/SPEC.md` (local only, gitignored; read it by path). Lean rules: `AGENTS.md`. This file is the operational reference. Keep it accurate: a wrong path or URL here propagates into every future session.

## 1. Identity and priorities

- Owner: T7SEN. Repository: _filled in Phase 0 from `git remote get-url origin`_.
- Name: **ArcheLab**, one word, everywhere: repo, app, Vercel project (`archelab`, since Vercel project names are lowercase), metadata, and UI copy.
- Addresses: `archelab.vercel.app` (free, primary until launch). Custom domain `arche-lab.tech`, hyphenated only because `archelab.tech` was taken. The hyphen exists in the domain and nowhere else.
- Product: an unofficial tools hub for The First Descendant. First tool: the chat-message builder.
- Audience: TFD players, mostly on PC, where chat accepts pasted markup.
- Priority order: correctness of game facts, then zero cost, then visual quality, then everything else.
- English only. No internationalization layer.

## 2. Stack manifest

Exact versions are pinned in Phase 0 after checking official release notes, then written into the Pinned column. Runtime dependencies never use `latest` or caret ranges.

| Layer | Choice | Floor | Pinned |
|---|---|---|---|
| Runtime | Node | 26 | — |
| Package manager | pnpm, single package | 12 | — |
| Framework | Next.js App Router | 16.3 | — |
| UI | React | 19 | — |
| Language | TypeScript, `strict: true` | current stable that typescript-eslint supports | — |
| Styling | Tailwind CSS, CSS-first `@theme` | 4 | — |
| Validation | Zod | 4 | — |
| Unit tests | Vitest, fast-check for property tests | current stable | — |
| E2E tests | Playwright | current stable | — |
| Lint and format | ESLint flat config, Prettier | current stable | — |
| Hosting | Vercel Hobby | — | — |
| Data | NEXON Open API static metadata (keyless) | — | — |

## 3. Repository structure

```
/
├── AGENTS.md                 lean rules, read every session
├── CLAUDE.md                 imports AGENTS.md
├── SKILL.md                  this file
├── .gitignore                must keep the docs/SPEC.md entry
├── .node-version
├── docs/
│   ├── SPEC.md               product spec and phase plan (local only, gitignored)
│   ├── adr/                  NNNN-kebab-title.md
│   └── walkthroughs/         annotated explanations of non-obvious code
├── src/
│   ├── app/
│   │   ├── layout.tsx        shell, disclaimer, attribution
│   │   ├── page.tsx          hub home
│   │   └── tools/chat/       chat-message builder route
│   ├── features/chat/
│   │   ├── engine/           parse, serialize, count, optimize, share codec (pure TS)
│   │   └── ui/               editor, markup panel, preview, counter, templates
│   ├── lib/nexon/            server-only metadata client, schemas, cache
│   ├── data/
│   │   ├── chat-tags.json    tag registry (versioned, patch-verified)
│   │   └── templates.json    curated templates
│   ├── components/           hub shell, tool cards, primitives
│   └── styles/               Tailwind theme, tokens
└── tests/e2e/                Playwright
```

Folders appear with their code. No empty placeholders.

## 4. Architecture

- **Static by default.** Every route is statically rendered unless the spec names a reason. Server code exists for the NEXON data layer and nothing else today.
- **Pure engine.** `src/features/chat/engine` has no React, DOM, or Next imports. The UI is a thin layer over it.
- **Data, not code, for game facts.** Tags, colors, the chat limit and syntax rules live in `src/data/chat-tags.json`. Updating them after a patch never requires a code change.
- **No user content on the server.** Shared messages travel inside the URL. Personal templates live in the visitor's browser. Nothing user-generated is stored or moderated by ArcheLab.
- **NEXON metadata.** Fetched on the server from keyless static JSON, validated with Zod, cached for long periods, and rendered statically. Images load directly from NEXON's static image host.
- **Player lookups are deferred.** They need an API key, and T7SEN cannot register one (NEXON's portal is unavailable in his region). The data layer leaves a typed slot for an authenticated client; nothing calls it.

## 5. Subsystems

### 5.1 Tag registry — `src/data/chat-tags.json`
Schema (enforced by a Zod schema in the engine):
- `version` (integer), `status` (`provisional` | `verified`), `verifiedPatch` (string or null), `verifiedOn` (ISO date or null).
- `rules`: `charLimit`, `tagsCountTowardLimit`, `closeTag` (string or null), `implicitSwitch`, `spaceAfterTag` (`none` | `optional` | `required` | `consumed`), `caseSensitive`, `unknownTagBehavior` (`literal` | `stripped` | `breaks`), `countingUnit` (`utf16` | `codepoint` | `grapheme`). Every field may be `null` while unverified.
- `tags[]`: `name`, `label`, `hex` (or null), `source` (`community` | `in-game-test`), `notes`.
The UI shows a provisional badge whenever `status` is not `verified`.

### 5.2 Engine — `src/features/chat/engine`
- `parse(markup, registry) → Run[]` where `Run = { text, tag | null }`.
- `serialize(runs, registry) → markup`, canonical form.
- `count(markup, registry) → { used, limit, overflowAt }` using `rules.countingUnit`.
- `optimize(runs, registry) → markup`: the shortest markup that renders identically.
- `encodeShare(markup) / decodeShare(code)`: versioned, URL-safe codec.
- Invariants, each a property test:
  1. `parse(serialize(runs))` renders identically to `runs`.
  2. `optimize` output renders identically to its input.
  3. `optimize` never produces longer markup than `serialize`.
  4. `optimize` is idempotent.
  5. `decodeShare(encodeShare(m)) === m`, and `decodeShare` never throws on arbitrary input.
- "Renders identically" means the same sequence of (character, resolved color) pairs.

### 5.3 Builder UI — `src/features/chat/ui`
Select text and apply a color; an editable raw-markup panel stays in two-way sync. Live preview in game colors on a chat-like background, a counter against the limit with the overflow point highlighted, copy buttons for optimized and as-written markup. The editor library is decided at the Phase 2 plan (Lexical, Tiptap, or custom) and recorded in an ADR.

### 5.4 Sharing and templates
- Share links: `/tools/chat?m=<code>`. Decoded content is untrusted text.
- Curated templates: `src/data/templates.json`, written or approved by T7SEN.
- Personal templates: `localStorage`, every access wrapped in try/catch; the builder works when storage is unavailable.

### 5.5 NEXON data layer — `src/lib/nexon`
- Base: `https://open.api.nexon.com/static/tfd/meta/en/<set>.json`. Verified keyless for `descendant.json` on 2026-10-14. Other sets are confirmed in Phase 4 before use.
- Images: `https://open.api.nexon.com/static/tfd/img/<hash>`, loaded directly. Never through Vercel Image Optimization.
- Zod schemas validate every response. A schema failure degrades the page; it never crashes the build silently.
- Attribution on every page: "Data based on NEXON Open API."

### 5.6 Hub shell — `src/components`, `src/app`
Header, tool registry, tool cards, footer with the disclaimer and attribution. Adding a tool means one registry entry and one route.

## 6. Design system

- Clean, modern, dark. ArcheLab's own identity, with in-game cues as accents: rarity tier colors, HUD and menu shapes, Arche energy effects, and Descendant and item art from the API.
- **Rarity accents.** The tier colors used in the UI are the same hex values the in-game test establishes for `<tier1>` to `<tier4>`. One source of truth: `src/data/chat-tags.json` feeds both the preview and the accent tokens. Tier colors used for text must pass WCAG AA on their background; otherwise they are used for fills, borders and glows only.
- **Palette and type.** Proposed in Phase 0 (three directions), chosen by T7SEN, recorded in ADR and section 6 of this file.
- **Fonts.** Free licenses that allow self-hosting. No NEXON or game fonts.
- **Motion.** Arche energy effects are CSS or SVG, subtle, and disabled under `prefers-reduced-motion`.
- **No NEXON branding.** No game logo, no NEXON logo, no art used as ArcheLab's own branding.

## 7. Conventions

- **Code.** TypeScript strict, kebab-case files, named exports, no magic numbers.
- **Commits.** Conventional Commits, one concern per commit, on a branch; pull requests to `main`.
- **ADRs.** `docs/adr/NNNN-kebab-title.md` with Context, Decision, Consequences, Alternatives.
- **Walkthroughs.** `docs/walkthroughs/<subsystem>.md`: the code path, why it is shaped that way, what would break it.
- **Copy.** Player-facing, short, sentence case. Game terms spelled as the game spells them.
- **Legal text.** Footer on every page: "ArcheLab is an unofficial fan site. It is not affiliated with or endorsed by NEXON. The First Descendant is a trademark of NEXON. Data based on NEXON Open API."

## 8. Environment variables

None today. When player lookups ship, `NEXON_API_KEY` is server-only, set in Vercel, and never prefixed `NEXT_PUBLIC_`.

## 9. Commands (filled in Phase 0)

| Command | Does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | Static checks and unit tests |
| `pnpm test:e2e` | Playwright |
| `pnpm format` | Prettier |

## 10. Landmines

1. **Hobby caps pause the project.** Vercel Hobby has hard caps (including 1M function invocations, 4 hours of active CPU, 100 GB transfer) and pauses projects that exceed them. Static rendering keeps usage near zero; any change that adds per-request server work needs justification.
2. **Image optimization cap.** Hobby includes a small image-optimization allowance. NEXON images bypass it (`unoptimized` or plain `<img>`).
3. **Commercial use is banned on Hobby.** No ads, sponsorships, paid features, or affiliate links without T7SEN's decision to move hosts.
4. **Toolchain on Vercel.** Vercel's build image listed Node 24 as its newest version and pnpm 6–10 as supported package managers as of mid-2026. Node 26 and pnpm 12 builds need a verified path (custom install command, or build in GitHub Actions and deploy prebuilt). Runtime code must also run on whatever Node version Vercel's functions use.
5. **Game facts drift.** A patch can change or remove tags. The registry carries `verifiedPatch`; after each game patch, T7SEN re-runs the in-game test.
6. **XSS through shared links.** Decoded share codes and template text are untrusted. Render as text nodes only.
7. **NEXON schema drift.** Metadata shapes change with game updates. Zod validation plus graceful degradation; never trust field presence.
8. **Region restriction.** NEXON's developer portal rejects registration from Egypt. Do not suggest workarounds that misrepresent residence.
9. **`localStorage` can throw.** Private windows and blocked storage. Wrap every access.
10. **Two-way editor sync.** Converting between the visual editor and raw markup must round-trip through the engine, never through ad hoc string edits.

## 11. Known tech debt

None yet. Label every entry **Intentional decision** (with its ADR) or **Genuine bug**. Improvements wait until T7SEN schedules them.

## 12. Pre-finish checklist

- [ ] `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass.
- [ ] `pnpm build` succeeds and the route summary shows no unexpected dynamic routes.
- [ ] Engine change: property tests pass for all five invariants.
- [ ] UI change: `pnpm test:e2e` passes; keyboard and reduced-motion paths work.
- [ ] No game fact was invented; provisional data is labeled.
- [ ] No `dangerouslySetInnerHTML` on user or shared content.
- [ ] No new per-request server work, paid service, or Hobby-cap risk.
- [ ] Disclaimer and attribution present on every page.
- [ ] No unpinned dependency added.
- [ ] ADR for each decision; walkthrough for non-obvious code.
- [ ] This file updated if structure, commands, conventions, or landmines changed, with every path verified.
