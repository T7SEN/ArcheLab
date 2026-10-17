import { ChevronDown, Clock } from "lucide-react";
import type { Recipe, RecipeItem } from "@/lib/nexon/recipe";
import { formatDuration } from "./duration";

const numberFormat = new Intl.NumberFormat("en-US");

/** A research's time, then its currency costs. */
function Costs({ recipe }: { recipe: Recipe }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Clock aria-hidden="true" className="size-3.5" />
        {formatDuration(recipe.time)}
      </span>
      {recipe.costs.length === 0 ? null : (
        <span className="font-mono">
          {recipe.costs
            .map(
              (cost) => `${numberFormat.format(cost.value)} ${cost.currency}`,
            )
            .join(" + ")}
        </span>
      )}
    </span>
  );
}

function ItemImage({ src, size }: { src: string; size: "lg" | "sm" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
    <img
      src={src}
      alt=""
      width={size === "lg" ? 56 : 32}
      height={size === "lg" ? 56 : 32}
      loading="lazy"
      decoding="async"
      className={`${size === "lg" ? "size-12" : "size-8"} shrink-0 rounded-lg bg-background/60 object-contain ring-1 ring-border`}
    />
  );
}

function Ingredient({ item }: { item: RecipeItem }) {
  return (
    <li className="flex items-center gap-3">
      <ItemImage src={item.imageUrl} size="sm" />
      <span className="grid min-w-0 flex-1">
        <span className="text-sm">{item.name}</span>
        {item.from.map((source) => (
          <span key={source.name} className="text-xs text-muted-foreground">
            From {source.name}
          </span>
        ))}
      </span>
      <span className="font-mono text-sm text-muted-foreground tabular-nums">
        ×{numberFormat.format(item.count)}
      </span>
    </li>
  );
}

/**
 * How the Descendant is researched, from NEXON's research data (ADR 0023): the
 * research's time and cost, then each item it needs. A part that is itself researched opens to
 * show its own recipe; an item that comes from an Amorphous Material names it.
 */
export function ResearchRecipe({
  name,
  recipe,
}: {
  name: string;
  recipe: Recipe;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border bg-card/60 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-display text-xl font-semibold tracking-wide">
          Research {name}
        </h3>
        <Costs recipe={recipe} />
      </div>
      <ul className="grid items-start gap-3 md:grid-cols-2">
        {recipe.items.map((item) => (
          <li
            key={item.name}
            className="grid content-start gap-3 rounded-xl border bg-background/40 p-4"
          >
            <div className="flex items-center gap-3">
              <ItemImage src={item.imageUrl} size="lg" />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="font-medium">{item.name}</span>
                {item.from.map((source) => (
                  <span
                    key={source.name}
                    className="text-xs text-muted-foreground"
                  >
                    From {source.name}
                  </span>
                ))}
              </div>
              <span className="font-mono text-sm text-muted-foreground tabular-nums">
                ×{numberFormat.format(item.count)}
              </span>
            </div>
            {item.recipe === null ? null : (
              <details className="group rounded-lg border bg-card/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  <span>How it&apos;s researched</span>
                  <span className="flex items-center gap-2">
                    <Costs recipe={item.recipe} />
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </span>
                </summary>
                <ul className="grid gap-2 border-t px-3 py-3">
                  {item.recipe.items.map((ingredient) => (
                    <Ingredient key={ingredient.name} item={ingredient} />
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
