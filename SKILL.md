---
name: archelab
description: Complete working reference for the ArcheLab repo, an unofficial The First Descendant tools hub built with Next.js 16 (App Router, static by default) on Vercel Hobby. Covers the chat-message builder (tag registry, parser, serializer, character counter, markup optimizer, share codec, editor, preview, templates), the server-only NEXON metadata layer, the hub shell, design tokens, zero-cost constraints and Hobby caps, testing (Vitest, property tests, Playwright), CI, deployment and docs. Use this skill for ANY task in this repository, even when the task looks small or purely cosmetic.
---

# ArcheLab

Product spec: `docs/SPEC.md` (local only, gitignored; read it by path). Lean rules: `AGENTS.md`. This file is the operational reference. Keep it accurate: a wrong path or URL here propagates into every future session.

## 1. Identity and priorities

- Owner: T7SEN. Repository: `https://github.com/T7SEN/ArcheLab.git` (public; from `git remote get-url origin`).
- Name: **ArcheLab**, one word, everywhere: repo, app, Vercel project (`archelab`, since Vercel project names are lowercase), metadata, and UI copy.
- Addresses (decided 2026-10-15, ADR 0005):
  - **Primary: `https://arche-lab.tech`.** Hyphenated only because `archelab.tech` was taken; the hyphen exists in the domain and nowhere else. Registered at Namify on 2026-10-14, free for the first year, **expires 2027-10-14**. DNS is on Cloudflare, with records pointing straight at Vercel and the proxy off (landmine 12).
  - **`archelab.vercel.app`:** released by T7SEN on 2026-10-15. Re-add it only if the domain lapses; another Vercel account may claim it before then.
  - **`archelab-t7sens-projects.vercel.app`:** a production alias that stays tied to this project, but it sits behind Vercel Authentication, so it is not a public fallback.
- Product: an unofficial tools hub for The First Descendant. First tool: the chat-message builder.
- Audience: TFD players, mostly on PC, where chat accepts pasted markup.
- Priority order: correctness of game facts, then zero cost, then visual quality, then everything else.
- English only. No internationalization layer.

## 2. Stack manifest

Exact versions are pinned in Phase 0 after checking official release notes, then written into the Pinned column. Runtime dependencies never use `latest` or caret ranges.

| Layer | Choice | Floor | Pinned |
|---|---|---|---|
| Runtime | Node | 26 | 26.12.0 (`.node-version`); Vercel functions run Node 24.x |
| Package manager | pnpm, single package | 12 | 12.11.2 (`packageManager`) |
| Framework | Next.js App Router | 16.3 | 16.4.1 (`eslint-config-next` 16.4.1) |
| UI | React | 19 | 19.3.1 (`react`, `react-dom`) |
| Language | TypeScript, `strict: true` | current stable that typescript-eslint supports | 6.0.3 (`@types/node` 24.19.2, `@types/react` and `@types/react-dom` 19.3.0) |
| Styling | Tailwind CSS, CSS-first `@theme` | 4 | 4.3.3 (`@tailwindcss/postcss` 4.3.3) |
| Validation | Zod | 4 | 4.6.7 (installed in Phase 1) |
| Editor | ProseMirror (ADR 0007) | 1 | `prosemirror-model` 1.25.12, `-state` 1.4.4, `-view` 1.42.6, `-keymap` 1.2.3, `-history` 1.5.1, `-commands` 1.7.2 (installed in Phase 2) |
| Server boundary | `server-only` | — | 0.0.1 (installed in Phase 2) |
| UI components | shadcn/ui on Base UI (ADR 0009) | — | `@base-ui/react` 1.9.0, `class-variance-authority` 0.7.1, `cn` 0.4.0, `lucide-react` 1.57.0, `tw-animate-css` 1.4.0; CLI and CSS `shadcn` 4.21.4 (dev dependency) |
| Unit tests | Vitest, fast-check for property tests | current stable | Vitest 5.0.4 (Vite 8.3.4), fast-check 4.10.2 |
| E2E tests | Playwright | current stable | 1.64.1 |
| Lint and format | ESLint flat config, Prettier | current stable | ESLint 10.12.0 (`@eslint/js` 10.0.1, typescript-eslint 8.71.2, `eslint-config-prettier` 10.1.8), Prettier 3.9.10 (`prettier-plugin-tailwindcss` 0.8.1) |
| Hosting | Vercel Hobby | — | Vercel CLI 64.1.0 (dev dependency) |
| Data | NEXON Open API static metadata (keyless) | — | — |

