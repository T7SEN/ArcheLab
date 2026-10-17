import "server-only";
import { z } from "zod";
import { slugOf } from "@/lib/slug";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";
import {
  recipeFor,
  researchFor,
  type Recipe,
  type ResearchSets,
} from "./recipe";
import {
  fetchMaterials,
  fetchResearch,
  fetchStats,
  numericId,
  type StatRecord,
} from "./shared-sets";

/**
 * The Vehicles index (ADR 0037): every vehicle in `vehicle.json`, with its stats named
 * from `stat.json` and its research recipe. NEXON listed 3 hover bikes on 2026-10-17,
 * each with art, a description, nine stats that stay the same and four that grow over
 * levels 1 to 20.
 */

const statSchema = z.object({ stat_id: numericId, stat_value: z.number() });

const vehicleSchema = z.object({
  vehicle_id: numericId,
  vehicle_name: z.string().min(1),
  vehicle_description: z.string(),
  vehicle_tier_id: z.string().regex(/^Tier\d+$/),
  image_url: nexonImageUrl,
  stat_effect: z.array(statSchema),
  stat_effect_per_level: z
    .array(
      z.object({
        vehicle_level: z.number().int().positive(),
        stat_effect: z.array(statSchema),
      }),
    )
    .min(1),
});

export type VehicleRecord = z.infer<typeof vehicleSchema>;

/** A stat: its name from `stat.json`, its value as NEXON gives it. */
export interface VehicleStat {
  readonly name: string;
  readonly value: number;
}

export interface VehicleLevel {
  readonly level: number;
  readonly stats: readonly VehicleStat[];
}

export interface VehicleGroup {
  /** NEXON's vehicle id. */
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  /** NEXON's line for it: "Speed Hover Bike, Vortex". */
  readonly description: string;
  /** NEXON's tier id, such as `Tier2`. */
  readonly tier: string;
  readonly imageUrl: string;
  /** The stats that don't change with its level, in NEXON's order. */
  readonly stats: readonly VehicleStat[];
  /** The stats that do, at each level, in level order. */
  readonly levels: readonly VehicleLevel[];
  /** Its `Vehicle` research, when NEXON lists one (GLIDE-4 has none). */
  readonly research: Recipe | null;
}

/**
 * Each vehicle with its stats named and its levels in order; a stat `stat.json` doesn't
 * name is left out. In NEXON's order, by id.
 */
export function vehicleGroups(
  vehicles: readonly VehicleRecord[],
  stats: readonly StatRecord[],
  sets: ResearchSets,
): VehicleGroup[] {
  const statNames = new Map(
    stats.map((stat) => [stat.stat_id, stat.stat_name]),
  );
  const named = (effects: readonly z.infer<typeof statSchema>[]) =>
    effects.flatMap((effect) => {
      const name = statNames.get(effect.stat_id);
      return name === undefined ? [] : [{ name, value: effect.stat_value }];
    });
  return [...vehicles]
    .sort((a, b) =>
      a.vehicle_id.localeCompare(b.vehicle_id, "en", { numeric: true }),
    )
    .map((vehicle) => ({
      id: vehicle.vehicle_id,
      slug: slugOf(vehicle.vehicle_name),
      name: vehicle.vehicle_name,
      description: vehicle.vehicle_description,
      tier: vehicle.vehicle_tier_id,
      imageUrl: vehicle.image_url,
      stats: named(vehicle.stat_effect),
      levels: [...vehicle.stat_effect_per_level]
        .sort((a, b) => a.vehicle_level - b.vehicle_level)
        .map((level) => ({
          level: level.vehicle_level,
          stats: named(level.stat_effect),
        })),
      research: recipeFor(
        researchFor(sets.research, "Vehicle", "vehicle_id", vehicle.vehicle_id),
        sets,
      ),
    }));
}

let groupsPromise: Promise<VehicleGroup[]> | null = null;

/** Every vehicle, fetched once per build worker; none when NEXON can't be reached. */
export function fetchVehicles(): Promise<VehicleGroup[]> {
  groupsPromise ??= Promise.all([
    fetchMetadataSet("vehicle", vehicleSchema),
    fetchStats(),
    fetchResearch(),
    fetchMaterials(),
  ]).then(([vehicles, stats, research, materials]) =>
    vehicleGroups(vehicles, stats, { research, materials }),
  );
  return groupsPromise;
}
