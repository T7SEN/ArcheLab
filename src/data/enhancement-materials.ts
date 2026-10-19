/**
 * What the Enhancement Materials page needs beyond NEXON's `research.json` (ADR 0043):
 * each item's tier and description, which no keyless set has, from NEXON's Library
 * (https://tfd.nexon.com/en/library/enhancements, read 2026-10-17), in the game's order;
 * and the one count the game shows differently. T7SEN's screenshots of the game's
 * Research screen show the same 33 recipes for these 23 items, with the same tiers.
 * Notes: research_notes/TFD enhancement materials/.
 */

export interface EnhancementMaterialFacts {
  readonly name: string;
  /** NEXON's tier id: `Tier3` Ultimate, `Tier2` Rare, `Tier1` Normal. */
  readonly tier: "Tier1" | "Tier2" | "Tier3";
  /** The Library's description, as written. */
  readonly description: string;
}

const shapeStabilizer =
  "A solution that stabilizes and Shapes Amorphous Materials when a specific structural formula matches. When used while opening an Amorphous Material increases the Shaping Count further and allows for more effective Shaping than conventional Shape Stabilizers.";

/** Every enhancement material, in the game's order: Ultimate, Rare, then Normal. */
export const enhancementMaterials: readonly EnhancementMaterialFacts[] = [
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((form): EnhancementMaterialFacts => ({
    name: `Advanced Shape Stabilizer Form ${String(form)}`,
    tier: "Tier3",
    description: shapeStabilizer,
  })),
  {
    name: "Core Binder",
    tier: "Tier3",
    description:
      "A Core Binder used to unlock an equipment's Core Slot. Once combined with the Core, it harnesses the Descendant's Arche energy to maximize the target's performance. The basic materials needed for research must be obtained separately.",
  },
  {
    name: "Core Particle Disruptor",
    tier: "Tier3",
    description:
      "A device required to replace a mounted Core. It breaks down the particles in the Core, removes them, and allows for a new Core to be equipped.",
  },
  {
    name: "Crystallization Catalyst",
    tier: "Tier3",
    description:
      "A catalyst with the property of absorbing and crystallizing various energy sources. Resets the target's level and can be used to assign socket types to modules upon use.",
  },
  {
    name: "Dimension Analyzer",
    tier: "Tier3",
    // The Library gives it Precise Ion Accelerator's text.
    description:
      "A rare device that can enhance Ultimate Reactors. It dramatically increases the response speed of objects through ion acceleration.",
  },
  {
    name: "Energy Activators",
    tier: "Tier3",
    description:
      "A mechanism that reacts to Arche and Ecive. It amplifies the energy supplied to a Module Socket.",
  },
  {
    name: "Refined Axium Crystal",
    tier: "Tier3",
    description:
      "A crystal used to unlock the Arche Trigger of Descendants. This crystal is refined from Void Axium using Kuiper Shards and a specialized processing method. Despite significant energy loss during the refining process, it has the advantage of stable interaction with the Descendants' Arche.",
  },
  {
    name: "Ultimate Protein Compound",
    tier: "Tier3",
    description:
      "A special nutritional supplement that can level up your Fellow. Significantly enhances your Fellow's overall abilities.",
  },
  {
    name: "Fine Adjustment Control Axis",
    tier: "Tier2",
    description:
      "An axis that controls the properties of Ultimate Firearms. It boasts precise performance, allowing for nanometer-scale fine adjustments.",
  },
  {
    name: "Precise Ion Accelerator",
    tier: "Tier2",
    description:
      "A rare device that can enhance Ultimate Reactors. It dramatically increases the response speed of objects through ion acceleration.",
  },
  {
    name: "Precision Phase Exchanger",
    tier: "Tier2",
    description:
      "A specialized device that can replace the level of Ultimate Firearms through Transmission. It possesses the ability to simultaneously calculate and process multiple Phases using Magister's technology.",
  },
  {
    name: "Special Synthetic Calcium",
    tier: "Tier2",
    description:
      "A special nutritional supplement that can level up your Fellow. Enhances your Fellow's musculoskeletal system.",
  },
  {
    name: "Adjustment Control Axis",
    tier: "Tier1",
    description:
      "An axis that controls the properties of Common and Rare firearms. Helps control the unique characteristics of firearms.",
  },
  {
    name: "Fortified Supplement",
    tier: "Tier1",
    description:
      "A special nutritional supplement that can level up your Fellow. Slightly enhances your Fellow's basic physical abilities.",
  },
  {
    name: "Ion Accelerator",
    tier: "Tier1",
    description:
      "A unique equipment that can enhance Common and Rare Reactors. Accelerates ions to significantly increase an object's response time.",
  },
  {
    name: "Phase Exchanger",
    tier: "Tier1",
    description:
      "A specialized device that can replace the level of Common and Rare Firearms through Transmission. It utilizes the advanced technology of the Magisters who manipulate Phase.",
  },
];

/**
 * Counts the game asks for that NEXON's data gives differently: a research's result, an
 * ingredient and the game's count. Core Binder needs 20,000 Void Abyss Metal Fragments
 * in game (T7SEN's screenshot, 2026-10-17); `research.json` and the Library say 2,000.
 */
export const ingredientCounts: readonly {
  readonly result: string;
  readonly ingredient: string;
  readonly count: number;
}[] = [
  {
    result: "Core Binder",
    ingredient: "Void Abyss Metal Fragment",
    count: 20_000,
  },
];