Sources, Node 26 checks, GitHub Action commit pins, and the refresh policy (deliberately at the start of each phase, no dependency bot): `docs/adr/0002-version-pins.md` (accepted 2026-10-15).

## 3. Repository structure

```
/
├── AGENTS.md                 lean rules, read every session
├── CLAUDE.md                 imports AGENTS.md
├── SKILL.md                  this file
├── .gitignore                must keep the docs/SPEC.md entry
├── .node-version             exact Node version for local and CI
├── .github/workflows/ci.yml  checks, then Vercel prebuilt deploys (ADR 0003)
├── pnpm-workspace.yaml       pnpm settings: allowBuilds, peer rules, release-age exceptions
├── vercel.json               turns off Vercel's own Git deploys
├── docs/
│   ├── SPEC.md               product spec and phase plan (local only, gitignored)
│   ├── adr/                  NNNN-kebab-title.md (local only, gitignored)
│   └── walkthroughs/         annotated explanations of non-obvious code
├── reports/                  sourced research reports (local only, gitignored)
├── research_notes/           notes behind each report (local only, gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx        shell, disclaimer, attribution
│   │   ├── page.tsx          hub home
│   │   └── tools/chat/       chat-message builder route (page.tsx, static)
│   ├── features/chat/
│   │   ├── engine/           registry, parse, serialize, render, count, optimize, share (pure TS, tests beside each)
│   │   └── ui/               builder: chat-builder, chat-editor (ProseMirror), editor schema, model and plugins, style picker, image picker, markup panel, preview
│   ├── lib/nexon/            server-only metadata client: descendants.ts (portrait URLs at build time)
│   ├── data/
│   │   ├── chat-tags.json    tag registry (versioned, patch-verified)
│   │   └── templates.json    curated templates
│   ├── components/           hub shell (site-header, site-footer with legal text), tool cards
│   │   └── ui/               shadcn/ui components (ADR 0009): owned source, added with the pinned CLI
│   └── styles/               globals.css (Tailwind theme, tokens), tokens.ts (inlined shell background)
└── tests/e2e/                Playwright
```

Folders appear with their code. No empty placeholders.

## 4. Architecture

