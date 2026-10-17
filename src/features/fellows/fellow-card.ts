import {
  fellowLevelFacts,
  fellowPassives,
  type FellowEffect,
  type FellowPassive,
} from "@/data/fellows";
import type { Recipe } from "@/lib/nexon/recipe";

/**
 * A Fellow as the page shows it (ADR 0035): plain data the server page hands the cards,
 * with its tier's name and color from the chat registry and its facts from
 * `src/data/fellows.ts`. Pure, for the browser and the tests.
 */
export interface FellowCard {
  readonly slug: string;
  readonly name: string;
  readonly tierName: string;
  readonly hex: string;
  /** Its art (`fellowArt`), or null for a Fellow it doesn't have. */
  readonly imageUrl: string | null;
  /** Its passive (`fellowPassiveOf`, confirmed in game by T7SEN). */
  readonly passive: FellowPassive | null;
  /** NEXON's stats at each level, in level order. */
  readonly levels: readonly {
    readonly level: number;
    readonly stats: readonly {
      readonly name: string;
      readonly value: number;
    }[];
  }[];
  /** The Inversion Reinforcement effect that needs this Fellow equipped. */
  readonly effect: FellowEffect | null;
  readonly research: Recipe | null;
}

/** The URL query's key for the open Fellow: `/fellows?fellow=<slug>`. */
export const fellowParam = "fellow";

/** The Fellow the URL query opens, when it names one of `slugs`. */
export function openFellow(
  search: string,
  slugs: readonly string[],
): string | null {
  const slug = new URLSearchParams(search).get(fellowParam);
  return slug !== null && slugs.includes(slug) ? slug : null;
}

/** The URL query with `slug` open, or none. */
export function fellowSearch(slug: string | null): string {
  return slug === null ? "" : `?${fellowParam}=${slug}`;
}

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

/** A ratio as a percentage: 0.358 is 35.8%. */
const percent = (value: number) => `${numberFormat.format(value * 100)}%`;
const seconds = (value: number) => `${numberFormat.format(value)}s`;

/**
 * A Fellow's numbers at a level: NEXON's stats, then the Update 1.4.0 notes'
 * Auto-Dismantle Cycle and its passive's interval and ratio. A level the notes don't
 * have shows NEXON's alone. The card shows them at the top level.
 */
export function fellowNumbersAt(
  card: FellowCard,
  level: number | undefined,
): { readonly name: string; readonly value: string }[] {
  const current = card.levels.find((entry) => entry.level === level);
  const facts = fellowLevelFacts.find((row) => row.level === level);
  const passive = card.passive === null ? null : fellowPassives[card.passive];
  const passiveLevel =
    card.passive === null ? undefined : facts?.passives[card.passive];
  return [
    ...(current?.stats ?? []).map((stat) => ({
      name: stat.name,
      value: percent(stat.value),
    })),
    ...(facts === undefined
      ? []
      : [
          {
            name: "Auto-Dismantle Cycle",
            value: seconds(facts.autoDismantleCycle),
          },
        ]),
    ...(passive === null || passiveLevel === undefined
      ? []
      : [
          { name: passive.interval, value: seconds(passiveLevel.interval) },
          { name: passive.ratio, value: percent(passiveLevel.ratio) },
        ]),
  ];
}
