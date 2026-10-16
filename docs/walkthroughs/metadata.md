# Metadata: link previews, icons, robots and sitemap

## Code path

1. `src/lib/site-metadata.ts` holds the site's address (`siteUrl`), name and default description, and `pageMetadata`, which builds one page's description, canonical address, Open Graph fields and card for X.
2. `src/app/layout.tsx` sets `metadataBase` from `siteUrl`, so relative paths in metadata become `https://arche-lab.tech/…`. It also sets the title template ("%s | ArcheLab") and the default description.
3. Each page exports `metadata = pageMetadata({ path, title, description })`: `src/app/page.tsx` with no title (the layout's default, "ArcheLab"), `src/app/tools/chat/page.tsx` with "Chat message builder", and the three legal pages. `pageMetadata` sets the site image (`siteImage`, `/opengraph-image`) unless the page passes `ownImage: true`, as the home page and the builder do.
4. Next.js adds the link preview image from the nearest `opengraph-image.tsx`:
   - `src/app/opengraph-image.tsx` for the home page and any page without its own;
   - `src/app/tools/chat/opengraph-image.tsx` for the builder.

   Both call `ogImage` in `src/lib/og-image.tsx`, which returns a `next/og` `ImageResponse` drawn from `palette`, `logoPath` and Rajdhani SemiBold (`src/assets/fonts`).
5. Icons:
   - `src/app/icon.svg` (ADR 0019);
   - `src/app/apple-icon.tsx`, a 180px PNG drawn like the link previews;
   - `src/app/favicon.ico`, committed and redrawn from `icon.svg` by `pnpm favicon` (`scripts/make-favicon.mjs`).

   Next.js links all three from every page's head.
6. `src/app/robots.ts` and `src/app/sitemap.ts` serve `/robots.txt` and `/sitemap.xml`; the sitemap maps `allPages` (navbar and legal pages) onto `siteUrl`.
7. Tests:
   - `src/lib/site-metadata.test.ts` checks the sitemap against `allPages`, robots.txt, and `pageMetadata`'s fields.
   - `logo-mark.test.ts` checks the ICO's frames.
   - `tests/e2e/metadata.spec.ts` loads each navbar page and checks its canonical address, `og:url`, card type and preview image (fetched by path, so a local build works). It also fetches every icon and checks robots.txt and the sitemap.

## Why it is shaped this way

- **Every page calls `pageMetadata`, even with the same fields.** Next.js merges metadata shallowly. A page that exports only a title keeps the layout's `openGraph`, so the builder would share the home page's URL and title. A page that exports any `openGraph` loses the rest of the layout's. One helper keeps every page complete.
- **`ownImage` exists because metadata beats image files.** On Next.js 16.4.1 an `openGraph.images` set in a page's metadata replaces the image from that page's `opengraph-image` file (the builder briefly showed the home image). Pages without a file of their own would otherwise get no image, since their `openGraph` replaces the layout's and the root file's image with it.
- **The canonical address and `og:url` live on pages, not in the layout.** In the layout, every page that forgot its own, the 404 page included, would point at the home page.
- **Everything generated is static.** `opengraph-image`, `apple-icon`, `robots` and `sitemap` use no request-time API, so the build prerenders them (`○` in the route summary) and no function runs per request.
- **The font is a file in the repository.** `next/og` needs the font's bytes. next/font downloads Rajdhani at build time but keeps it where code cannot read it reliably, so `og-image.tsx` reads `src/assets/fonts/Rajdhani-SemiBold.ttf` with `process.cwd()`, once per build. The SIL OFL license travels with it.
- **The favicon is drawn by a script.** Next.js cannot generate `favicon.ico`. `make-favicon.mjs` renders `icon.svg` at 16, 32 and 48px in Playwright's Chromium, with a transparent background so the tile keeps its rounded corners. It then writes an ICO: a 6-byte header, a 16-byte entry per frame (size, 32-bit color, length, offset), then the PNGs.
- **The Apple icon is a full square.** iOS masks home-screen icons itself; the favicon's rounded tile would show square corners of another color.
- **The builder's preview covers share links.** A share link's message sits after `#`, which browsers never send, so a link preview can only show the builder itself.

## What would break it

- A new page without `pageMetadata` in its `metadata`. The e2e test fails on its missing canonical address.
- A page that sets `openGraph` by hand. It drops the site name, locale and card fields.
- Moving `og-image.tsx`'s font or renaming the folder. The build fails reading the file.
- Changing `icon.svg` without `pnpm favicon`. Tabs that use the ICO keep the old icon; the test only checks frame sizes.
- Using a request-time API (`headers()`, `cookies()`) in an image or route file. It would turn into a function that runs per request.
- Changing the public address without `siteUrl`. Previews, canonical addresses and the sitemap would point at the old one.
