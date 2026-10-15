# Shell: dark first paint and legal footer

## Code path

1. `src/styles/tokens.ts` exports `shellBackground`, the page background color.
2. `src/app/layout.tsx` puts it inline on `<html>` (`style={{ backgroundColor, colorScheme: "dark" }}`). It also exports `viewport` with `colorScheme: "dark"` and `themeColor`, which Next.js renders as `<meta name="color-scheme">` and `<meta name="theme-color">`.
3. `src/styles/globals.css` defines the same value as the `--color-shell` token, used by the `bg-shell` class on `<body>`.
4. `src/styles/shell-background.test.ts` reads `globals.css` and fails if `--color-shell` and `shellBackground` differ.
5. `src/components/site-footer.tsx` renders the legal text from `SKILL.md` section 7 inside `<footer>`, which the root layout puts on every page, including the 404 page.
6. `tests/e2e/shell.spec.ts` checks the footer text on `/` and on a missing page.

## Why it is shaped this way

- The stylesheet is a separate file. Until it arrives, the browser paints its default canvas, which is white in a light-mode browser. The inline style is part of the HTML itself, so the dark background applies at first paint. In the built HTML, `<html style="background-color:…">` comes before the stylesheet `<link>`.
- `color-scheme: dark` also makes form controls and scrollbars dark before CSS loads.
- The background value has to exist twice: once in TypeScript for the inline style and once in CSS for Tailwind. The unit test makes the duplication safe.

## What would break it

- Changing `--color-shell` without changing `shellBackground`, or the reverse. The unit test catches this.
- Removing the inline style from `<html>`. Nothing fails, but the white flash returns. Check the built HTML: `.next/server/app/index.html` should start with the styled `<html>` tag.
- Moving the footer out of the root layout, or into a client-only component. The e2e test catches a missing footer.
- Editing the legal text in one place only. It must match `SKILL.md` section 7 exactly, and the e2e test checks the published wording.
