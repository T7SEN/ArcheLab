"use client";

import { useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { wideArt } from "./wide-art";

/**
 * Pieces of the showcase pages, Fellows and Vehicles (T7SEN, 2026-10-17; ADR 0035,
 * ADR 0037): an index of three as big cards, each with its art and four key numbers,
 * opening every number and the research in a row under it.
 */

/** The showcase grid: one card a row on phones, three from Tailwind's `md` (48rem). */
export const showcaseGridClass = "grid gap-4 md:grid-cols-3";

const threeColumns = "(min-width: 48rem)";

function subscribeColumns(onChange: () => void): () => void {
  const list = window.matchMedia(threeColumns);
  list.addEventListener("change", onChange);
  return () => {
    list.removeEventListener("change", onChange);
  };
}

/**
 * The showcase grid's columns now, for where an open card's details go (`rowEnd`).
 * The static HTML assumes three; nothing is open in it.
 */
export function useShowcaseColumns(): number {
  return useSyncExternalStore(
    subscribeColumns,
    () => (window.matchMedia(threeColumns).matches ? 3 : 1),
    () => 3,
  );
}

/** A card's art: big, on a tile in its tier's color, whole and centered. */
export function ShowcaseArt({
  imageUrl,
  hex,
  className = "h-40",
}: {
  imageUrl: string | null;
  hex: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden rounded-2xl border ${className}`}
      style={{
        borderColor: `color-mix(in srgb, ${hex} 45%, var(--border))`,
        backgroundImage: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${hex} 30%, transparent), color-mix(in srgb, ${hex} 6%, transparent) 75%)`,
      }}
    >
      {imageUrl === null ? null : (
        // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, and Fellow art from the site's own files, never through Vercel Image Optimization (SKILL.md landmine 2).
        <img
          src={imageUrl}
          alt=""
          width={wideArt.width}
          height={wideArt.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-contain p-3"
        />
      )}
    </span>
  );
}

/** A tier's name on a pill in its color. */
export function TierPill({ name, hex }: { name: string; hex: string }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        color: hex,
        borderColor: `color-mix(in srgb, ${hex} 50%, transparent)`,
      }}
    >
      {name}
    </span>
  );
}

/**
 * A big card. It is a real link to the page with the item open, so it can be copied
 * or opened in a new tab; a plain click opens or closes its details in place.
 */
export function ShowcaseCardLink({
  id,
  href,
  hex,
  open,
  controls,
  onToggle,
  children,
}: {
  id: string;
  href: string;
  hex: string;
  /** Whether its details are open. */
  open: boolean;
  /** The details' id, while they are open. */
  controls: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // A modified or middle click opens the link as the browser would.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onToggle();
  };
  return (
    <a
      id={id}
      href={href}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onClick}
      className="group grid h-full content-start gap-4 rounded-2xl border bg-card/60 p-4 transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary aria-expanded:bg-primary/10"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${hex} 14%, transparent), transparent 55%)`,
      }}
    >
      {children}
    </a>
  );
}

/** A card's key numbers, two by two, then a line saying at which level and what opens. */
export function ShowcaseStats({
  stats,
  note,
}: {
  stats: readonly { readonly name: string; readonly value: string }[];
  note: string;
}) {
  return (
    <>
      <span className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <span
            key={stat.name}
            className="grid content-start gap-0.5 rounded-lg border bg-background/40 p-2"
          >
            <span className="text-xs text-muted-foreground">{stat.name}</span>
            <span className="font-display text-lg font-semibold tabular-nums">
              {stat.value}
            </span>
          </span>
        ))}
      </span>
      <span className="mt-auto text-xs text-muted-foreground">{note}</span>
    </>
  );
}
