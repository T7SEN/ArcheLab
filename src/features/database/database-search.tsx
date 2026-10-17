"use client";

import { ArrowRight, RotateCw, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearch, writeSearch } from "@/features/game-data/url-query";
import {
  artFit,
  loadDatabaseItems,
  minimumQuery,
  searchDatabase,
  type DatabaseItem,
} from "./database-items";

/** How many results show at once; a longer list asks for another word instead. */
const shownResults = 50;

/** The search, reading its query from the URL (`?q=`); it needs a `<Suspense>`. */
export function DatabaseSearchFromUrl() {
  return <DatabaseSearch search={useSearch()} />;
}

type Items = readonly DatabaseItem[] | "failed" | null;

/**
 * The database page's search (ADR 0034): one box over every item, results best first,
 * each opening its page or its details. The items load the first time the box gets
 * focus or the URL holds a search; `search` "" is what the static HTML holds.
 */
export function DatabaseSearch({ search }: { search: string }) {
  const query = new URLSearchParams(search).get("q") ?? "";
  const [wanted, setWanted] = useState(false);
  const [items, setItems] = useState<Items>(null);
  const [attempt, setAttempt] = useState(0);
  const needed = wanted || query.trim() !== "";

  useEffect(() => {
    if (!needed) {
      return;
    }
    let current = true;
    void loadDatabaseItems().then((list) => {
      if (current) {
        setItems(list ?? "failed");
      }
    });
    return () => {
      current = false;
    };
  }, [needed, attempt]);

  const trimmed = query.trim();
  const results =
    items === null || items === "failed" ? [] : searchDatabase(items, query);

  return (
    <div className="grid gap-3">
      <label className="relative">
        <span className="sr-only">Search the database</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          placeholder="Search Descendants, weapons, modules, reactors, components"
          onFocus={() => {
            setWanted(true);
          }}
          onChange={(event) => {
            const value = event.target.value;
            writeSearch(
              value === ""
                ? ""
                : `?${new URLSearchParams({ q: value }).toString()}`,
            );
          }}
          className="h-12 rounded-xl bg-card/80 pl-11 text-base backdrop-blur-md"
        />
      </label>

      {trimmed === "" ? (
        <p className="text-scrim text-sm text-muted-foreground">
          Type at least {minimumQuery} characters: a name, a type or a tier.
        </p>
      ) : trimmed.length < minimumQuery ? (
        <p className="text-scrim text-sm text-muted-foreground">
          Keep typing: a search needs {minimumQuery} characters.
        </p>
      ) : items === "failed" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
          The database couldn&apos;t be loaded.
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setItems(null);
              setAttempt((count) => count + 1);
            }}
          >
            <RotateCw aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : items === null ? (
        <p
          aria-busy="true"
          className="text-scrim text-sm text-muted-foreground"
        >
          Loading the database…
        </p>
      ) : (
        <section
          aria-label="Search results"
          className="grid gap-2 rounded-2xl border bg-card/80 p-2 backdrop-blur-md duration-200 motion-safe:animate-in motion-safe:fade-in"
        >
          <p
            role="status"
            className="px-2 pt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {results.length === 0
              ? `Nothing matches “${trimmed}”`
              : `${String(results.length)} ${results.length === 1 ? "result" : "results"}`}
          </p>
          {results.length === 0 ? null : (
            <ul className="grid gap-1">
              {results.slice(0, shownResults).map((item) => (
                <li key={`${item.category}:${item.href}`}>
                  <ResultLink item={item} />
                </li>
              ))}
            </ul>
          )}
          {results.length > shownResults ? (
            <p className="px-2 pb-1 text-sm text-muted-foreground">
              Showing {shownResults} of {results.length}. Add a word to narrow
              the search.
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}

/** A result: its art on a tile in its tier's color, its name, category and note. */
function ResultLink({ item }: { item: DatabaseItem }) {
  return (
    <Link
      href={item.href}
      // The modules index is too heavy to prefetch (sitePages), here as in the navbar.
      prefetch={item.category === "Modules" ? false : undefined}
      className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border"
        style={{
          borderColor: `color-mix(in srgb, ${item.hex} 45%, var(--border))`,
          backgroundImage: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${item.hex} 35%, transparent), color-mix(in srgb, ${item.hex} 8%, transparent) 75%)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
        <img
          src={item.imageUrl}
          alt=""
          width={88}
          height={88}
          loading="lazy"
          decoding="async"
          className={`size-full ${artFit(item)}`}
        />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate font-medium">{item.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {item.hint === "" ? item.category : `${item.category} · ${item.hint}`}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
