/**
 * The Basic Materials page's list (T7SEN, 2026-10-18; ADR 0045): the 65 materials on
 * the game's inventory Basic tab, from T7SEN's screenshots, in the game's order (highest
 * tier first, then newest first). NEXON's `consumable-material.json` files them with
 * every other research material, so the list is kept here, by NEXON id; each one's
 * tier and description come from NEXON's Library
 * (https://tfd.nexon.com/en/library/consumable?consumables=basic, read 2026-10-18),
 * which lists the same 65 with the same tiers as the screenshots. Notes:
 * research_notes/TFD basic materials/.
 */

export interface BasicMaterialFacts {
  /** NEXON's material id. */
  readonly id: string;
  readonly name: string;
  /** NEXON's tier id: `Tier3` Ultimate, `Tier2` Rare, `Tier1` Normal. */
  readonly tier: "Tier1" | "Tier2" | "Tier3";
  /** The Library's description, as written. */
  readonly description: string;
}

/** Every basic material, in the game's order: Ultimate, Rare, then Normal. */
export const basicMaterials: readonly BasicMaterialFacts[] = [
  {
    id: "263131001",
    name: "Transcendent Trait Element",
    tier: "Tier3",
    description:
      "A rare material obtained by dismantling Transcendent Weapons. When a weapon is dismantled, it loses its original form and is extracted in the form of microscopic trait elements. Weapon developers are researching entirely new operating principles by reverse-engineering the unique Arche patterns of Transcendent Weapons imprinted on these elements.",
  },
  {
    id: "263060054",
    name: "Superheated Material",
    tier: "Tier3",
    description:
      "A rare material used to reset the Readjustment count of Ancestors Modules. It artificially applies heat to the cryogenic Ancestors Module to erase the imprinted factor information.",
  },
  {
    id: "262070003",
    name: "Superconductive Cooling Unit",
    tier: "Tier3",
    description:
      "A rare material required for Ancestors Module Readjustment. An essential material for cooling the heat generated during readjustment. It utilizes cryogenic superconductivity technology to cool objects.",
  },
  {
    id: "261511013",
    name: "Archive Shard",
    tier: "Tier3",
    description:
      "A material used for research. A highly concentrated data formed over a long period of time. Collecting and researching these fragments of Amorphous Material will yield a key to knowledge that can unlock the vast data of Ingris.",
  },
  {
    id: "262522001",
    name: "Supersaturated Solution",
    tier: "Tier2",
    description:
      "A rare material used in the creation of Advanced Shape Stabilizers. A solution made by slowly cooling Void impurities, it has the ability to morph into a specific shape when stimulated.",
  },
  {
    id: "261521230",
    name: "Phase-Tuned Crystal",
    tier: "Tier2",
    description:
      "A rare material used for research. A unique crystal that self-tunes its phase with the subtle vibrational frequencies of the Void Dimension, thereby establishing a stable connection between real space and Arche.",
  },
  {
    id: "261521229",
    name: "Complex Filament Seed",
    tier: "Tier2",
    description:
      "A rare material used for research. Made from a base of Colossus organic matter through a complex process of fusion and mutation with various substances and energy.",
  },
  {
    id: "261521228",
    name: "Xeno Fluid",
    tier: "Tier2",
    description:
      "A rare material used for research. A special solution believed to have arrived from outer space along with a meteorite, this organic matter exhibits the characteristics of a colony.",
  },
  {
    id: "261521227",
    name: "Dimensional Spectral Prism",
    tier: "Tier2",
    description:
      "A rare material used for research. This substance helps capture the faint light of a dimension that cannot be observed through normal means by splitting it into multiple spectrums and converting it into data.",
  },
  {
    id: "261521226",
    name: "Kuiper Bio Adhesive",
    tier: "Tier2",
    description:
      "A rare material used for research. This new adhesive combines organic matter and metal particles at the molecular level using Kuiper processing technology.",
  },
  {
    id: "261521225",
    name: "Frozen Gas Crystal",
    tier: "Tier2",
    description:
      "A rare material used for research. This rare ore is formed when different gases become trapped within water molecules and crystallize like ice in the low-temperature, high-pressure environment of the deep sea.",
  },
  {
    id: "261521224",
    name: "Amorphous Alloy Steel",
    tier: "Tier2",
    description:
      "A rare material used for research. An alloy with an irregular atomic arrangement like glass, it has much higher strength and elasticity than standard metals. It can even be fused with organic matter.",
  },
  {
    id: "261521223",
    name: "Writhing Organic Matter",
    tier: "Tier2",
    description:
      "A rare material used for research. Organic Matter forcibly cultured by extracting genetic material from various flora and fauna, capable of imparting the desired biological characteristics.",
  },
  {
    id: "261521221",
    name: "Photon Quantum Crystal",
    tier: "Tier2",
    description:
      "A rare material used for research. This crystalline structure controls the interference and refraction of light and is used in a range of optical equipment and energy reactions.",
  },
  {
    id: "261521220",
    name: "Entropium",
    tier: "Tier2",
    description:
      "A rare material used for research. This crystal of collapsed Dimensional Energy is created during events of peak entropy, such as the appearance of a super-sized Colossus.",
  },
  {
    id: "261521219",
    name: "Kerasid",
    tier: "Tier2",
    description:
      "A rare material used for research. A chitinous material from creatures that inhabit the Axion Plains, altered by long exposure to Void Energy.",
  },
  {
    id: "261521218",
    name: "Silentra",
    tier: "Tier2",
    description:
      "A rare material used for research. This rare fiber, found only in a certain area, has many applications due to its excellent ability to absorb waves and energy.",
  },
  {
    id: "261521217",
    name: "Breach Stone Shard",
    tier: "Tier2",
    description:
      "A rare material used for research. Although it is a byproduct formed when a Breach appears in the Dimensional Wall, each small crystal contains a tremendous amount of Void Energy.",
  },
  {
    id: "261521216",
    name: "Furinite",
    tier: "Tier2",
    description:
      "A rare material used for research. This gemstone is created when high-density energy is compressed and trapped in a carbon crystal, making it exceptionally strong.",
  },
  {
    id: "261521213",
    name: "Veildust",
    tier: "Tier2",
    description:
      "A rare material used for research. A specialized material obtained by refining shards of eroded debris that has been weathered by long periods of Void Storms.",
  },
  {
    id: "261521205",
    name: "Quantum Incubator",
    tier: "Tier2",
    description:
      "An object left behind by the ancient Architects. It's confirmed to be a device used to grow something.",
  },
  {
    id: "261521201",
    name: "Polyatomic Ion Particle",
    tier: "Tier2",
    description:
      "A rare material used for research. A recently discovered ion particle formed with multiple particles and is used for creating various devices.",
  },
  {
    id: "261521199",
    name: "Heat Plasma Battery",
    tier: "Tier2",
    description:
      "A rare material used for research. A battery created by making a convertor substance into a plasma. It contains ample energy despite its size.",
  },
  {
    id: "261521193",
    name: "Advanced Neural Circuit",
    tier: "Tier2",
    description:
      "A rare material used for research. A processor that's vastly more advanced than a common neural circuit.",
  },
  {
    id: "261521192",
    name: "Mixed Energy Residue",
    tier: "Tier2",
    description:
      "A rare material used for research. A residue remaining in the biotissue after various energies are mixed.",
  },
  {
    id: "261521186",
    name: "Macromolecule Biogel",
    tier: "Tier2",
    description:
      "A rare material used for research. A biogel made of macromolecules with more complex structures.",
  },
  {
    id: "261521184",
    name: "Conductive Metallic Foil",
    tier: "Tier2",
    description:
      "A rare material used for research. An extremely compressed metallic foil that allows electricity to flow through more easily.",
  },
  {
    id: "261021258",
    name: "Artificial Nano Cells",
    tier: "Tier2",
    description:
      "A rare material used for research. These artificial cells composed of nanoparticles can be programmed with the desired functions to replace the original cells.",
  },
  {
    id: "261021257",
    name: "Noctium",
    tier: "Tier2",
    description:
      "A rare material used for research. Its special property can change its form when it reacts with Organic Matter.",
  },
  {
    id: "261021235",
    name: "Ionized Metal",
    tier: "Tier2",
    description:
      "A material used for research. A solution in which a specific metal is forced into an ionized state.",
  },
  {
    id: "261021234",
    name: "Adaptive Protein",
    tier: "Tier2",
    description:
      "A material used for research. A special material that constantly adapts to changes in its environment while maintaining its protein formations.",
  },
  {
    id: "261021233",
    name: "Lectin Acceptor",
    tier: "Tier2",
    description:
      "A material used for research. It is known to play an important role in many cellular functions.",
  },
  {
    id: "261021226",
    name: "Luminous Alloys",
    tier: "Tier2",
    description:
      "A material used for research. An alloy cast using a mysterious manufacturing method, this special metal varies in strength depending on how it is used.",
  },
  {
    id: "261021059",
    name: "Murky Energy Residue",
    tier: "Tier2",
    description:
      "A rare material used for research. A biotissue mutated due to powerful energy.",
  },
  {
    id: "261021055",
    name: "Low-Carbon Activator",
    tier: "Tier2",
    description:
      "A rare material used for research. A specialized catalyst that forcibly activates the energy of organic matter.",
  },
  {
    id: "262031019",
    name: "Superconductor Core",
    tier: "Tier1",
    description:
      "A material used for research. It has minimal energy loss due to zero electrical resistance.",
  },
  {
    id: "262031018",
    name: "Solenoid",
    tier: "Tier1",
    description:
      "A material used for research. It is a small generator that supplies energy to mechanisms.",
  },
  {
    id: "262031017",
    name: "Liquid Metal",
    tier: "Tier1",
    description:
      "A material used for research. The liquefied metal can be used with superalloys to be refined into various shapes.",
  },
  {
    id: "262031016",
    name: "Superalloy",
    tier: "Tier1",
    description:
      "A material used for research. The metal was extracted from Kuiper and is hard and light.",
  },
  {
    id: "262020204",
    name: "High Conductivity Wire",
    tier: "Tier1",
    description:
      "A material used to enhance or modify vehicles. This wire has extremely low resistance compared to ordinary wire.",
  },
  {
    id: "262020203",
    name: "Alloy Bearing",
    tier: "Tier1",
    description:
      "A material used to enhance or modify vehicles. Multiple minerals have been combined and specially treated to withstand abrasion.",
  },
  {
    id: "262020202",
    name: "Insulating Nut",
    tier: "Tier1",
    description:
      "A material used to enhance or modify vehicles. It is made of an insulating material to prevent short circuits.",
  },
  {
    id: "262020201",
    name: "Specially Treated Alloy",
    tier: "Tier1",
    description:
      "A material used to enhance or modify vehicles. Light and flexible, but strong enough to be used in vehicles.",
  },
  {
    id: "261511012",
    name: "Void Abyss Metal Fragment",
    tier: "Tier1",
    description:
      "A material used for research. A fragment of the outer armor and bio-metal of an Abyssal Colossi, often utilized in the structural design of Core-related devices that deal with powerful Void Energy.",
  },
  {
    id: "261511010",
    name: "Reverse Charging Coil",
    tier: "Tier1",
    description:
      "A material used for research. A coil designed to allow electricity to flow backward.",
  },
  {
    id: "261511009",
    name: "Hellion",
    tier: "Tier1",
    description:
      "A material used for research. A helium-refined gas substance used for creating various devices.",
  },
  {
    id: "261511008",
    name: "Shape Memory Alloy",
    tier: "Tier1",
    description:
      "A material used for research. A special alloy that can return to its original shape when exposed to heat energy.",
  },
  {
    id: "261511007",
    name: "Carbon Crystal",
    tier: "Tier1",
    description:
      "A material used for research. A material created by combining multiple carbon atoms.",
  },
  {
    id: "261511006",
    name: "Ceramic Composite",
    tier: "Tier1",
    description:
      "A material used for research. A material created by refining natural ceramic obtained from the oldest region in Ingris.",
  },
  {
    id: "261511005",
    name: "Flectorite",
    tier: "Tier1",
    description:
      "A material used for research. A special substance that has the characteristics of a fluid even though it's an ore.",
  },
  {
    id: "261511004",
    name: "Nanopolymers",
    tier: "Tier1",
    description:
      "A material used for research. Considered some kind of fluid, this is a specialized particle that can be refined into various forms.",
  },
  {
    id: "261511003",
    name: "Monomolecular Extractor",
    tier: "Tier1",
    description:
      "A material used for research. This allows you to extract molecules from certain objects.",
  },
  {
    id: "261511002",
    name: "Silicon",
    tier: "Tier1",
    description:
      "A material used for research. A specialized chemical material that can be acquired by refining ores with identical names.",
  },
  {
    id: "261511001",
    name: "Compound Coating Material",
    tier: "Tier1",
    description:
      "A material used for research. A substance known for its exceptional insulation.",
  },
  {
    id: "261021177",
    name: "Energy Control Core",
    tier: "Tier1",
    description:
      "A material used for research. A component that controls energy. Since it's harmful when it touches the body, it comes with a special anchor.",
  },
  {
    id: "261021176",
    name: "Quantum Crystal",
    tier: "Tier1",
    description:
      "A material used for research. A substance that embodies the crystal structures of a minuscule quantum unit.",
  },
  {
    id: "261021175",
    name: "Nano Compound",
    tier: "Tier1",
    description:
      "A material used for research. A special material comprised of nanomolecular structures used as one of the raw materials for a Reactor.",
  },
  {
    id: "261021174",
    name: "High Precision Exchange Components",
    tier: "Tier1",
    description:
      "A material used for research. An exchangeable component that's had its modules set to work for many different firearms.",
  },
  {
    id: "261021173",
    name: "Multi-Composite Receivers",
    tier: "Tier1",
    description:
      "A material used for research. A receiver component that's had its modules set to work for many different firearms.",
  },
  {
    id: "261021053",
    name: "Hardener",
    tier: "Tier1",
    description:
      "A material used for research. Adding it during refining increases hardness by forming strong bonds.",
  },
  {
    id: "261021052",
    name: "Semi-permanent Plasma",
    tier: "Tier1",
    description:
      "A material used for research. This continuously heated plasma enables refining into various forms.",
  },
  {
    id: "261021051",
    name: "Metal Accelerant",
    tier: "Tier1",
    description:
      "A material used for research. This catalyst is used to maximize the reaction during metal refining.",
  },
  {
    id: "261021050",
    name: "Superfluid",
    tier: "Tier1",
    description:
      "A material used for research. A special non-viscous fluid that doesn't flow.",
  },
  {
    id: "261021049",
    name: "Monad Shard",
    tier: "Tier1",
    description:
      "A material used for research. Particles of minerals obtained from various places.",
  },
  {
    id: "261021048",
    name: "Repton",
    tier: "Tier1",
    description:
      "A material used for research. This new material was created by refining an amalgamation of extremely fine particles.",
  },
];
