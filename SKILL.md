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
| UI components | shadcn/ui on Base UI (ADR 0009) | — | `@base-ui/react` 1.9.0, `class-variance-authority` 0.7.1, `cn` 0.4.0, `lucide-react` 1.57.0, `tw-animate-css` 1.4.0; CLI and CSS `shadcn` 4.21.5 (dev dependency) |
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
├── pnpm-workspace.yaml       pnpm settings: allowBuilds, peer rules
├── vercel.json               turns off Vercel's own Git deploys
├── components.json           shadcn/ui CLI settings and registries (ADR 0009)
├── .mcp.json                 shadcn MCP server for Claude Code (project scope)
├── scripts/make-favicon.mjs  draws src/app/favicon.ico from icon.svg (`pnpm favicon`, ADR 0020)
├── docs/
│   ├── SPEC.md               product spec and phase plan (local only, gitignored)
│   ├── adr/                  NNNN-kebab-title.md (local only, gitignored)
│   └── walkthroughs/         annotated explanations of non-obvious code
├── reports/                  sourced research reports (local only, gitignored)
├── research_notes/           notes behind each report (local only, gitignored)
├── src/
│   ├── app/
│   │   ├── icon.svg          the favicon: the logo mark on a background tile (ADR 0019)
│   │   ├── favicon.ico       16, 32 and 48px frames of icon.svg, from `pnpm favicon` (ADR 0020)
│   │   ├── apple-icon.tsx    the iOS home-screen icon, drawn at build time
│   │   ├── opengraph-image.tsx  the site's link preview image
│   │   ├── robots.ts, sitemap.ts  /robots.txt and /sitemap.xml (the sitemap lists site-pages.ts)
│   │   ├── legal/, privacy/, terms/  the legal notice, privacy policy and terms of use (ADR 0021)
│   │   ├── layout.tsx        shell, disclaimer, attribution, metadataBase and title template
│   │   ├── page.tsx          hub home
│   │   └── tools/chat/       chat-message builder route (page.tsx, static) and its link preview image
│   ├── features/chat/
│   │   ├── engine/           registry, parse, serialize, render, count, optimize, share (pure TS, tests beside each)
│   │   └── ui/               builder: palette-commands (its palette commands), descendant-icons (each Descendant's chat icon), chat-builder, chat-editor (ProseMirror), editor schema, model and plugins, style picker (search, accordion), icon options, markup panel, chat line
│   ├── features/command-palette/  the command palette (ADR 0022): commands.ts (types, matching, grouping), site-commands.ts, palette-descendants.ts (server), palette-provider.tsx (Ctrl+K, sources), command-palette.tsx (the dialog), palette-button.tsx (navbar)
│   ├── lib/
│   │   ├── nexon/            server-only metadata: metadata.ts (one loader for every keyless set), descendants.ts (portrait URLs), showcase.ts (the home page's carousels)
│   │   ├── site-metadata.ts  the public address and `pageMetadata` (canonical address, link preview fields)
│   │   └── og-image.tsx      server-only: draws link preview images with next/og
│   ├── assets/fonts/         Rajdhani SemiBold and its OFL license, read at build time by og-image.tsx
│   ├── data/
│   │   ├── chat-tags.json    tag registry (versioned, patch-verified)
│   │   ├── site-pages.ts     every player-facing page with its label and footer icon: sitePages (navbar), legalPages (footer), allPages (site-pages.test.ts checks it against src/app)
│   │   ├── legal.ts          the legal pages' facts: operator, contact address, last-updated date
│   │   └── tools.ts          the tool registry: live tools and coming-soon tools for the home page's cards
│   ├── components/           hub shell (site-header and site-nav: the floating navbar; logo-mark: ArcheLab's mark; site-footer with legal text; legal-page: the legal pages' layout; hero-backdrop: the DotGrid and glow behind both heroes), tool cards
│   │   ├── ui/               shadcn/ui components (ADR 0009): owned source, added with the pinned CLI
│   │   └── react-bits/       React Bits components, adapted (dot-grid, shiny-text, spotlight-card, pixel-card, star-border, specular-button, pill-nav, counter, glare-hover) and their LICENSE.md
│   └── styles/               globals.css (Tailwind theme, tokens), tokens.ts (palette values for the first paint and canvas/WebGL)
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
- **`images[]`:** `id`, `label`, `art`, `artVerified`, `source`, `notes`. All 168 ids, every one in Steam guide 3806145510 plus Ultimate Hailey's ticket (`Icon_CharacterTicket_016_U01`, predicted from the ticket rule, test sheet R32), are in-game results (`source: "in-game-test"`): the six from Part 2, 38 from T7SEN's icon list of 2026-10-15 (most not described yet: labeled placeholders, `artVerified: false`), and 39 that Part 8 of the test sheet confirmed the same day: the 22 other base Descendant portrait ids (`Icon<Name>1`, one per base Descendant in NEXON's `descendant.json`, from Steam guide 3806145510, ADR 0011), `Gold`, `Plain`, and 15 that T7SEN had added as labeled placeholders (seven other portrait ids, `Qulipothium`, `DimensionalFragment`, four character tickets, `Mouse0` and `Mouse1`), plus the guide's last 84, all working in Part 10 (54 icons as labeled placeholders and 30 character tickets). An id not tested in game yet joins with `source: "community"`, marked "Not tested in game yet" in the builder and in its notes (`registry.test.ts` checks the notes). When a result comes in, set its `source` to `in-game-test`, or remove an id that shows as text, as Part 8 did for `Toxic`, `Fire`, `Chill`, `NonAttribute` and `Mission7`. Don't guess ids from patterns: 95 such guesses all failed (test sheet Part 11). When a patch adds a Descendant, test its `Icon<Name>1` portrait and its tickets (`Icon_CharacterTicket_NNN_A01`, and `U01` for an Ultimate, NNN its place in NEXON's base order with Bunny fourth). `art` is `{ kind: "descendant", descendant }`, the NEXON API portrait of that Descendant; `{ kind: "ticket", descendant }`, a character ticket showing that Descendant's API portrait in a gold ring (all 36 numbered tickets: `Icon_CharacterTicket_NNN_A01` is the NNNth base Descendant in NEXON's order with Bunny fourth, and `U01` that Descendant's Ultimate; confirmed in test sheet Q8 to Q12 and Part 10, ADR 0014); `{ kind: "nexon-site", url, page }`, an image on NEXON's community CDN and the official page that shows it (`RedCash` and `Gold` from the Currency guide on the community CDN; `Blazer`, `Glacier`, `Electricity`, `Demonic` and `Plain` from the Library's `icon_elemental--<id>.png` on the site's asset CDN, `tfdvod.dn.nexoncdn.co.kr`; ADR 0012); or `{ kind: "placeholder" }`. Portrait icons such as `IconHailey1` show the base Descendant's portrait, never the Ultimate one (T7SEN, 2026-10-15), so `descendant` names the base Descendant; only a ticket may name an Ultimate (`Ultimate Bunny` for `Icon_CharacterTicket_004_U01`). The registry never stores image URLs: they are NEXON Game Data under the 30-day limit (section 5.5).
- **`channels[]`:** untagged text color per channel: `name`, `label`, `hex`.
- **`chatBackground`:** the sampled chat panel color (`#212321`). Contrast hints are always measured against it. The editor shows it only while its Game background switch is on (T7SEN, 2026-10-15); otherwise the editor sits on the site's surface.
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
- **Source of truth:** engine pieces. The editor and the markup panel write them; the counter, overflow highlight, hints and copy read them.
- **Picker:** a search box (label, tag name, same-looking names, group title) above accordion sections: Colors (27, hue order), Rarity (4), Whites and grays (13), Bold and italic, Text sizes, Descendants (23 portrait tiles with names, A to Z), then the other icons by what their ids name (`iconGroupOf` in `icon-options.tsx`): Currency (Caliber, Gold, Silver emblem, Silver card; right below Descendants, T7SEN, 2026-10-15), Other portraits (portrait ids with no API portrait), Bosses and missions, NPCs, Damage types, Mouse and gamepad buttons, Character tickets, Other, each A to Z with numbers in order. Colors, Rarity, Descendants, Currency and Bosses and missions start open; a search opens every section that matches. `styleGroups` shows each look once under its shortest tag, grouped by appearance, never by where a tag name came from (T7SEN, 2026-10-15). Small swatches with tooltips show the cost and mark the 9 colors below WCAG AA on the chat background. An icon not tested in game carries a "?" mark, says so in its tooltip and accessible name, and a message that uses one shows a "Not tested in game yet" hint; since Part 8 (2026-10-15) no icon is untested.
- **Copy:** one "Copy markup" button (React Bits StarBorder) with the counter badge beside it, under the message. The badge's number rolls like an odometer (React Bits Counter); screen readers get the plain number, and a thin bar above the footer fills violet toward the limit and turns orange past it. It copies the shorter of the optimizer's output and the text as written (both render the same). "Copy as written" appears when they differ. A quieter "Clear" button follows them (T7SEN, 2026-10-15): it empties the message as one editor edit, so Ctrl+Z brings it back, and is disabled while the message is empty. The markup panel itself is folded away until opened.
- **No separate preview** (T7SEN, 2026-10-15): the editor is drawn as the in-game chat line (channel color, game colors, larger text, a stand-in "You:" sender, kept for every channel even where the real format is known: T7SEN, 2026-10-15), so it is the preview. Five channels, each with its sampled untagged color: Normal, World, Trade, Whisper and Party (the last two from T7SEN's screenshot, 2026-10-15); the chips wrap on narrow screens. It sits on the site's dark surface; the Game background switch beside the channel chips puts the sampled chat panel (`#212321`) behind it to check readability (T7SEN, 2026-10-15: the game's gray looked out of place). Picker swatches and icon chips use the token surfaces (`bg-secondary`, `accent` on hover), not the game's gray. The overflow highlight in it shows what the game cuts. The sender's in-game format is not verified. `ChatLine` renders read-only lines; `ChatShowcase` (`chat-showcase.tsx`) uses it for the home page window of sample messages, one per channel with the first line's markup and real count. The font is an approximation; icon sizes are measured in game (landmine notes below, ADR 0013).
- **Layout:** a hero like the home page's (shared `HeroBackdrop`, ShinyText title, a badge with the in-game verified date) above two columns from the `lg` breakpoint: the message window stays in view on the left (sticky) while the Style panel scrolls on the right. On narrow screens the Style panel follows the message. The message is a floating glass chat window (a SpotlightCard with the home sample's violet edge, title bar and channel chips); the Style panel is a SpotlightCard too, and a glare sweeps a color swatch on hover (React Bits GlareHover, T7SEN, 2026-10-15).

### 5.4 Sharing and templates
- Share links (ADR 0015): `/tools/chat#m=<code>&c=<channel>`, in the hash so the message never reaches the server; codes from `encodeShare` (section 5.2). `share-link.ts`: `shareHash(markup, channel)` (null when the code would pass `maxShareCodeLength`) and `readShareHash(hash, channelNames)` (`none`, `broken`, or a message with a known channel or null). `ChatBuilder` opens a link after hydration and on `hashchange`, runs it through `cleanMarkup`, then removes the hash with `history.replaceState`; a notice says it opened, or that the link is broken. "Copy link" shares the markup as written. Decoded content is untrusted text.
- Personal templates (ADR 0017; curated templates dropped by T7SEN, 2026-10-16): `personal-templates.ts` keeps a JSON list of `{ id, name, markup, channel, savedAt }` under `localStorage` key `archelab.chat.templates.v1`, newest first, capped at 50 templates, 40-character names and 2,000-character messages. `loadTemplates` validates each entry with Zod and drops bad ones; `storeTemplates` returns false when the browser refuses; `saveTemplate` (a matching name, ignoring case, is replaced), `renameTemplate`, `deleteTemplate` and `restoreTemplate` are pure. `browserStorage` probes with a write and returns null when storage is blocked; every access is wrapped in try/catch, and the builder works without storage. The "Templates" button in the message window's title bar opens `TemplatesSheet` (shadcn Sheet): save the current message under a name, then load, rename or delete (with Undo). Loading runs the markup through `cleanMarkup`, replaces the message through `ChatEditorHandle.replace` as one undo step, switches to a known channel, and returns focus to the editor (`finalFocus`).

### 5.5 NEXON data layer — `src/lib/nexon`
- Base: `https://open.api.nexon.com/static/tfd/meta/en/<set>.json`. Verified keyless for `descendant.json` on 2026-10-14 and again on 2026-10-15; the sets that responded on 2026-10-15 are listed in `docs/SPEC.md` section 6 and in `metadataSets`.
- **One loader (ADR 0018):** `metadata.ts` exports `fetchMetadataSet(set, entrySchema)`, `entriesFrom(data, schema)`, `nexonImageUrl` and `imageHost`. Each caller writes a `z.object` schema for only the fields it uses; entries that fail are dropped one by one, and an outage or a non-list returns no entries with a warning. No fetch cache: every build fetches afresh, so the weekly deploy keeps data under a week old. `showcase.ts` builds the home page's bands from `descendant.json` (the first entry of each `descendant_group_id`, by id, and the count of "Ultimate …" names) and `weapon.json` (the highest `weapon_tier_id` of each `weapon_type`).
- Images: `https://open.api.nexon.com/static/tfd/img/<hash>`, loaded directly. Never through Vercel Image Optimization.
- **30-day limit:** Nexon Game Data is kept at most 30 days (Nexon API Terms §8.7, [terms](https://openapi.nexon.com/support/terms/)). Static pages built from it are rebuilt at least every 30 days, for example by a scheduled deploy, and image URLs are never stored in committed files.
- **No data-mining:** no data-mining outside the API (§8.15), so no art is extracted from game files. Chat icons use API portraits, images linked from NEXON's own site (Caliber and Gold from the Currency guide, the five element icons from the Library; ADR 0012: T7SEN accepted that NEXON's terms of service restrict this; to undo, set their `art` back to `placeholder`), or labeled placeholders (`src/data/chat-tags.json`, `images[].art`). Never copy NEXON art into the repository.
- Zod schemas validate every response. A schema failure degrades the page; it never crashes the build silently.
- **Built so far (Phase 2, ADR 0008):** `descendants.ts` maps base Descendant names to portrait URLs while `/tools/chat` is prerendered. Invalid entries are skipped one by one; a failed fetch logs a warning and leaves every icon on its placeholder. A weekly scheduled CI run (Mondays 04:17 UTC) redeploys production so the data stays far inside the 30-day limit.
- Attribution on every page: "Data based on NEXON Open API."

### 5.7 Command palette — `src/features/command-palette`
Ctrl+K or ⌘K, or the navbar's search pill, opens a Base UI `Dialog` holding an always-open inline `Autocomplete` (Base UI's documented pattern; no cmdk; ADR 0022). Commands come from sources: pages, tools and Descendants are built in (`PaletteProvider` in the root layout, Descendants as plain data from the server), and a page adds its own with `usePaletteSource(id, order, commands, hides)`, registered once per mount and read each time the palette opens. The chat builder adds its actions and channels (first) and every style and icon (last), and hides the Descendants group. Picked commands run in `onOpenChangeComplete`, after focus returns, so editor commands keep the cursor. The future builds database plugs in as another source. See `docs/walkthroughs/command-palette.md`.

### 5.6 Hub shell — `src/components`, `src/app`
A floating navbar, the home page, and a footer on every page. Legal pages (ADR 0021): `/legal`, `/privacy` and `/terms` use `LegalPage` and `LegalSection` from `src/components/legal-page.tsx`, take their facts from `src/data/legal.ts`, and are listed in `legalPages`, which the footer's Legal column reads; they never join the navbar. Metadata (ADR 0020): every page exports `pageMetadata` (canonical address, Open Graph and card fields); `opengraph-image.tsx` files draw link previews; `apple-icon.tsx`, `favicon.ico`, `robots.ts` and `sitemap.ts` sit in `src/app`; see `docs/walkthroughs/metadata.md`. ArcheLab's logo (`LogoMark` in `src/components/logo-mark.tsx`, T7SEN's design, ADR 0019) is the navbar's logo on its own, turning once on hover, and sits before the wordmark in the footer; `src/app/icon.svg` is the favicon. The home page (ADR 0018; layout ideas from tfdhub.gg at T7SEN's request, in ArcheLab's own look) runs: a short centered hero (badge, ShinyText title, "Open the chat builder" StarBorder and "What's coming"); a section per live tool from the tool registry `src/data/tools.ts` (`FeaturedTool` in `tool-cards.tsx`: features in a SpotlightCard beside a live sample, the chat window for the chat builder); "Coming soon" (`ComingSoonTools`, PixelCards, anchored `#coming-soon`); then the Descendants and Weapons carousels (`game-showcase.tsx`). Every section uses `SectionHeader` (icon chip, title, description, action at the right). `CardCarousel` (client) is a snapping grid row (`.card-carousel-track` in `globals.css`): a page is the whole cards in view (four, two, or one with a peek), it turns every few seconds and wraps, holds on hover and on focus inside, and has back, next and pause buttons; with reduced motion it only turns by hand and shows no pause button. Descendants run newest first with Ultimates in the game's `UltimateCharacter` gold, each linking to the chat builder with its portrait or Ultimate ticket icon; weapons show the highest tier of each type. A carousel disappears when NEXON sends nothing usable. `SiteFooter` adds a sitemap (Tools from the registry, Site from `site-pages. Every footer link has a lucide icon in the link's own color, on the label's first line (T7SEN, 2026-10-16): tools use their registry `icon`, pages the `icon` in `site-pages.ts`, NEXON Open API `Database`.ts`, Data) above T7SEN's footer line and the attribution. `tools.test.ts` ties live tools to the navbar's page list. The navbar (`site-nav.tsx`, placed by `site-header.tsx`) links every page in `src/data/site-pages.ts` and marks the current one. `site-pages.test.ts` lists the `page.*` files under `src/app` and fails until each one has an entry, so adding a page means one route and one entry there (T7SEN, 2026-10-15: new pages join the navbar automatically; ADR 0010).

## 6. Design system

- Clean, modern, dark. ArcheLab's own identity, with in-game cues as accents: rarity tier colors, Arche energy effects, and Descendant and item art from the API.
- **Components:** shadcn/ui on Base UI (ADR 0009), in `src/components/ui`. `components.json` holds the CLI settings (style `base-nova`, icons `lucide`). Add components with `pnpm exec shadcn add <name>` (the pinned CLI), then format, lint and review the diff.
- **React Bits registry** (T7SEN, 2026-10-15): `components.json` lists `@react-bits` (`https://reactbits.dev/r/{name}.json`), added with `pnpm dlx shadcn@latest registry add @react-bits`. Add an item with `pnpm exec shadcn add @react-bits/<name>`. Its license is MIT plus the Commons Clause: use, change and publish the components as part of the site, but never sell or redistribute the components on their own. Keep the copyright notice ("Copyright (c) 2026 David Haz" and the license text or a link to it) in each copied component. Check each item's dependencies against the zero-cost and pinning rules before adding it.
  - **In use** (T7SEN 2026-10-15): DotGrid (hero background), ShinyText (hero headline), SpotlightCard (the chat builder's tool card), PixelCard (the coming-soon tool card), StarBorder (the hero's main link to the builder, violet-tinted), SpecularButton (the tool card's link), PillNav (the navbar, split layout: the round logo pill and the links as two floating glass pills). On the chat page (T7SEN, same day): DotGrid and ShinyText in its hero, SpotlightCard for the message window and the Style panel, StarBorder for Copy markup, Counter for the character count, GlareHover on the color swatches. None adds a package; all stop animating under `prefers-reduced-motion`.
  - **How they are adapted:** moved to `src/components/react-bits/` as kebab-case files with named exports, a header naming the source and license, and lint fixes (props copied to a ref in an effect instead of during render, no unexplained `!`). StarBorder and SpecularButton take an `href` that renders a Next.js `Link` inside the client component: a server component cannot pass `as={Link}` across the client boundary (the build fails), and navigation must stay a link. StarBorder's original class string joined classes without a space; it uses `cn` now. PixelCard lost its fixed 300 by 400 size (it fills its container), its color variants and its light theme; decorative uses pass `noFocus`, so the card stays out of the tab order. Counter's settings and kick refs update in a layout effect declared before its other layout effects, because those read them in the same commit (a plain effect would run after them). GlareHover sits inside each swatch as an overlay, not around it: its wrapper clips overflow and would cut the pressed and focus rings. PillNav renders Next.js links and takes the logo as a React node (ArcheLab's `LogoMark`) instead of an image URL, in the original round pill with the original hover spin; its fold-into-a-menu check measures the logo's real width; a `trailing` slot holds a round pill after the links (the palette's search button, ADR 0022), counted in that check and moved beside the menu button when folded; it closes and hides the menu when the links fit again (the original left the bar transparent after a resize with the menu open), and hides the menu at once under reduced motion. Re-adding one from the registry overwrites these changes.
  - **Glow canvases reach past their element** (SpecularButton by 24px, StarBorder by 48px). Near a page edge, clip the container's horizontal overflow, or the page scrolls sideways on phones.
  - **Colors come from the palette.** DotGrid (WebGL) and ShinyText (canvas color parsing) cannot read CSS variables, so they take hex values from `palette` in `src/styles/tokens.ts`. SpotlightCard draws with CSS, so its surface, border, light and shadow use `var(--card)`, `var(--border)`, `var(--primary)` and `var(--background)`; its light theme was removed (the site is dark only). Counter draws no color of its own (its mask is alpha only), and GlareHover's streak defaults to `var(--foreground)`. PillNav is CSS only, so its colors are CSS variables too; its light theme and color props are gone. PixelCard draws its pixels and glow on a canvas, so they default to palette values (violet, lavender, near-white); its surface, rim and focus ring are CSS and use the variables.
- **shadcn MCP server** (T7SEN, 2026-10-15): `.mcp.json` registers `shadcn mcp` for Claude Code, created with `pnpm dlx shadcn@latest mcp init --client claude`. It lists, searches and shows items from the registries in `components.json` (including `@react-bits`). Claude Code asks for approval before starting a project server; check it with `/mcp`. It runs through `npx shadcn@latest`, the newest CLI. T7SEN keeps the pinned `shadcn` dev dependency on the newest release too (4.21.5 since 2026-10-15).
- **Rarity accents.** The tier colors used in the UI are the same hex values the in-game test establishes for `<tier1>` to `<tier4>`. One source of truth: `src/data/chat-tags.json` feeds both the preview and the accent tokens. Tier colors used for text must pass WCAG AA on their background; otherwise they are used for fills, borders and glows only. The sampled values are in the registry: tier1 `#53B7F7`, tier2 `#D487F5`, tier3 `#F7DB78`, tier4 `#FF886D`.
- **Palette and type.** Chosen 2026-10-15 (ADR 0004): direction A (Signal) with direction B's (Rift) palette, on shadcn's token names since ADR 0009 (dark only: `dark` class on `<html>`, values in `:root`).
  - Tokens in `src/styles/globals.css`, as Tailwind utilities: `background` `#0a0812`, `card` `#141024`, `popover`/`secondary`/`muted` `#1c1630`, `accent` `#241c3d` (shadcn's hover surface, not a brand color), `border`/`input` `#2b2244`, `foreground` `#ece7f7`, `muted-foreground` `#a69dc3`, `primary`/`ring` `#a184ff`, `destructive`/`warning` `#ff886d` (overflow, refused characters, hard-to-read colors). `radius` 0.625rem. `--site-header-height` 3.5rem is the sticky header's height (a 0.75rem gap above the 44px navbar); the home hero slides up under the header by it. Tailwind's default palette is removed. `palette` in `src/styles/tokens.ts` mirrors `background`, `foreground`, `border`, `muted-foreground` and `primary` for code that cannot read CSS variables (the first-paint background, canvas and WebGL); `shell-background.test.ts` keeps the two equal.
  - Type: Rajdhani for display (`font-display`) and shadcn titles (`font-heading`), Inter for body (`font-sans`), loaded in the root layout with `next/font/google`.
  - Shapes: shadcn's rounded cards, inputs, toggles and tooltips (T7SEN, 2026-10-15). The clipped HUD frames of Phase 0 are gone.
  - Tooltips (`src/components/ui/tooltip.tsx`, a local edit): small dark glass, not shadcn's inverted near-white. `popover` surface at 95% with a backdrop blur, a `border` edge, 11px text, at most 15rem wide, no arrow (T7SEN, 2026-10-15: the default was too big and white). They open after 700ms of hovering (`TooltipProvider delay={700}` in the root layout; shadcn's default is 0, T7SEN, same day); once one is open, the next opens at once within Base UI's 400ms timeout, so scanning across swatches stays quick. Picker tooltips put the label in `foreground`, the tag in violet monospace, the cost in `muted-foreground` and the readability warning in `warning`.
  - Arche effect: a faint scan band in `accent` sweeps down featured art about every 5 seconds.
  - The violet accent sits close to the Rare (tier2) purple, so rarity is never shown by color alone.
- **Fonts.** Free licenses that allow self-hosting. No NEXON or game fonts.
- **Motion.** Arche energy effects are CSS or SVG, subtle, and disabled under `prefers-reduced-motion`. A global rule in `globals.css` also shortens shadcn's component animations under `prefers-reduced-motion: reduce`.
- **No NEXON branding.** No game logo, no NEXON logo, no art used as ArcheLab's own branding.
- **Logo** (T7SEN's design, 2026-10-16; ADR 0019). One stroked path on a 128 grid: `logoPath` in `src/components/logo-mark.tsx`. `LogoMark` draws it in the current text color, cropped to its edges and hidden from screen readers. The navbar shows it alone (the link's label is "ArcheLab"), the footer beside the word ArcheLab; both color it `primary`. The favicon, `src/app/icon.svg`, repeats the path in `primary` on a `background` tile. Its hex values and path are checked against `palette` and `logoPath` by `logo-mark.test.ts`, so change both files together.

## 7. Conventions

- **Code.** TypeScript strict, kebab-case files, named exports, no magic numbers.
- **Commits.** T7SEN commits and pushes on `main` (AGENTS.md rule 8, since 2026-10-15). Agents edit and test the local checkout only, and can suggest a Conventional Commits message. Every push to `main` deploys production.
- **ADRs.** `docs/adr/NNNN-kebab-title.md` with Context, Decision, Consequences, Alternatives. Local only and gitignored; never committed.
- **Walkthroughs.** `docs/walkthroughs/<subsystem>.md`: the code path, why it is shaped that way, what would break it.
- **Copy.** Player-facing, short, sentence case. Game terms spelled as the game spells them.
- **Page metadata.** Every page exports `metadata = pageMetadata({ path, title, description })` from `src/lib/site-metadata.ts`, adding `ownImage: true` when its folder has an `opengraph-image` file. Never set `openGraph` by hand: Next.js merges metadata shallowly, so a partial `openGraph` drops the rest, and an image set in metadata replaces a page's own image file (ADR 0020, ADR 0021).
- **Page commands.** A page with actions of its own offers them in the command palette with `usePaletteSource`; pass `hides` as a module constant, never a new array per render (ADR 0022).
- **Accessible names.** A control's accessible name starts with its visible text, in the same order (WCAG 2.5.3): icon buttons read "Ajax +21 characters", Descendant cards "Hailey Ultimate: …". Lighthouse's label check fails otherwise.
- **Legal text.** Footer on every page, in T7SEN's words (2026-10-15): "Made with ❤️ by T7SEN. © 2026 ArcheLab - ArcheLab is a community fan site and is not affiliated with Nexon." Plus the attribution NEXON's API terms require (§8.4): "Data based on NEXON Open API." (`src/components/site-footer.tsx`).
- **Legal pages** (ADR 0021): the legal notice, privacy policy and terms of use. They never name the host or the source code (T7SEN, 2026-10-16: the repository goes private). T7SEN approved their wording on 2026-10-16, so they are T7SEN's legal text: change them only at T7SEN's request. NEXON's API terms §8.6 require the privacy policy. It must stay accurate: change it before the site stores or sends any user data, and change `legalUpdated` with any wording.

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
| `pnpm test:e2e` | Playwright against `pnpm start`; run `pnpm build` first. Chromium runs every spec; Firefox and WebKit run `share.spec.ts` and `palette.spec.ts` (ADR 0015, ADR 0022). On a new machine, run `pnpm exec playwright install chromium firefox webkit` once. Wait for the editor to be visible before clicking anything: a click before hydration is lost. |
| `pnpm favicon` | Redraws `src/app/favicon.ico` from `src/app/icon.svg` with Playwright's Chromium. Run it after changing the icon. |
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
13. **Scheduled rebuilds stop on a quiet repository.** GitHub disables scheduled workflows in a public repository after 60 days without activity. Without the weekly run, the live page's NEXON data ages past the 30-day limit (ADR 0008). Re-enable the schedule in the Actions tab if that happens. Once T7SEN makes the repository private (decided 2026-10-16), this rule no longer applies as GitHub states it, but every run then spends free-quota minutes: GitHub Free includes 2,000 a month, and runs past the quota are blocked, which would also stop the weekly rebuild.
14. **ProseMirror styles images if asked.** `addMark` over a range marks inline atoms too. Style text nodes only (`applyStyle`), and keep `normalizePlugin`, which strips styles from images that arrive by paste.
15. **NEXON's image host can fail.** A portrait URL can return 503 while others work (seen 2026-10-15). Every icon must fall back to its labeled placeholder.

16. **ProseMirror reads selections late.** It reads native selection changes only while focused, and can apply them after the next key. The editor takes a non-empty browser selection on blur and before picker commands (`syncSelectionFromDom`), never a collapsed one: after Ctrl+A over styled text the browser can report a collapsed caret while ProseMirror holds the whole line. Tests that click and press keys within a millisecond can still race ProseMirror itself; model real sequences.

## 11. Known tech debt

- **Intentional decision (ADR 0008):** the preview's font is an approximation. Icon size is measured (P15, 2026-10-15; ADR 0013): in the editor and chat lines `.chat-icon` is `calc(26 / 12 * 1cap)` tall, and art icons sit at `vertical-align: calc(-3.5 / 12 * 1cap)` (`iconHeightCaps` in `chat-icons.ts`). Descendant portraits (`.chat-icon-portrait`, from `chatIconClass`) are ringed discs `calc(46 / 12 * 1cap)` tall at `calc(-5 / 12 * 1cap)` (Q1, `portraitHeightCaps`); character tickets add `.chat-icon-ticket`, a gold ring in `--ticket-ring` (matched by eye, not sampled). The pickers keep 2em. The `cap` unit needs Chrome 118, Firefox 97 or Safari 17.2 (MDN browser-compat-data, checked 2026-10-15).
- **Intentional decision (ADR 0020):** mobile performance is reviewed, not tuned. Lighthouse 13.5.0 on 2026-10-16 scored 69 (builder) and 71 (home) on its simulated phone, 98 and 99 on desktop. The causes are about 3.7s of simulated JavaScript work in the two main bundles and 2–3 MB of NEXON's PNG art. Loading the WebGL backdrop and the editor later would be a refactor; T7SEN schedules it.

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
