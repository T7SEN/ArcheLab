import "server-only";
import { shapeStabilizerName } from "@/data/amorphous-materials";
import { basicMaterials } from "@/data/basic-materials";
import { miscellaneousItems } from "@/data/miscellaneous";
import { slugOf } from "@/lib/slug";
import type { MaterialRecord, ResearchRecord } from "./shared-sets";

/**
 * Which materials have a page of their own, and where (ADR 0045, ADR 0047, ADR 0050):
 * the basic materials (`src/data/basic-materials.ts`), the Core Materials, the parts
 * NEXON's research data takes to make Descendants, weapons, Fellows, vehicles and
 * Enhancement Materials, and the Miscellaneous items (`src/data/miscellaneous.ts`).
 * Research recipes, the Amorphous Materials page and drop lists link them.
 */

const basicIds: ReadonlySet<string> = new Set(
  basicMaterials.map((material) => material.id),
);

/**
 * The Miscellaneous items' NEXON ids, but Transcendent Weapon Loot's: drop lists link
 * it to the Weapons page's Transcendent filter, for what it gives (T7SEN, 2026-10-18;
 * ADR 0049).
 */
const miscellaneousIds: ReadonlySet<string> = new Set(
  miscellaneousItems
    .filter((item) => item.name !== "Transcendent Weapon Loot")
    .flatMap((item) => item.ids),
);

/** Research that makes a Descendant, weapon, Fellow or vehicle, or one of their parts. */
const buildResearch: ReadonlySet<string> = new Set([
  "Character",
  "Equipment",
  "Fellow",
  "Vehicle",
  "CharacterMaterial",
  "EquipmentMaterial",
  "FellowMaterial",
  "VehicleMaterial",
]);

const coreCache = new WeakMap<readonly ResearchRecord[], ReadonlySet<string>>();

/**
 * The Core Materials' NEXON ids: every material other than a basic material that build
 * research takes, and every research material (`material_type`) Enhancement Material
 * research takes, which are their Blueprints. 469 on 2026-10-18, matching NEXON's
 * Library's Core Material list but for three Hagios Sheepdog Blueprints no research
 * takes.
 */
export function coreMaterialIds(
  research: readonly ResearchRecord[],
  materials: readonly MaterialRecord[],
): ReadonlySet<string> {
  const cached = coreCache.get(research);
  if (cached !== undefined) {
    return cached;
  }
  const types = new Map(
    materials.map((material) => [
      material.consumable_material_id,
      material.material_type,
    ]),
  );
  const ids = new Set<string>();
  for (const entry of research) {
    for (const input of entry.research_material) {
      if (basicIds.has(input.meta_id)) {
        continue;
      }
      if (
        buildResearch.has(entry.research_type) ||
        (entry.research_type === "UpgradeMaterial" &&
          types.get(input.meta_id) === "ResearchMaterial")
      ) {
        ids.add(input.meta_id);
      }
    }
  }
  coreCache.set(research, ids);
  return ids;
}

const stabilizerCache = new WeakMap<
  readonly MaterialRecord[],
  ReadonlySet<string>
>();

/** The regular Shape Stabilizers' NEXON ids, which the Amorphous Materials page shows. */
function stabilizerIds(
  materials: readonly MaterialRecord[],
): ReadonlySet<string> {
  const cached = stabilizerCache.get(materials);
  if (cached !== undefined) {
    return cached;
  }
  const ids = new Set(
    materials
      .filter(
        (material) =>
          material.material_type === "ShapeStabilizer" &&
          shapeStabilizerName.test(material.consumable_material_name),
      )
      .map((material) => material.consumable_material_id),
  );
  stabilizerCache.set(materials, ids);
  return ids;
}

/**
 * A material's page, or null: `/basic-materials?material=<slug>` for a basic material,
 * `/core-materials?material=<slug>` for a Core Material,
 * `/amorphous-materials?stabilizer=<slug>` for a regular Shape Stabilizer, and
 * `/miscellaneous?item=<slug>` for a Miscellaneous item (T7SEN, 2026-10-18).
 */
export function materialHref(
  id: string,
  name: string,
  sets: {
    readonly research: readonly ResearchRecord[];
    readonly materials: readonly MaterialRecord[];
  },
): string | null {
  if (basicIds.has(id)) {
    return `/basic-materials?material=${slugOf(name)}`;
  }
  if (stabilizerIds(sets.materials).has(id)) {
    return `/amorphous-materials?stabilizer=${slugOf(name)}`;
  }
  if (miscellaneousIds.has(id)) {
    return `/miscellaneous?item=${slugOf(name)}`;
  }
  return coreMaterialIds(sets.research, sets.materials).has(id)
    ? `/core-materials?material=${slugOf(name)}`
    : null;
}
