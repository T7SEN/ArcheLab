import { ArrowUpRight, Database, LayoutGrid } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { sitePages } from "@/data/site-pages";
import {
  artFit,
  databaseCategories,
  type DatabaseItem,
} from "@/features/database/database-items";
import {
  DatabaseSearch,
  DatabaseSearchFromUrl,
} from "@/features/database/database-search";
import { fetchDatabaseItems } from "@/lib/nexon/database-items";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/database",
  title: "Database",
  description:
    "Search every Descendant, weapon, module, reactor and external component of The First Descendant, or browse them by category.",
});

const numberFormat = new Intl.NumberFormat("en-US");

/** The wide-screen width of a first-row card, by how many share that row. */
const firstRowSpan: Readonly<Partial<Record<number, string>>> = {
  2: "lg:col-span-6",
  3: "lg:col-span-4",
  4: "lg:col-span-3",
};

/**
 * Where a category card sits, so no space is left empty (T7SEN, 2026-10-17): on wide
 * screens (12 columns) rows of three, with the first row taking the rest, two or four
 * (ten categories: four, then three and three); on medium screens pairs, an odd last card
 * across the row.
 */
function cardSpan(index: number, total: number): string {
  const extra = total % 3;
  const firstRow = extra === 0 ? 3 : extra === 1 ? Math.min(4, total) : 2;
  const wide =
    index < firstRow
      ? (firstRowSpan[firstRow] ?? "lg:col-span-4")
      : "lg:col-span-4";
  const lastAlone = total % 2 === 1 && index === total - 1;
  return lastAlone ? `${wide} md:col-span-2` : wide;
}

/** Game terms keep their capital, as the game writes them. */
const gameTerms = new Set([
  "Descendants",
  "Fellows",
  "Mutant Cells",
  "Amorphous Materials",
]);

/** "36 Descendants", "1 reactor": the category's name for counting. */
const countOf = (count: number, category: string) => {
  const plural = gameTerms.has(category) ? category : category.toLowerCase();
  const noun = plural.replace(/s$/, "");
  return `${numberFormat.format(count)} ${count === 1 ? noun : plural}`;
};

/** How many items of a category its card shows as art. */
const artCount = 4;

export default async function DatabasePage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0034); the search loads the same list as a static file.
  const items = await fetchDatabaseItems();
  const byCategory = new Map<string, DatabaseItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto grid max-w-3xl justify-items-center gap-4 px-4 pt-[calc(var(--site-header-height)+3.5rem)] pb-12 text-center lg:pt-[calc(var(--site-header-height)+5rem)]">
          <Badge variant="secondary">
            <Database aria-hidden="true" className="text-primary" />
            Database
          </Badge>
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Explore the database
            </ShinyText>
          </h1>
          <p className="max-w-xl hero-text">
            {items.length === 0
              ? "The database couldn't be loaded for this build. It comes back with the next one."
              : `Search all ${numberFormat.format(items.length)} Descendants, weapons, modules, reactors, external components, Fellows, vehicles, Mutant Cells, cosmetics and Amorphous Materials, or browse a category below.`}
          </p>
          <div className="w-full text-left">
            {/* The URL's search is read in the browser; the static HTML holds the
                empty search, the fallback (useSearchParams needs Suspense). */}
            <Suspense fallback={<DatabaseSearch search="" />}>
              <DatabaseSearchFromUrl />
            </Suspense>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="database-categories"
        className="mx-auto grid max-w-6xl gap-6 px-4 py-10"
      >
        <SectionHeader
          id="database-categories"
          icon={<LayoutGrid />}
          title="Browse by category"
          description="Each category has its own page, with filters and every detail."
        />
        {/* No space is left empty (T7SEN, 2026-10-17): see `cardSpan`. */}
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          {databaseCategories.map((category, index) => {
            const list = byCategory.get(category.name) ?? [];
            const Icon =
              sitePages.find((page) => page.href === category.href)?.icon ??
              Database;
            return (
              <li
                key={category.href}
                className={cardSpan(index, databaseCategories.length)}
              >
                <Link
                  href={category.href}
                  prefetch={
                    sitePages.find((page) => page.href === category.href)
                      ?.prefetch
                  }
                  className="group grid h-full content-start gap-4 rounded-2xl border bg-card/60 p-5 transition-colors outline-none hover:border-ring/60 hover:bg-card focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary [&>svg]:size-5"
                    >
                      <Icon />
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                    />
                  </div>
                  <div className="grid gap-1">
                    <h3 className="font-display text-xl font-semibold tracking-wide">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {countOf(list.length, category.name)}
                    </span>
                    <span aria-hidden="true" className="flex -space-x-2">
                      {/* An item with no art isn't shown (ADR 0035). */}
                      {list
                        .filter((item) => item.imageUrl !== "")
                        .slice(0, artCount)
                        .map((item) => (
                          <span
                            key={item.href}
                            className="grid size-10 place-items-center overflow-hidden rounded-lg border bg-card"
                            style={{
                              borderColor: `color-mix(in srgb, ${item.hex} 45%, var(--border))`,
                              backgroundImage: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${item.hex} 35%, transparent), color-mix(in srgb, ${item.hex} 8%, transparent) 75%)`,
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
                            <img
                              src={item.imageUrl}
                              alt=""
                              width={80}
                              height={80}
                              loading="lazy"
                              decoding="async"
                              className={`size-full ${artFit(item)}`}
                            />
                          </span>
                        ))}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
