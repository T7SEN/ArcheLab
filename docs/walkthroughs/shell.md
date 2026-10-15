# Shell: dark first paint and legal footer

## Code path

1. `src/styles/tokens.ts` exports `shellBackground`, the page background color.
2. `src/app/layout.tsx` puts it inline on `<html>` (`style={{ backgroundColor, colorScheme: "dark" }}`). It also exports `viewport` with `colorScheme: "dark"` and `themeColor`, which Next.js renders as `<meta name="color-scheme">` and `<meta name="theme-color">`.
3. `src/styles/globals.css` defines the same value as the `--background` token (shadcn's name, ADR 0009), used by the `bg-background` class on `<body>`. `<html>` also carries the `dark` class, because the site is dark only and shadcn's components style their dark look through it.
4. `src/styles/shell-background.test.ts` reads `globals.css` and fails if `--background` and `shellBackground` differ.
5. `src/components/site-footer.tsx` renders the footer line in T7SEN's words and the NEXON Open API attribution (`SKILL.md` section 7) inside `<footer>`, which the root layout puts on every page, including the 404 page.
6. `tests/e2e/shell.spec.ts` checks the footer text on `/`, `/tools/chat` and a missing page.

## Why it is shaped this way

- The stylesheet is a separate file. Until it arrives, the browser paints its default canvas, which is white in a light-mode browser. The inline style is part of the HTML itself, so the dark background applies at first paint. In the built HTML, `<html style="background-color:…">` comes before the stylesheet `<link>`.
- `color-scheme: dark` also makes form controls and scrollbars dark before CSS loads.
- The background value has to exist twice: once in TypeScript for the inline style and once in CSS for Tailwind. The unit test makes the duplication safe.

## What would break it

- Changing `--background` without changing `shellBackground`, or the reverse. The unit test catches this.
- Removing the `dark` class from `<html>`. shadcn components fall back to their light styling for inputs and toggles.
- Removing the inline style from `<html>`. Nothing fails, but the white flash returns. Check the built HTML: `.next/server/app/index.html` should start with the styled `<html>` tag.
- Moving the footer out of the root layout, or into a client-only component. The e2e test catches a missing footer.
- Editing the legal text in one place only. It must match `SKILL.md` section 7 exactly, and the e2e test checks the published wording.
