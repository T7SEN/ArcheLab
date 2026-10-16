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
  stat_id: numericId,
  stat_name: z.string().min(1),
  stat_order_no: z.number(),
});

const amount = z.object({
  currency_type: z.string().min(1),
  currency_value: z.number(),
});

export const researchSchema = z.object({
  research_name: z.string().min(1),
  research_type: z.string().min(1),
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

export type StatRecord = z.infer<typeof statSchema>;
export type ResearchRecord = z.infer<typeof researchSchema>;
export type MaterialRecord = z.infer<typeof materialSchema>;
export type ModuleRecord = z.infer<typeof moduleSchema>;

let statsPromise: Promise<StatRecord[]> | null = null;
let researchPromise: Promise<ResearchRecord[]> | null = null;
let materialsPromise: Promise<MaterialRecord[]> | null = null;
let modulesPromise: Promise<ModuleRecord[]> | null = null;

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

/** `consumable-material.json`: material names, images and where they come from. */
export function fetchMaterials(): Promise<MaterialRecord[]> {
  materialsPromise ??= fetchMetadataSet("consumable-material", materialSchema);
  return materialsPromise;
}

/** `module.json`: every module, with its capacity and effect at each level. */
export function fetchModules(): Promise<ModuleRecord[]> {
  modulesPromise ??= fetchMetadataSet("module", moduleSchema);
  return modulesPromise;
}
