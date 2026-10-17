# Motion

Light animations across the site (ADR 0030). Each is short, moves only `opacity` and position, and stops under reduced motion.

## Code path

1. **Two engines, one switch.** CSS animations (tw-animate-css classes such as `motion-safe:animate-in motion-safe:fade-in`, and the motion block at the end of `src/styles/globals.css`) follow the reduced-motion rule in `globals.css`. Animations started from JavaScript use the Web Animations API (`element.animate`), which that rule can't reach, so they first ask `motionAllowed()` (`src/components/motion.ts`).
2. **Page entrance.** The root layout wraps every page in `PageEnter` (`src/components/page-enter.tsx`) inside `<main className="overflow-x-clip">`. Its `div` carries a CSS fade-and-rise for the first load. A layout effect on `usePathname()` replays it with `animate()` whenever the path changes, skipping the first run; queries and hashes don't change the path.
3. **Home fade-up.** `ScrollReveal` (`src/components/scroll-reveal.tsx`) wraps the home page's sections. After mount it marks each child that starts below the fold `data-reveal="waiting"` and watches it with one IntersectionObserver; on entry it sets `"shown"` and stops watching it. `globals.css` styles both states, and gives carousel cards (`.card-carousel-track > li`) a step each (`--reveal-step`) for their delay.
4. **Index grids** (`src/features/game-data/grid-items.tsx`):
   - each card is a `CardItem` with `enter={useChangedSince(search)}`. `useChangedSince` stays false until the query first differs from the one the index mounted with, then stays true. `CardItem` copies `enter` into state at mount, so only cards mounted after a filter change fade in;
   - the open details sit in a `DetailsRowItem`. The index takes `[detailsCard, closing, closed]` from `useClosing(openCard, slug)`: when the card closes, `detailsCard` stays the closed one and `closing` turns true. The row, now `inert`, runs a 200ms fold (`height` from its own to 0, with `opacity`, held at the end with `fill: "forwards"`) and calls `closed` when it ends (`useEffectEvent`, so a re-render doesn't restart it); `closed` drops the card. Under reduced motion it calls `closed` at once, before paint. If the closing card is filtered out, the index calls `closed` during render, since its row has nowhere to show;
   - the empty state carries a CSS fade.
5. **Switches.** `useSlideIn(value, order)` returns a ref for the content a switch changes. A layout effect compares `value` with the last one it saw and, when it changed, animates the element from 16px to the right (a later choice in `order`) or the left (an earlier one), and from transparent. Used by `module-details.tsx` (facts, effect), `reactor-details.tsx` (levels), `component-details.tsx` (pieces by tier; the piece shown by piece id in the card's order) and `core-type-grid.tsx` (type cards by grade).
6. **Smaller touches:**
   - `research-recipe.tsx` gives each part's `<details>` the `.details-glide` class (`::details-content` from 0 to `auto` with `interpolate-size`);
   - `skill-list.tsx` transitions a marked skill's `border-color` and `box-shadow`, and fades its "Changed by" note in; `skills-section.tsx` keys the equipped panel by module, so it fades in for each one;
   - `stat-levels.tsx` keys each number by its value, so a CSS fade from 40% runs when it changes;
   - `chat-builder.tsx` pops the check mark in on "Copied" and "Link copied";
   - `globals.css` scales held buttons and block links to 0.98.

## Why it is shaped this way

- **No library.** tw-animate-css was already there for shadcn, and the Web Animations API covers what needs JavaScript.
- **The page entrance is not a `template.tsx`.** A template remounts only when its own segment changes (Next.js's bundled `template.md`), so a root one wouldn't replay between two Descendant pages; it would take a template in each route folder. `usePathname` replays on every new page from one place.
- **Cards don't fade on the first render.** An index's static HTML is its Suspense fallback; the browser then renders the real index in its place, so every card mounts again. Fading them then made all of them blink after load.
- **A switch's content isn't remounted to replay its animation.** A `key` per value would reset what's inside, such as a piece's level slider. Plain numbers have nothing inside, so they do use a `key`.
- **Only sections below the fold wait.** Hiding what is already on screen would flash it away and back after hydration.
- **`overflow-x: clip` on `<main>`, not `hidden`.** Both stop a sliding panel from widening the page, but `hidden` makes `<main>` a scroll container, and the tab strip would stop sticking.
- **The press rule uses `:where()`.** Its specificity is zero, so any component's own `active:` style wins (SpecularButton keeps its 0.97).

## What would break it

- Starting an `animate()` call without `motionAllowed()`: it runs under reduced motion, since the CSS rule doesn't stop it.
- Animating an element that a remount would replace, or keying a switch's content by value: sliders and selections inside reset.
- Rendering index cards as plain `<li>` elements again, or reading `enter` on every render instead of at mount: every card on screen replays the fade at each filter change.
- Removing `inert` from a closing row: a click or Tab can land in details that are leaving.
- Changing `<main>` to `overflow-x: hidden`, or wrapping the tab strip in anything that scrolls: it no longer sticks.
- Hiding sections in `ScrollReveal` before measuring where they are: the first screen blinks.
- Measuring a closing row's height after setting it to fold: the fold starts from 0 and the row vanishes at once.
- Dropping `fill: "forwards"` from the fold: between its end and React removing the row, the row springs back open for a frame or two (T7SEN's recording, 2026-10-17).
