import "server-only";
import { z } from "zod";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";

/**
 * The NEXON sets more than one page reads (ADR 0023, ADR 0024, ADR 0025): stat names,
 * research recipes and materials for Descendant and weapon pages, and modules for
 * Descendant pages and the modules index. Each is fetched once per build worker,
 * however many pages use it, and each schema reads only the fields the pages use.
 */

/** NEXON's ids are digit strings. */
export const numericId = z.string().regex(/^\d+$/);

export const statSchema = z.object({
  // A stat named for one Descendant joins the Descendant's id: "105000109:101000002",
  // Max Void Energy (ten of them, checked 2026-10-18; no set uses them yet).
  stat_id: z.string().regex(/^\d+(:\d+)?$/),
  stat_name: z.string().min(1),
});

const amount = z.object({
  currency_type: z.string().min(1),
  currency_value: z.number(),
});

export const researchSchema = z.object({
  research_name: z.string().min(1),
  research_type: z.string().min(1),
  /** In seconds (T7SEN checked Raven's in game, 2026-10-17). */
  research_time: z.number().nonnegative(),
  research_cost: z.array(amount),
  research_result: z.array(
    z.object({ meta_type: z.string(), meta_id: numericId }),
  ),
  research_material: z.array(
    z.object({
      meta_type: z.string(),
      meta_id: numericId,
      material_count: z.number().int().positive(),
    }),
  ),
});

export const materialSchema = z.object({
  consumable_material_id: numericId,
  consumable_material_name: z.string().min(1),
  image_url: nexonImageUrl,
  acquisition_detail: z.array(z.string()),
  // Only the Amorphous Materials index reads these two (ADR 0041).
  material_type: z.string().optional(),
  /** What an Amorphous Material Pattern opens into: `amorphous-reward.json` ids. */
  amorphous_reward: z.array(numericId).optional(),
});

export const moduleSchema = z.object({
  module_id: numericId,
  module_name: z.string().min(1),
  image_url: nexonImageUrl,
  module_type: z.string().min(1).nullable(),
  module_tier_id: z.string().regex(/^Tier\d+$/),
  module_socket_type: z.string().min(1).nullable(),
  // Only the modules index reads these two. A change to them leaves that module off
  // the index (`moduleGroups`) without taking it off its Descendant's page.
  module_class: z.string().min(1).nullable().catch(null),
  available_weapon_type: z.array(z.string().min(1)).nullable().catch(null),
  available_descendant_id: z.array(numericId),
  available_module_slot_type: z.array(z.string().min(1)),
  module_stat: z.array(
    z.object({
      level: z.number().int().nonnegative(),
      // Null for Trigger modules, which take no capacity (2026-10-16).
      module_capacity: z.number().nullable(),
      value: z.string().nullable(),
    }),
  ),
});

/** `acquisition-detail.json`: the names of the places items come from (ADR 0041). */
export const acquisitionSchema = z.object({
  acquisition_detail_id: z.string().min(1),
  acquisition_detail_name: z.string().min(1),
});

export type StatRecord = z.infer<typeof statSchema>;
export type ResearchRecord = z.infer<typeof researchSchema>;
export type MaterialRecord = z.infer<typeof materialSchema>;
export type ModuleRecord = z.infer<typeof moduleSchema>;
export type AcquisitionRecord = z.infer<typeof acquisitionSchema>;

let statsPromise: Promise<StatRecord[]> | null = null;
let researchPromise: Promise<ResearchRecord[]> | null = null;
let materialsPromise: Promise<MaterialRecord[]> | null = null;
let modulesPromise: Promise<ModuleRecord[]> | null = null;
let acquisitionsPromise: Promise<AcquisitionRecord[]> | null = null;

/** `stat.json`: stat names by id. */
export function fetchStats(): Promise<StatRecord[]> {
  statsPromise ??= fetchMetadataSet("stat", statSchema);
  return statsPromise;
}

/** `research.json`: every research recipe. */
export function fetchResearch(): Promise<ResearchRecord[]> {
  researchPromise ??= fetchMetadataSet("research", researchSchema);
  return researchPromise;
}

/**
 * `consumable-material.json` as NEXON sends it: some items have no art (event tokens,
 * EX-P serums and a storage slot, 13 on 2026-10-18).
 */
const materialEntrySchema = materialSchema.extend({
  image_url: nexonImageUrl.nullable(),
});

/**
 * `consumable-material.json`: material names, images and where they come from. Items
 * without art are left out, since every page that lists materials shows their art; one
 * that also names a place to find it is said in the build's log, as a page would have
 * shown it.
 */
export function fetchMaterials(): Promise<MaterialRecord[]> {
  materialsPromise ??= fetchMetadataSet(
    "consumable-material",
    materialEntrySchema,
  ).then((entries) => {
    const drawn = entries.filter(
      (entry): entry is MaterialRecord => entry.image_url !== null,
    );
    const placed = entries.filter(
      (entry) =>
        entry.image_url === null && entry.acquisition_detail.length > 0,
    );
    if (placed.length > 0) {
      console.warn(
        `NEXON consumable-material.json: ${String(placed.length)} items with places to find them have no art and were left out: ${placed.map((entry) => entry.consumable_material_name).join(", ")}.`,
      );
    }
    return drawn;
  });
  return materialsPromise;
}

/** `acquisition-detail.json`: where items come from, by the ids materials list. */
export function fetchAcquisitions(): Promise<AcquisitionRecord[]> {
  acquisitionsPromise ??= fetchMetadataSet(
    "acquisition-detail",
    acquisitionSchema,
  );
  return acquisitionsPromise;
}

/**
 * NEXON's acquisition names with their bracket padding and doubled spaces gone:
 * "[Kingston] [Normal]", "[Ultimate Equipment Research - 4]".
 */
export function sourceText(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .replace(/\[\s+/g, "[")
    .replace(/\s+\]/g, "]")
    .trim();
}

/** `module.json`: every module, with its capacity and effect at each level. */
export function fetchModules(): Promise<ModuleRecord[]> {
  modulesPromise ??= fetchMetadataSet("module", moduleSchema);
  return modulesPromise;
}