- **Static by default.** Every route is statically rendered unless the spec names a reason. Server code exists for the NEXON data layer and nothing else today.
- **Pure engine.** `src/features/chat/engine` has no React, DOM, or Next imports. The UI is a thin layer over it.
- **Data, not code, for game facts.** Tags, colors, the chat limit and syntax rules live in `src/data/chat-tags.json`. Updating them after a patch never requires a code change.
- **No user content on the server.** Shared messages travel inside the URL. Personal templates live in the visitor's browser. Nothing user-generated is stored or moderated by ArcheLab.
- **NEXON metadata.** Fetched on the server from keyless static JSON, validated with Zod, and rendered statically. The data is never kept more than 30 days (Nexon API Terms §8.7), so pages built from it are rebuilt at least every 30 days (section 5.5). Images load directly from NEXON's static image host.
- **Player lookups are deferred.** They need an API key, and T7SEN cannot register one (NEXON's portal is unavailable in his region). The data layer leaves a typed slot for an authenticated client; nothing calls it.

## 5. Subsystems

### 5.1 Tag registry — `src/data/chat-tags.json`
Every fact in the registry comes from T7SEN's in-game tests (`reports/TFD in-game chat tests.md`, local only), so every entry has `source: "in-game-test"`. A Zod schema in the engine (`registry.ts`, `chatRegistrySchema`) enforces this shape:
- **Top level:** `version` (integer), `status` (`provisional` | `verified`), `verifiedPatch` (string or null), `verifiedOn` (ISO date or null).
- **`rules`:**
  - `charLimit`: 100.
  - `tagsCountTowardLimit`: true.
  - `closeTag`: `</>`.
  - `implicitSwitch`: false.
  - `spaceAfterTag`: `none`.
  - `caseSensitive`: false.
  - `unknownTagBehavior`: `literal`.
  - `countingUnit`: `utf16`.

  `createRegistry` rejects a registry whose rules differ from the ones the engine implements, so a game patch that changes the rules forces an engine change.
- **`tags[]`:** `name`, `label`, `kind` (`color` | `style`), `hex` (or null), `weight` (`regular` | `bold`), `slant` (`normal` | `italic`), `source`, `notes`. It holds 50 colors and the `<b>` and `<i>` styles. Names ignore case. `img` and `a` are reserved.
- **`sizes[]`:** the text sizes written `<a id="ID">text</>`: `id`, `label`, `capHeightPx`, `hex`, `source`, `notes`.
- **`images[]`:** verified image ids only: `id`, `label`, `art`, `artVerified`, `source`, `notes`. `art` is either `{ kind: "descendant", descendant }`, the NEXON API portrait of that Descendant, or `{ kind: "placeholder" }`. Portrait icons such as `IconHailey1` show the base Descendant's portrait, never the Ultimate one (T7SEN, 2026-10-15), so `descendant` names the base Descendant. The registry never stores image URLs: they are NEXON Game Data under the 30-day limit (section 5.5).
- **`channels[]`:** untagged text color per channel: `name`, `label`, `hex`.
- **`chatBackground`:** the sampled chat panel color (`#212321`). The preview draws on it, and contrast hints are measured against it.
- **`untaggedText`:** `capHeightPx` (13), the cap height the sizes were measured against. The preview scales each size by `capHeightPx / 13`.
- **`characters`:** `verifiedSymbols`, `refused`, `refuseOutsideBmp`.

The UI shows a provisional badge whenever `status` is not `verified`. Tag colors come only from this file.

### 5.2 Engine — `src/features/chat/engine`
Pure TypeScript with no React, DOM or Next imports. The only dependency is Zod. The parser reproduces Unreal Engine's standard rich-text parser, which every in-game test matched. Walkthrough: `docs/walkthroughs/chat-engine.md`.
- **Model:**
  - `Piece = { kind: "text", text, style: Style | null } | { kind: "image", id }`.
  - `Style = { type: "tag", name } | { type: "size", id }`.
  - `null` means untagged text, shown in the channel's color.
- `createRegistry(json) → ChatRegistry`: validates the JSON and builds case-insensitive lookups.
- `parse(markup, registry) → Piece[]`: never throws. Malformed or unknown markup is shown as typed. Escapes are decoded.
- `serialize(pieces) → markup`: the canonical form. Every run is closed, and every `<` is escaped.
- `render(pieces, registry) → Glyph[]` and `rendersIdentically(a, b, registry)`.
- `count(markup, registry) → { used, limit, remaining, overflowAt, issues }`: counts UTF-16 units, markup included. `truncateToLimit` returns what the input box keeps. `classifyCharacter` returns `ok`, `unverified` or `refused`.
- `optimize(pieces, registry) → markup`: uses the shortest same-looking tag, merges same-style neighbors (also across whitespace of the same shape), and escapes minimally. Each candidate is verified by parsing it back, falling back to `serialize`.
- `encodeShare(markup) / decodeShare(code)`: format version `1` plus WTF-8 in unpadded base64url. `decodeShare` returns null for anything invalid and never throws.
- **Invariants,** each a property test (`invariants.test.ts`, 1,000 runs each):
  1. `parse(serialize(pieces))` renders identically to `pieces`.
  2. `optimize` output renders identically to its input.
  3. `optimize` never produces longer markup than `serialize`.
  4. `optimize` is idempotent.
  5. `decodeShare(encodeShare(m)) === m`, and `decodeShare` never throws on arbitrary input.
- **"Renders identically"** means the same sequence of glyphs. For a visible character, a glyph is the character, its color and its shape (weight, slant, size). For whitespace, only the shape counts, because a red space and a blue space look the same. An image glyph is its id, in any case. Chat is a single line, so line breaks are outside the invariants.

### 5.3 Builder UI — `src/features/chat/ui`
Route `/tools/chat`. Walkthrough: `docs/walkthroughs/chat-builder.md`.
- **Editor:** ProseMirror (ADR 0007), one line, one `style` mark (a run holds one style), inline atom images that never carry a style. `normalizePlugin` removes refused characters and line breaks after every change. Copying from the editor gives markup; pasting text reads it as markup.
- **Source of truth:** engine pieces. The editor and the markup panel write them; the counter, preview, hints and copy read them.
- **Picker:** `styleGroups` shows each look once under its shortest tag, grouped by appearance, never by where a tag name came from (T7SEN, 2026-10-15): Colors (27, in hue order, reds first), Rarity (tier1 to tier4, kept together because they mean item rarity in game), Whites and grays (13, chroma below 0.15, light to dark), Bold and italic, Text sizes. Each shows its cost and a low-contrast mark below WCAG AA on the chat background.
- **Copy:** the shorter of the optimizer's output and the text as written (both render the same). "Copy as written" appears when they differ.
- **Preview:** directly under the editor in the same panel, so the text and its in-game look sit together. It shows the copy text after the input box's cut, parsed, on the chat background, per channel. Icon height (2em) and the font are approximations.
- **Layout:** two columns from the `lg` breakpoint: the message panel (editor and preview) and the markup panel on the left, the style panel (styles and icons) on the right. On narrow screens the style panel follows the message panel.

### 5.4 Sharing and templates
- Share links: `/tools/chat?m=<code>`, with codes from `encodeShare` (section 5.2). Decoded content is untrusted text.
- Curated templates: `src/data/templates.json`, written or approved by T7SEN.
- Personal templates: `localStorage`, every access wrapped in try/catch; the builder works when storage is unavailable.

### 5.5 NEXON data layer — `src/lib/nexon`
- Base: `https://open.api.nexon.com/static/tfd/meta/en/<set>.json`. Verified keyless for `descendant.json` on 2026-10-14 and again on 2026-10-15; the sets that responded on 2026-10-15 are listed in `docs/SPEC.md` section 6. Other sets are confirmed in Phase 4 before use.
- Images: `https://open.api.nexon.com/static/tfd/img/<hash>`, loaded directly. Never through Vercel Image Optimization.
- **30-day limit:** Nexon Game Data is kept at most 30 days (Nexon API Terms §8.7, [terms](https://openapi.nexon.com/support/terms/)). Static pages built from it are rebuilt at least every 30 days, for example by a scheduled deploy, and image URLs are never stored in committed files.
- **No data-mining:** no data-mining outside the API (§8.15), so no art is extracted from game files. Chat icons use API portraits or labeled placeholders (`src/data/chat-tags.json`, `images[].art`).
- Zod schemas validate every response. A schema failure degrades the page; it never crashes the build silently.
- **Built so far (Phase 2, ADR 0008):** `descendants.ts` maps base Descendant names to portrait URLs while `/tools/chat` is prerendered. Invalid entries are skipped one by one; a failed fetch logs a warning and leaves every icon on its placeholder. A weekly scheduled CI run (Mondays 04:17 UTC) redeploys production so the data stays far inside the 30-day limit.
- Attribution on every page: "Data based on NEXON Open API."

### 5.6 Hub shell — `src/components`, `src/app`
Header, tool registry, tool cards, footer with the disclaimer and attribution. Adding a tool means one registry entry and one route.

## 6. Design system

- Clean, modern, dark. ArcheLab's own identity, with in-game cues as accents: rarity tier colors, Arche energy effects, and Descendant and item art from the API.
- **Components:** shadcn/ui on Base UI (ADR 0009), in `src/components/ui`. `components.json` holds the CLI settings (style `base-nova`, icons `lucide`). Add components with `pnpm dlx shadcn@4.21.4 add <name>`, then format, lint and review the diff.
- **Rarity accents.** The tier colors used in the UI are the same hex values the in-game test establishes for `<tier1>` to `<tier4>`. One source of truth: `src/data/chat-tags.json` feeds both the preview and the accent tokens. Tier colors used for text must pass WCAG AA on their background; otherwise they are used for fills, borders and glows only. The sampled values are in the registry: tier1 `#53B7F7`, tier2 `#D487F5`, tier3 `#F7DB78`, tier4 `#FF886D`.
- **Palette and type.** Chosen 2026-10-15 (ADR 0004): direction A (Signal) with direction B's (Rift) palette, on shadcn's token names since ADR 0009 (dark only: `dark` class on `<html>`, values in `:root`).
  - Tokens in `src/styles/globals.css`, as Tailwind utilities: `background` `#0a0812`, `card` `#141024`, `popover`/`secondary`/`muted` `#1c1630`, `accent` `#241c3d` (shadcn's hover surface, not a brand color), `border`/`input` `#2b2244`, `foreground` `#ece7f7`, `muted-foreground` `#a69dc3`, `primary`/`ring` `#a184ff`, `destructive`/`warning` `#ff886d` (overflow, refused characters, hard-to-read colors). `radius` 0.625rem. Tailwind's default palette is removed. `--background` must equal `shellBackground` in `src/styles/tokens.ts`.
  - Type: Rajdhani for display (`font-display`) and shadcn titles (`font-heading`), Inter for body (`font-sans`), loaded in the root layout with `next/font/google`.
  - Shapes: shadcn's rounded cards, inputs, toggles and tooltips (T7SEN, 2026-10-15). The clipped HUD frames of Phase 0 are gone.
  - Arche effect: a faint scan band in `accent` sweeps down featured art about every 5 seconds.
  - The violet accent sits close to the Rare (tier2) purple, so rarity is never shown by color alone.
- **Fonts.** Free licenses that allow self-hosting. No NEXON or game fonts.
- **Motion.** Arche energy effects are CSS or SVG, subtle, and disabled under `prefers-reduced-motion`. A global rule in `globals.css` also shortens shadcn's component animations under `prefers-reduced-motion: reduce`.
- **No NEXON branding.** No game logo, no NEXON logo, no art used as ArcheLab's own branding.

## 7. Conventions

- **Code.** TypeScript strict, kebab-case files, named exports, no magic numbers.
- **Commits.** Conventional Commits, one concern per commit, on a branch; pull requests to `main`.
- **ADRs.** `docs/adr/NNNN-kebab-title.md` with Context, Decision, Consequences, Alternatives. Local only and gitignored; never committed.
- **Walkthroughs.** `docs/walkthroughs/<subsystem>.md`: the code path, why it is shaped that way, what would break it.
- **Copy.** Player-facing, short, sentence case. Game terms spelled as the game spells them.
- **Legal text.** Footer on every page: "ArcheLab is an unofficial fan site. It is not affiliated with or endorsed by NEXON. The First Descendant is a trademark of NEXON. Data based on NEXON Open API."

## 8. Environment variables

None today. When player lookups ship, `NEXON_API_KEY` is server-only, set in Vercel, and never prefixed `NEXT_PUBLIC_`.

## 9. Commands

| Command | Does |
|---|---|
| `pnpm install` | Installs dependencies. CI uses `pnpm install --frozen-lockfile`. A new build script fails the install until it is listed in `allowBuilds` (landmine 11). |
| `pnpm dev` | Dev server at http://localhost:3000 |
| `pnpm build` | Production build. The route summary must show only static (○) routes unless the spec names a reason. |
| `pnpm start` | Serves the production build at http://localhost:3000 |
| `pnpm typecheck` | `next typegen` (writes `next-env.d.ts` and route types), then `tsc --noEmit` |
| `pnpm lint` | ESLint with typed rules (typescript-eslint strict and stylistic), then `prettier --check` |
| `pnpm test` | Vitest unit and property tests (`src/**/*.test.ts`) |
| `pnpm test:e2e` | Playwright (Chromium) against `pnpm start`; run `pnpm build` first. On a new machine, run `pnpm exec playwright install chromium` once. |
| `pnpm format` | Prettier, with Tailwind class sorting. Markdown and pnpm's own files are skipped. |

## 10. Landmines

1. **Hobby caps pause the project.** Vercel Hobby has hard caps (including 1M function invocations, 4 hours of active CPU, 100 GB transfer) and pauses projects that exceed them. Static rendering keeps usage near zero; any change that adds per-request server work needs justification.
2. **Image optimization cap.** Hobby includes a small image-optimization allowance. NEXON images bypass it (`unoptimized` or plain `<img>`).
3. **Commercial use is banned on Hobby.** No ads, sponsorships, paid features, or affiliate links without T7SEN's decision to move hosts.
4. **Toolchain on Vercel.** Verified 2026-10-15 against Vercel's docs: builds and functions offer Node 24.x (default) and 22.x only, pnpm 6–10 is supported, and Corepack is experimental. Vercel's build-utils reject an `engines.node` range that matches only Node 26 (`BUILD_UTILS_NODE_VERSION_INVALID`), in Vercel builds and in a local `vercel build`, so `package.json` carries no `engines.node`; Node is pinned in `.node-version`. Without `engines`, the function runtime comes from Project Settings (24.x). Runtime code must run on Node 24. Deploy path (accepted 2026-10-15): build in GitHub Actions on Node 26 and pnpm 12, deploy the prebuilt output with the Vercel CLI; see `docs/adr/0003-deploy-path.md`.
5. **Game facts drift.** A patch can change or remove tags. The registry carries `verifiedPatch`; after each game patch, T7SEN re-runs the in-game test. Chat markup is undocumented by NEXON: tag names and image ids (`<img id="..."/>`) look like the game's internal UI style and icon rows, found by players. In-game results: `docs/SPEC.md` section 4.1 and `reports/TFD in-game chat tests.md`. Sourced research, which predates those results: `reports/TFD chat rich text tags.md`. All three are local only.
6. **XSS through shared links.** Decoded share codes and template text are untrusted. Render as text nodes only.
7. **NEXON schema drift.** Metadata shapes change with game updates. Zod validation plus graceful degradation; never trust field presence.
8. **Region restriction.** NEXON's developer portal rejects registration from Egypt. Do not suggest workarounds that misrepresent residence.
9. **`localStorage` can throw.** Private windows and blocked storage. Wrap every access.
10. **Two-way editor sync.** Converting between the visual editor and raw markup must round-trip through the engine, never through ad hoc string edits.
11. **pnpm 12 defaults.** `minimumReleaseAge` is 1440 minutes, so pnpm prefers versions at least a day old. `strictDepBuilds` is on, so an install fails when a dependency's build script is not listed in `allowBuilds` in `pnpm-workspace.yaml`. Unrecognized keys in `pnpm-workspace.yaml` fail commands. Approve each build script deliberately, with a reason.
12. **Custom domain.**
    - **Renewal:** `arche-lab.tech` costs money from its second year. The renewal (due before 2027-10-14) is T7SEN's decision under the zero-cost rule. If it will lapse, add a free `.vercel.app` address before the expiry date: `archelab.vercel.app` if it is still unclaimed, otherwise another name.
    - **Cloudflare proxy stays off.** Keep the domain's records DNS-only (grey cloud) in Cloudflare: proxying Vercel through Cloudflare breaks certificate renewal and adds a second cache.
    - **The only public address is `arche-lab.tech`.** Removing it, letting it expire, or breaking its DNS takes the site offline.
    - **`vercel link` edits `.gitignore`.** Each run appends `.vercel` and `.env*`. Revert that: `.env*` would hide `.env.example`.
13. **Scheduled rebuilds stop on a quiet repository.** GitHub disables scheduled workflows in a public repository after 60 days without activity. Without the weekly run, the live page's NEXON data ages past the 30-day limit (ADR 0008). Re-enable the schedule in the Actions tab if that happens.
14. **ProseMirror styles images if asked.** `addMark` over a range marks inline atoms too. Style text nodes only (`applyStyle`), and keep `normalizePlugin`, which strips styles from images that arrive by paste.
15. **NEXON's image host can fail.** A portrait URL can return 503 while others work (seen 2026-10-15). Every icon must fall back to its labeled placeholder.

## 11. Known tech debt

- **Intentional decision (ADR 0008):** the preview's icon height (2em) and font are approximations. T8 records only that icons are much taller than text. A screenshot measurement after the October 2026 patch can replace the icon height.

Label every entry **Intentional decision** (with its ADR) or **Genuine bug**. Improvements wait until T7SEN schedules them.

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
