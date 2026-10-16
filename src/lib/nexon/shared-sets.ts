import "server-only";
import { z } from "zod";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";

/**
 * The NEXON sets both the Descendant and the weapon pages read (ADR 0023, ADR 0024):
 * stat names, research recipes and materials. Each is fetched once per build worker,
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

export type StatRecord = z.infer<typeof statSchema>;
export type ResearchRecord = z.infer<typeof researchSchema>;
export type MaterialRecord = z.infer<typeof materialSchema>;

let statsPromise: Promise<StatRecord[]> | null = null;
let researchPromise: Promise<ResearchRecord[]> | null = null;
let materialsPromise: Promise<MaterialRecord[]> | null = null;

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
