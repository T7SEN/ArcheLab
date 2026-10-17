"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

export interface PageTab {
  /** The tab's id and its address: `#skills`. The first tab has none. */
  readonly id: string;
  /** The tab's label: "Modules". */
  readonly label: string;
  /** The panel's heading, for screen readers, when it says more than the label. */
  readonly title?: string;
  /** A Lucide icon, the tab's favicon. */
  readonly icon: ReactNode;
  /** The line that opens the panel. */
  readonly description: ReactNode;
  readonly content: ReactNode;
}

// The address's hash, as a store: `replaceState` fires no `hashchange`, so a switch
// tells the listeners itself.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", listener);
  };
}

const currentHash = (): string => window.location.hash.slice(1);
const serverHash = (): string => "";

/**
 * A page's sections as browser-style tabs (T7SEN, 2026-10-17; ADR 0029): one section
 * shows at a time, under a tab strip that stays under the navbar while the page
 * scrolls. The open tab lives in the address (`#skills`), without a history entry.
 * Every panel stays in the page, hidden, so its text is in the HTML and a slider keeps
 * its place when you come back to it.
 */
export function PageTabs({
  label,
  tabs,
}: {
  /** The tab strip's accessible name: "Raven's sections". */
  label: string;
  tabs: readonly PageTab[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hash = useSyncExternalStore(subscribe, currentHash, serverHash);
  const first = tabs.at(0)?.id ?? null;
  const value = tabs.some((tab) => tab.id === hash) ? hash : first;

  // The strip fills the navbar's band while stuck, so nothing scrolls between them.
  // The sentinel sits just over one navbar height above the strip's resting place, so
  // a strip resting exactly under the navbar counts as stuck too.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const strip = stripRef.current;
    if (sentinel === null || strip === null) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      strip.toggleAttribute(
        "data-stuck",
        entry !== undefined &&
          !entry.isIntersecting &&
          entry.boundingClientRect.top < 0,
      );
    });
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, []);

  // On a phone the strip scrolls sideways: the open tab scrolls into it.
  useEffect(() => {
    const list = listRef.current;
    const open = list?.querySelector<HTMLElement>("[data-active]");
    if (list === null || open === null || open === undefined) {
      return;
    }
    const gutter = 16;
    const start = open.offsetLeft - gutter;
    const end = open.offsetLeft + open.offsetWidth + gutter;
    if (start < list.scrollLeft) {
      list.scrollTo({ left: start });
    } else if (end > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: end - list.clientWidth });
    }
  }, [value]);

  const select = (
    next: unknown,
    details: Tabs.Root.ChangeEventDetails,
  ): void => {
    const tab = tabs.find((candidate) => candidate.id === next);
    // Only a click or a key moves the address; Base UI's own fallbacks don't.
    if (tab === undefined || details.reason !== "none") {
      return;
    }
    const { pathname, search } = window.location;
    // Next.js keeps its router in step with replaceState (its "Native History API").
    window.history.replaceState(
      null,
      "",
      tab.id === first ? `${pathname}${search}` : `#${tab.id}`,
    );
    for (const listener of listeners) {
      listener();
    }
    // Scrolled into a long panel, the next one opens at its top, as in a browser.
    const root = rootRef.current;
    const strip = stripRef.current;
    if (
      root !== null &&
      strip !== null &&
      root.getBoundingClientRect().top < strip.getBoundingClientRect().top
    ) {
      root.scrollIntoView({ block: "start", behavior: "instant" });
    }
  };

  return (
    <Tabs.Root
      ref={rootRef}
      value={value}
      onValueChange={select}
      className="relative scroll-mt-(--site-header-height)"
    >
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-[calc(var(--site-header-height)+2px)] h-px"
      />
      {/* Each tab's anchor, at the strip: a link to #skills lands here, under the
          navbar. Not the tab itself, which the browser would focus, ring and all. */}
      {tabs.map((tab) => (
        <span
          key={tab.id}
          id={tab.id}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 scroll-mt-(--site-header-height)"
        />
      ))}
      <div
        ref={stripRef}
        className="sticky top-(--site-header-height) z-30 bg-card pt-2 data-stuck:before:absolute data-stuck:before:inset-x-0 data-stuck:before:bottom-full data-stuck:before:h-(--site-header-height) data-stuck:before:bg-card"
      >
        {/* The strip's bottom edge, which the open tab covers to join its panel. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-border"
        />
        <Tabs.List
          ref={listRef}
          aria-label={label}
          activateOnFocus
          className="relative mx-auto flex max-w-6xl [scrollbar-width:none] overflow-x-auto px-4"
        >
          {/* The open tab's shape: one indicator that slides to the tab you open.
              Its feet curve out into the strip's edge, as in Chrome. Base UI places
              it (CSS variables), before hydration too. */}
          <Tabs.Indicator
            renderBeforeHydration
            className="absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-t-lg border border-b-0 border-border bg-background shadow-[inset_0_2px_0_var(--primary)] transition-[left,width] duration-250 ease-out before:absolute before:bottom-0 before:-left-[7px] before:size-2 before:bg-[radial-gradient(circle_at_0_0,transparent_7px,var(--border)_7px,var(--border)_8px,var(--background)_8px)] after:absolute after:-right-[7px] after:bottom-0 after:size-2 after:bg-[radial-gradient(circle_at_100%_0,transparent_7px,var(--border)_7px,var(--border)_8px,var(--background)_8px)]"
          />
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.id}
              value={tab.id}
              className="group relative flex h-10 flex-none items-center gap-2 rounded-t-lg border border-b-0 border-transparent px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none before:absolute before:top-1/2 before:left-0 before:h-5 before:w-px before:-translate-y-1/2 before:bg-border first-of-type:before:hidden hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:max-w-48 sm:min-w-0 sm:flex-1 data-active:text-foreground data-active:before:hidden [[data-active]+&]:before:hidden"
            >
              {/* A closed tab's hover: a pill clear of the tab's edges, so it never
                  meets the open tab's feet. The open tab doesn't change on hover. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-2 inset-y-1.5 rounded-md transition-colors group-hover:bg-accent group-data-active:hidden"
              />
              <span
                aria-hidden="true"
                className="relative shrink-0 transition-colors group-data-active:text-primary [&>svg]:size-4"
              >
                {tab.icon}
              </span>
              <span className="relative truncate">{tab.label}</span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </div>
      {/* Clipped sideways: a panel sliding in mustn't widen the page. */}
      <div className="overflow-x-clip">
        {tabs.map((tab) => (
          <Tabs.Panel
            key={tab.id}
            value={tab.id}
            keepMounted
            // The panel you open slides in from the side of its tab and fades in.
            // A closing panel hides at once (no transition), so two never stack.
            className="mx-auto grid max-w-6xl gap-6 px-4 py-8 transition-[opacity,translate] duration-200 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset data-ending-style:transition-none data-starting-style:opacity-0 data-[activation-direction=left]:data-starting-style:-translate-x-4 data-[activation-direction=right]:data-starting-style:translate-x-4"
          >
            <div className="grid gap-1">
              <h2 className="sr-only">{tab.title ?? tab.label}</h2>
              <p className="max-w-2xl text-muted-foreground">
                {tab.description}
              </p>
            </div>
            {tab.content}
          </Tabs.Panel>
        ))}
      </div>
    </Tabs.Root>
  );
}
