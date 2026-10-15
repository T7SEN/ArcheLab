# Shell: dark first paint, navbar and legal footer

## Code path

1. `src/styles/tokens.ts` exports `shellBackground`, the page background color.
2. `src/app/layout.tsx` puts it inline on `<html>` (`style={{ backgroundColor, colorScheme: "dark" }}`). It also exports `viewport` with `colorScheme: "dark"` and `themeColor`, which Next.js renders as `<meta name="color-scheme">` and `<meta name="theme-color">`.
3. `src/styles/globals.css` defines the same value as the `--background` token (shadcn's name, ADR 0009), used by the `bg-background` class on `<body>`. `<html>` also carries the `dark` class, because the site is dark only and shadcn's components style their dark look through it.
4. `src/styles/shell-background.test.ts` reads `globals.css` and fails if `--background` and `shellBackground` differ, or if any value in `palette` (used by canvas and WebGL effects) differs from its CSS token.
5. `src/components/site-footer.tsx` renders the footer line in T7SEN's words and the NEXON Open API attribution (`SKILL.md` section 7) inside `<footer>`, which the root layout puts on every page, including the 404 page.
6. `src/components/site-header.tsx` puts the navbar in a sticky `<header>` that ignores clicks (`pointer-events-none`); only the nav takes them (`pointer-events-auto`), so the page around and under the floating pills stays usable. PillNav uses its split layout: the wordmark and the links are two glass pills. The header's height is the `--site-header-height` token (3.5rem: a 0.75rem gap above the 44px navbar). The home hero (`src/app/page.tsx`) and the chat page's hero (`src/app/tools/chat/page.tsx`) pull themselves up by that much (`-mt-(--site-header-height)`) and add it back to their top padding, so the dot grid and glow (`src/components/hero-backdrop.tsx`, shared) reach the top of the page behind the navbar while the heroes' content stays put. Pages without a hero start below the header.
7. `src/components/site-nav.tsx`, a client component, passes `sitePages` from `src/data/site-pages.ts` to PillNav (`src/components/react-bits/pill-nav.tsx`) and marks the link whose `href` equals `usePathname()`. The root layout keeps it mounted across client navigations, so the current-page dot slides to its new link instead of the bar reloading.
8. `src/data/site-pages.test.ts` walks `src/app` for `page.*` files, turns each folder path into its URL (route groups such as `(marketing)` add no segment; `_private` folders and `@slot` folders are skipped) and fails unless the URLs equal the `href`s in `sitePages` (ADR 0010).
9. `tests/e2e/shell.spec.ts` checks the footer text on `/`, `/tools/chat` and a missing page; on each listed page, that the navbar links every page and marks only that one with `aria-current="page"`; and, at 300px, that the links fold into a menu that opens, closes with Escape (focus returns to the button), navigates, and also closes with reduced motion.

## Why it is shaped this way

- The stylesheet is a separate file. Until it arrives, the browser paints its default canvas, which is white in a light-mode browser. The inline style is part of the HTML itself, so the dark background applies at first paint. In the built HTML, `<html style="background-color:…">` comes before the stylesheet `<link>`.
- `color-scheme: dark` also makes form controls and scrollbars dark before CSS loads.
- The background value has to exist twice: once in TypeScript for the inline style and once in CSS for Tailwind. The unit test makes the duplication safe.
- Next.js cannot list an app's pages at run time, and reading a label exported from each page file would mean importing every page into the navbar's client bundle, so the navbar keeps its own list. The unit test is what makes a new page join the navbar without anyone remembering to.
- PillNav decides between links and a menu by measuring: the hidden copy of the links (`measureListRef`) plus the wordmark's width (`logoRef`) against the header's inner width. The original measured a round logo mark of fixed size; the wordmark is wider, so it measures the real element. With today's two links the navbar folds at 346px wide and below.

## What would break it

- Changing `--background` without changing `shellBackground`, or the reverse. The unit test catches this.
- Removing the `dark` class from `<html>`. shadcn components fall back to their light styling for inputs and toggles.
- Removing the inline style from `<html>`. Nothing fails, but the white flash returns. Check the built HTML: `.next/server/app/index.html` should start with the styled `<html>` tag.
- Moving the footer out of the root layout, or into a client-only component. The e2e test catches a missing footer.
- Editing the legal text in one place only. It must match `SKILL.md` section 7 exactly, and the e2e test checks the published wording.
- Adding a page without an entry in `src/data/site-pages.ts`, or renaming a route folder without updating its `href`. The unit test catches both.
- Changing the navbar's size (PillNav `size`) or the header's top gap without updating `--site-header-height`. The header would clip or pad the pills, and the hero would no longer line up with the top of the page.
- Removing `pointer-events-auto` from the nav: the header's `pointer-events-none` would make the navbar unclickable. The e2e menu test catches it.
- Adding a dynamic route (`[slug]`). The test would list it with its brackets; decide how the navbar treats it first (ADR 0010).
