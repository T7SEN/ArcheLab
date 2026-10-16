import { useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

/**
 * An index's filters live in the URL query, so a filtered view can be shared (ADR 0023,
 * ADR 0024). The URL is read through Next.js (`useSearchParams`), which updates on every
 * navigation, a link to the same index included; reading `location` directly missed
 * those and left old filters on screen. A new query shows at once from memory and the
 * URL follows once typing pauses: writing it on every keystroke froze the search, since
 * Safari throws after 100 history updates in 10 seconds and Firefox ignores them past
 * its own limit (checked 2026-10-16). A blank search, such as a space typed first,
 * stays in memory and out of the URL: dropping it erased the space from the box.
 */

/**
 * A query the grid shows that the URL doesn't hold, and the page it belongs to: not
 * yet, or not at all when it has a blank value (`urlSearchOf`).
 */
let pending: { readonly path: string; readonly search: string } | null = null;
/** The last query written into the URL, so its echo from Next.js isn't a navigation. */
let written: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

/** How long the URL waits after the last change, and before trying again. */
const urlDelayMs = 300;
const retryMs = 2000;

/**
 * The part of a query ("?…" or "") the URL holds: every value but blank ones. A search
 * of spaces filters nothing, so the URL leaves it out, while the box keeps it.
 */
export function urlSearchOf(search: string): string {
  const params = new URLSearchParams(search);
  const kept = new URLSearchParams(
    [...params].filter(([, value]) => value.trim() !== ""),
  );
  if (kept.size === params.size) {
    return search;
  }
  return kept.size === 0 ? "" : `?${kept.toString()}`;
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readPending(): string | null {
  return pending !== null && pending.path === window.location.pathname
    ? pending.search
    : null;
}

/** Forgets a query not yet written: the URL is the source again. */
function drop(): void {
  clearTimeout(timer);
  if (pending !== null) {
    pending = null;
    notify();
  }
}

/** Writes the pending query into the URL, trying again later if the browser refuses. */
function flush(): void {
  if (pending === null) {
    return;
  }
  const { pathname, hash } = window.location;
  if (pending.path !== pathname) {
    // The page changed: this query belongs to the page left behind.
    pending = null;
    return;
  }
  const search = urlSearchOf(pending.search);
  if (window.location.search !== search) {
    try {
      // A null state lets Next.js take the update into its router (its docs, "Using
      // the native History API"), so `useSearchParams` follows.
      window.history.replaceState(null, "", `${pathname}${search}${hash}`);
    } catch {
      // Throttled (Safari's SecurityError): the retry writes it.
    }
  }
  if (window.location.search === search) {
    written = search;
    // A blank value the URL leaves out stays on screen until the URL moves.
    if (pending.search === search) {
      pending = null;
    }
  } else {
    timer = setTimeout(flush, retryMs);
  }
}

/**
 * A click writes what is pending at once, before the page's own handlers run (a capture
 * listener on the document fires before React's). A write that waited could otherwise
 * land while Next.js was still moving to the page a link leads to, and Next.js then
 * stayed put: a slow page load showed it (2026-10-16). Keystrokes aren't clicks, so
 * typing stays debounced.
 */
function onClickCapture(): void {
  if (pending !== null) {
    clearTimeout(timer);
    flush();
  }
}

function subscribe(onChange: () => void): () => void {
  if (listeners.size === 0) {
    document.addEventListener("click", onClickCapture, true);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      document.removeEventListener("click", onClickCapture, true);
    }
  };
}

/**
 * The index's query ("?…" or ""). It reads `useSearchParams`, so the component using it
 * must sit inside a `<Suspense>` whose fallback renders the index unfiltered: that
 * fallback is what the static HTML holds.
 */
export function useSearch(): string {
  const params = useSearchParams();
  const fromUrl = params.size === 0 ? "" : `?${params.toString()}`;
  const unsaved = useSyncExternalStore(subscribe, readPending, () => null);

  // The URL moved without us (a link to this index, Back or Forward): it wins over a
  // query not yet written. Our own writes echo back as `written` and are not moves.
  useEffect(() => {
    if (fromUrl !== written) {
      written = fromUrl;
      drop();
    }
  }, [fromUrl]);

  // Leaving the index writes what is pending if the URL is still this page's, or drops it.
  useEffect(
    () => () => {
      clearTimeout(timer);
      flush();
      clearTimeout(timer);
      pending = null;
    },
    [],
  );

  return unsaved ?? fromUrl;
}

/** Sets the index's query: the grid follows at once, the URL shortly after. */
export function writeSearch(search: string): void {
  pending = { path: window.location.pathname, search };
  notify();
  clearTimeout(timer);
  timer = setTimeout(flush, urlDelayMs);
}
