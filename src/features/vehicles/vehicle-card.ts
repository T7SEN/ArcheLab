import type { Recipe } from "@/lib/nexon/recipe";

/**
 * A vehicle as the page shows it (ADR 0037): plain data the server page hands the
 * cards, with its tier's name and color from the chat registry. Pure, for the browser
 * and the tests.
 */
export interface VehicleCard {
  readonly slug: string;
  readonly name: string;
  /** NEXON's line for it: "Speed Hover Bike, Vortex". */
  readonly description: string;
  readonly tierName: string;
  readonly hex: string;
  readonly imageUrl: string;
  /** The stats that don't change with its level. */
  readonly stats: readonly VehicleStatValue[];
  /** The stats that do, at each level, in level order. */
  readonly levels: readonly {
    readonly level: number;
    readonly stats: readonly VehicleStatValue[];
  }[];
  readonly research: Recipe | null;
}

export interface VehicleStatValue {
  readonly name: string;
  readonly value: number;
}

/**
 * What kind of vehicle it is, from NEXON's line: "Speed Hover Bike, Vortex" is a
 * "Speed Hover Bike". A line that doesn't end with the name stays whole.
 */
export function vehicleKind(vehicle: {
  readonly name: string;
  readonly description: string;
}): string {
  const tail = `, ${vehicle.name}`;
  return vehicle.description.endsWith(tail)
    ? vehicle.description.slice(0, -tail.length)
    : vehicle.description;
}

/** The URL query's key for the open vehicle: `/vehicles?vehicle=<slug>`. */
export const vehicleParam = "vehicle";

/** The vehicle the URL query opens, when it names one of `slugs`. */
export function openVehicle(
  search: string,
  slugs: readonly string[],
): string | null {
  const slug = new URLSearchParams(search).get(vehicleParam);
  return slug !== null && slugs.includes(slug) ? slug : null;
}

/** The URL query with `slug` open, or none. */
export function vehicleSearch(slug: string | null): string {
  return slug === null ? "" : `?${vehicleParam}=${slug}`;
}

/**
 * ArcheLab's grouping of NEXON's vehicle stats by what they do on the bike (as
 * `stat-groups.ts` groups weapon stats), in this order. A stat NEXON adds later goes
 * under Other.
 */
export const vehicleStatGroups: readonly {
  readonly title: string;
  readonly names: readonly string[];
}[] = [
  {
    title: "Speed",
    names: [
      "Max Speed",
      "Acceleration",
      "Max Speed on Boost",
      "Acceleration on Boost",
      "Reverse Movement Speed Modifier",
      "Lateral Movement Speed Modifier",
    ],
  },
  {
    title: "Turning",
    names: ["Turning Power", "Turning Power during Boost"],
  },
  {
    title: "Boost",
    names: [
      "Boost Gauge Capacity",
      "Boost Cost",
      "Boost Gauge Recovery Amount",
      "Boost Gauge Recovery Interval",
      "Boost Gauge Recovery Start Delay",
    ],
  },
];

/** A vehicle's stats at a level, in their groups, each group in its own order. */
export function groupVehicleStats(
  stats: readonly VehicleStatValue[],
): { readonly title: string; readonly stats: readonly VehicleStatValue[] }[] {
  const placed = new Set(vehicleStatGroups.flatMap((group) => group.names));
  const byName = new Map(stats.map((stat) => [stat.name, stat]));
  const groups = vehicleStatGroups.map((group) => ({
    title: group.title,
    stats: group.names.flatMap((name) => {
      const stat = byName.get(name);
      return stat === undefined ? [] : [stat];
    }),
  }));
  const other = stats.filter((stat) => !placed.has(stat.name));
  return [...groups, { title: "Other", stats: other }].filter(
    (group) => group.stats.length > 0,
  );
}

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

/**
 * A stat's value as the details show it: a Modifier, a fraction, as a percentage
 * (0.25 is 25%); anything else as NEXON gives it, with no unit, since NEXON gives none.
 */
export function formatVehicleStat(stat: VehicleStatValue): string {
  return stat.name.endsWith("Modifier")
    ? `${numberFormat.format(stat.value * 100)}%`
    : numberFormat.format(stat.value);
}

/** The four numbers a vehicle's card shows (T7SEN, 2026-10-17), in this order. */
export const vehicleKeyStatNames: readonly string[] = [
  "Max Speed",
  "Max Speed on Boost",
  "Turning Power",
  "Boost Gauge Capacity",
];

/** A vehicle's key numbers at its top level, as its card shows them. */
export function vehicleKeyStats(
  card: VehicleCard,
): { readonly name: string; readonly value: string }[] {
  const all = [...(card.levels.at(-1)?.stats ?? []), ...card.stats];
  return vehicleKeyStatNames.flatMap((name) => {
    const stat = all.find((entry) => entry.name === name);
    return stat === undefined ? [] : [{ name, value: formatVehicleStat(stat) }];
  });
}
