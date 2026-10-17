/**
 * Mutant Cells as the game's official update notes added them: the cross-check for
 * NEXON's `node-item.json`, which the Mutant Cells page reads (T7SEN, 2026-10-17; ADR
 * 0040). Each build compares NEXON's cells with these and warns about a cell missing on
 * either side, a different socket or different numbers (`crossCheckMutantCells`).
 * Sources, read on 2026-10-17 (research_notes/TFD Mutant Cells/):
 * - Update 1.2.18 (https://tfd.nexon.com/en/news/2907889): the first 27.
 * - Update 1.3.3 (https://tfd.nexon.com/en/news/3126231): 8.
 * - Update 1.3.6 (https://tfd.nexon.com/en/news/3164584): 9.
 * - Update 1.3.9 (https://tfd.nexon.com/en/news/3213391): 19.
 * - Update 1.3.12 (https://tfd.nexon.com/en/news/3295754): Corrosive Overshield.
 *
 * Since Update 1.3.25 a slot takes a Mutant Cell effect picked from this list instead of
 * a Mutant Cell item. On 2026-10-17 NEXON's set had the same 64 cells, names, sockets
 * and numbers, worded differently in places ("Missing HP Ratio" where the notes say
 * "Consumed HP Ratio", "[+]" marks the notes leave off); the page shows NEXON's words.
 * Names, sockets, descriptions and numbers here are as the notes write them; `[x]` and
 * `[+]` are the game's own marks, and a positive number drops the "+" some notes give it.
 */

/** A Mutant Cell Slot's Socket Type: a cell fits a slot of its own type. */
export const mutantCellSockets = [
  "Almandine",
  "Cerulean",
  "Malachite",
  "Rutile",
  "Xantic",
] as const;

export type MutantCellSocket = (typeof mutantCellSockets)[number];

export interface MutantCellStat {
  readonly name: string;
  readonly value: string;
}

/** One effect a cell grants or inflicts, with its numbers. */
export interface MutantCellEffect {
  /**
   * The heading over its numbers: the effect's name (Singular Tuning), NEXON's "Basic
   * Info", or the condition the notes head them with; null when the cell's name says it.
   */
  readonly title: string | null;
  readonly stats: readonly MutantCellStat[];
}

/** The update whose notes added a cell. */
export type MutantCellUpdate =
  "1.2.18" | "1.3.3" | "1.3.6" | "1.3.9" | "1.3.12";

export interface MutantCell {
  readonly name: string;
  readonly socket: MutantCellSocket;
  /** What sets it off; NEXON's has line breaks in some. */
  readonly description: string;
  readonly effects: readonly MutantCellEffect[];
}

/** A cell as the notes added it. */
export interface MutantCellNote extends MutantCell {
  readonly added: MutantCellUpdate;
}

const stat = (name: string, value: string): MutantCellStat => ({ name, value });

const only = (...stats: MutantCellStat[]): MutantCellEffect[] => [
  { title: null, stats },
];

// The families the notes repeat for each attribute or skill type, worded once.

/** Update 1.2.18: the Tuning effects a pair of skill types grants. */
const tunings = {
  Singular: {
    title: "Singular Tuning",
    stats: [stat("Duration", "10s"), stat("Skill Effect Range", "34.2%[+]")],
  },
  Fusion: {
    title: "Fusion Tuning",
    stats: [stat("Duration", "10s"), stat("Skill Duration", "13.5%[+]")],
  },
  Tech: {
    title: "Tech Tuning",
    stats: [stat("Duration", "10s"), stat("Skill Power", "4.7%[+]")],
  },
  Dimension: {
    title: "Dimension Tuning",
    stats: [stat("Duration", "10s"), stat("Skill Cost", "-5.6%[+]")],
  },
} as const satisfies Record<string, MutantCellEffect>;

function tuning(
  first: keyof typeof tunings,
  second: keyof typeof tunings,
  socket: MutantCellSocket,
): MutantCellNote {
  return {
    name: `${first} ${second} Tuning`,
    socket,
    description: `When using a ${first} Skill, grants ${first} Tuning to self. When using a ${second} Skill, grants ${second} Tuning to self. These effects can be activated multiple times.`,
    effects: [tunings[first], tunings[second]],
    added: "1.2.18",
  };
}

/** Update 1.2.18: more Skill Power against a target with a status. */
function vulnerability(
  status: string,
  socket: MutantCellSocket,
): MutantCellNote {
  return {
    name: `${status} Vulnerability`,
    socket,
    description: `When attacking enemies inflicted with ${status}, applies additional Skill Power.`,
    effects: only(stat("Skill Power", "9.5%[+]")),
    added: "1.2.18",
  };
}

/**
 * Update 1.2.18: a chance on a defeat for attribute Skill Power. The notes call the
 * Toxin cell's stat "Toxic Skill Power".
 */
function cohesion(
  attribute: string,
  power: string,
  socket: MutantCellSocket,
): MutantCellNote {
  const name = `${attribute} Cohesion`;
  return {
    name,
    socket,
    description: `When defeating an enemy, has a chance to grant ${name} to self.`,
    effects: only(
      stat("Trigger Rate", "50%"),
      stat("Duration", "10s"),
      stat("Max Stacks", "3"),
      stat(`${power} Skill Power`, "6.4%[+]"),
      stat(`${power} Skill Power per Stack`, "6.4%[+]"),
    ),
    added: "1.2.18",
  };
}

/** Update 1.2.18: resistance stacks from taking an attribute's damage. */
function adaptation(
  attribute: string,
  resistance: string,
  socket: MutantCellSocket,
): MutantCellNote {
  const name = `${attribute} Element Adaptation`;
  return {
    name,
    socket,
    description: `When taking ${attribute} damage from an enemy, grants ${name} to self.`,
    effects: only(
      stat("Duration", "15s"),
      stat("Max Stacks", "5"),
      stat(`${resistance} Resistance`, "685"),
      stat(`${resistance} Resistance per Stack`, "685"),
    ),
    added: "1.2.18",
  };
}

/** Update 1.3.3: a target's resistance to an attribute's skills, lowered. */
function chainCatalyst(
  name: string,
  attribute: string,
  socket: MutantCellSocket,
): MutantCellNote {
  return {
    name,
    socket,
    description: `On Skill hit, inflicts ${name} on the target hit.`,
    effects: only(
      stat("Duration", "10s"),
      stat(
        `${attribute} Skill Resistance Reduction`,
        `${attribute} Skill Power Boost Ratio x 12.5%`,
      ),
      stat("Max Reduction", "20%"),
      stat("Cooldown for the same target", "30s"),
    ),
    added: "1.3.3",
  };
}

/** Update 1.3.6: a debuffed target deals less damage. */
function impairment(
  attribute: string,
  socket: MutantCellSocket,
): MutantCellNote {
  const name = `${attribute} Impairment`;
  return {
    name,
    socket,
    description: `When inflicting a debuff on a target with a skill, inflicts ${name} on the target.`,
    effects: only(
      stat("Duration", "10s"),
      stat(
        "Outgoing DMG Reduction",
        `${attribute} Skill Power Boost Ratio x 5.9%`,
      ),
      stat("Max Reduction", "12.8%"),
      stat("Cooldown Against Same Target", "30s"),
    ),
    added: "1.3.6",
  };
}

/** Update 1.3.6: a skill type's Skill Power Boost Ratio grows with the HP spent. */
function damageConversion(
  skill: string,
  socket: MutantCellSocket,
): MutantCellNote {
  return {
    name: `${skill} Damage Conversion`,
    socket,
    description: `${skill} Skill Power Boost Ratio increases proportionally to the amount of HP consumed. This effect is not applied when Max HP is 1.`,
    effects: only(
      stat(`${skill} Skill Power Boost Ratio`, "Consumed HP Ratio x 32.5%"),
      stat("Max Increase", "17.1%"),
    ),
    added: "1.3.6",
  };
}

const shieldDescription = (gain: string) =>
  `When remaining Shield is above a certain percentage of Max Shield, increases ${gain}. The effect is not applied when the Max Shield is at 1.`;

const neutralization = (debuff: string) =>
  `On Skill Attack upon enemies with max HP, inflicts ${debuff}.`;

/** Every Mutant Cell, in the order the notes add them. */
export const mutantCellNotes: readonly MutantCellNote[] = [
  // Update 1.2.18
  {
    name: "Attack Neutralization",
    socket: "Cerulean",
    description: neutralization("Attack Neutralization"),
    effects: only(
      stat("Duration", "15s"),
      stat("ATK", "-34.8%[x]"),
      stat("All Attribute ATK", "-34.8%[x]"),
    ),
    added: "1.2.18",
  },
  {
    // The notes then list the four attribute resistances, each -30%[x].
    name: "Defense Neutralization",
    socket: "Malachite",
    description: neutralization("Defense Neutralization"),
    effects: only(
      stat("Duration", "15s"),
      stat("DEF", "-50%[x]"),
      stat("All Attribute Resistance", "-30%[x]"),
    ),
    added: "1.2.18",
  },
  {
    name: "Battlesuit Efficiency Enhancement",
    socket: "Rutile",
    description:
      "On skill hit, grants Battlesuit Efficiency Enhancement to self.",
    effects: only(
      stat("Duration", "15s"),
      stat("Max Stacks", "4"),
      stat("DEF", "29.7%[x]"),
      stat("DEF per Stack", "29.7%[x]"),
    ),
    added: "1.2.18",
  },
  {
    name: "Arche Efficiency Enhancement",
    socket: "Xantic",
    description: "On skill hit, grants Arche Efficiency Enhancement to self.",
    effects: only(
      stat("Duration", "15s"),
      stat("Max Stacks", "4"),
      stat("Skill Power", "2.4%[+]"),
      stat("Skill Power per Stack", "2.4%[+]"),
    ),
    added: "1.2.18",
  },
  {
    name: "Arche Reload",
    socket: "Almandine",
    description: "When reloading, grants Arche Reload to self.",
    effects: only(
      stat("Duration", "15s"),
      stat("Cooldown", "30s"),
      stat("Skill Critical Hit Rate", "85.6%[x]"),
    ),
    added: "1.2.18",
  },
  tuning("Singular", "Fusion", "Cerulean"),
  tuning("Singular", "Tech", "Xantic"),
  tuning("Singular", "Dimension", "Malachite"),
  tuning("Fusion", "Tech", "Malachite"),
  tuning("Fusion", "Dimension", "Rutile"),
  tuning("Tech", "Dimension", "Xantic"),
  {
    name: "Shield Enhanced Arche",
    socket: "Xantic",
    description: shieldDescription("Skill Power"),
    effects: [
      {
        title: "When Max Shield x 50% or above",
        stats: [stat("Skill Power", "9.5%[+]")],
      },
    ],
    added: "1.2.18",
  },
  {
    name: "Arche Overheat Shield",
    socket: "Almandine",
    description: shieldDescription("Skill Critical Hit Damage"),
    effects: [
      {
        title: "When Max Shield x 50% or above",
        stats: [stat("Skill Critical Hit Damage", "42.8%[x]")],
      },
    ],
    added: "1.2.18",
  },
  {
    name: "Final Preparations",
    socket: "Malachite",
    description:
      "When attacking enemies with the fourth skill, grants Final Preparations to self.",
    effects: only(
      stat("Duration", "15s"),
      stat("Cooldown", "30s"),
      stat("Skill Effect Range", "68.4%[+]"),
      stat("Skill Power", "9.5%[+]"),
    ),
    added: "1.2.18",
  },
  vulnerability("Burn", "Almandine"),
  vulnerability("Frostbite", "Cerulean"),
  vulnerability("Electrocution", "Rutile"),
  vulnerability("Poison", "Xantic"),
  cohesion("Non-Attribute", "Non-Attribute", "Malachite"),
  cohesion("Fire", "Fire", "Almandine"),
  cohesion("Chill", "Chill", "Cerulean"),
  cohesion("Electric", "Electric", "Rutile"),
  cohesion("Toxin", "Toxic", "Xantic"),
  adaptation("Fire", "Fire", "Almandine"),
  adaptation("Chill", "Chill", "Cerulean"),
  adaptation("Electric", "Electric", "Rutile"),
  adaptation("Toxic", "Toxin", "Xantic"),

  // Update 1.3.3
  chainCatalyst("Arche Chain Catalyst", "Non-Attribute", "Malachite"),
  chainCatalyst("Fire Chain Catalyst", "Fire", "Almandine"),
  chainCatalyst("Chill Chain Catalyst", "Chill", "Cerulean"),
  chainCatalyst("Toxin Chain Catalyst", "Toxic", "Xantic"),
  chainCatalyst("Electric Chain Catalyst", "Electric", "Rutile"),
  {
    name: "Arche Concentration",
    socket: "Cerulean",
    description:
      "Each time a debuff is inflicted on a target, grants Arche Concentration to self.",
    effects: only(
      stat("Duration", "10s"),
      stat("Max Stacks", "3"),
      stat("Skill Critical Hit Damage", "12.5%[x]"),
      stat("Skill Critical Hit Damage Increase per Stack", "12.5%[x]"),
    ),
    added: "1.3.3",
  },
  {
    name: "Arche Maximization",
    socket: "Malachite",
    description:
      "Each time a debuff is inflicted on a target, grants Arche Maximization to self.",
    effects: only(
      stat("Duration", "10s"),
      stat("Max Stacks", "3"),
      stat("Skill Critical Hit Rate", "11.5%[x]"),
      stat("Skill Critical Hit Rate per Stack", "11.5%[x]"),
    ),
    added: "1.3.3",
  },
  {
    name: "Recovery Amplification Wave",
    socket: "Malachite",
    description:
      "When a buff or healing is given to an ally, grants Recovery Amplification Wave to self.",
    effects: only(
      stat("Duration", "10s"),
      stat("HP Heal", "0.097[+]"),
      stat("Outgoing Shield Recovery", "0.097[+]"),
      stat("Cooldown", "20s"),
    ),
    added: "1.3.3",
  },

  // Update 1.3.6
  impairment("Non-Attribute", "Malachite"),
  impairment("Fire", "Almandine"),
  impairment("Chill", "Cerulean"),
  impairment("Toxic", "Xantic"),
  impairment("Electric", "Rutile"),
  damageConversion("Singular", "Cerulean"),
  damageConversion("Dimension", "Xantic"),
  damageConversion("Tech", "Malachite"),
  damageConversion("Fusion", "Rutile"),

  // Update 1.3.9
  {
    name: "Fight Song",
    socket: "Malachite",
    description:
      "When buffing allies with a Rhythm type skill, grants Fight Song to self.",
    effects: only(
      stat("Duration", "5s"),
      stat("Max Stacks", "5"),
      stat("Max MP", "10[+]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Mixed Enhancer Healing",
    socket: "Malachite",
    description:
      "When recovering allies with a Healing type skill, grants Mixed Enhancer Healing to allies except self.",
    effects: only(
      stat("Duration", "8s"),
      stat("Skill Critical Hit Rate", "5%[x]"),
      stat("Skill Critical Hit Damage", "10%[x]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Rapid Supply Support",
    socket: "Xantic",
    description:
      "When buffing allies with a Supply type skill, grants Rapid Supply Support to self.",
    effects: only(
      stat("Duration", "5s"),
      stat("Cooldown", "10s"),
      stat("Fire Rate", "10%[x]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Chill Focus Aiming",
    socket: "Malachite",
    description:
      "When landing a Critical Hit with an Aimed Shot type skill, grants Chill Focus Aiming to self.",
    effects: only(
      stat("Duration", "10s"),
      stat("Chill Skill Power", "10%[+]"),
      stat("Weak Point Damage", "9%[x]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Induced Arche Eruption",
    socket: "Almandine",
    description:
      "When using an Emission type skill, grants Induced Arche Eruption to self every second.",
    effects: only(
      stat("Duration", "5s"),
      stat("Cooldown", "10s"),
      stat("Max Stacks", "3"),
      stat("Skill Power Modifier Increase per Stack", "10%"),
    ),
    added: "1.3.9",
  },
  {
    name: "Reinforced Barrier Tactics",
    socket: "Malachite",
    description:
      "When using a Barrier type skill, grants Reinforced Barrier Tactics to self.",
    effects: only(
      stat("Duration", "10s"),
      stat("Max Stacks", "3"),
      stat("Skill Critical Hit Rate Increase per Stack", "-20%[x]"),
      stat("Skill Power Increase per Stack", "7%[+]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Electric Release",
    socket: "Rutile",
    description:
      "When using an Emission type skill, grants Electric Release to self every second.",
    effects: only(
      stat("Duration", "10s"),
      stat("Cooldown", "20s"),
      stat("Max Stacks", "5"),
      stat("Electric Skill Power Increase per Stack", "4%[+]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Recover MP",
    socket: "Malachite",
    description: "When using an Installation type skill, recovers MP.",
    effects: only(stat("MP Recovery per Skill Use", "10[+]")),
    added: "1.3.9",
  },
  {
    name: "Inflict Piercing Wound",
    socket: "Rutile",
    description:
      "When using a Piercing Projectile type skill, grants a stack of Inflict Piercing Wound to self per target hit.",
    effects: only(
      stat("Duration", "3s"),
      stat("Max Stacks", "8"),
      stat("Skill Critical Hit Damage Increase per Stack", "3%[x]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Maximize Piercing Wound",
    socket: "Malachite",
    description:
      "When using a Piercing Projectile type skill, grants a stack of Maximize Piercing Wound to self per target hit.",
    effects: only(
      stat("Duration", "3s"),
      stat("Max Stacks", "4"),
      stat("Skill Critical Hit Damage Increase per Stack", "2%[x]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Venomous Spike",
    socket: "Xantic",
    description:
      "When using a Clash type skill to attack a target inflicted with Poison, grants Venomous Spike to self.",
    effects: only(stat("Duration", "3s"), stat("Skill Effect Range", "12%[+]")),
    added: "1.3.9",
  },
  {
    name: "Putrid Zone",
    socket: "Xantic",
    description:
      "When attacking with a Ground DoT type skill, inflicts Putrid Zone on the hit target.",
    effects: only(
      stat("Duration", "3s"),
      stat("Max Stacks", "5"),
      stat("Toxin Resistance Increase per Stack", "-7%[x]"),
      stat("Movement Speed Increase per Stack", "-3%[x]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Exploding Gunpowder Cache",
    socket: "Almandine",
    description:
      "When using a Destruction type skill, grants Exploding Gunpowder Cache to self.",
    effects: only(
      stat("Duration", "3s"),
      stat("Max Stacks", "10"),
      stat("Fire Skill Power Increase per Stack", "2.5%[+]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Fusion Zone",
    socket: "Malachite",
    description:
      "When using a Ground DoT type skill, grants Fusion Zone to self.",
    effects: only(
      stat("Duration", "5s"),
      stat("Max Stacks", "5"),
      stat("Fusion Skill Power Modifier Increase per Stack", "5%[+]"),
    ),
    added: "1.3.9",
  },
  {
    name: "Wide Range Battery",
    socket: "Rutile",
    description:
      "While a Global DoT type skill is active, grants Wide Range Battery to self.",
    effects: only(stat("Skill Cost", "-5%[+]")),
    added: "1.3.9",
  },
  {
    name: "Survival Instinct",
    socket: "Almandine",
    description:
      "When using an HP Absorption type skill, grants Survival Instinct to self.",
    effects: only(
      stat("Duration", "5s"),
      stat("Cooldown", "10s"),
      stat("Movement Speed", "15%"),
    ),
    added: "1.3.9",
  },
  {
    name: "Steady Hands",
    socket: "Cerulean",
    description:
      "Using a Slow type skill to attack a target inflicted with Frostbite increases Skill Critical Hit Damage.",
    effects: only(stat("Critical Hit Damage", "40%[x]")),
    added: "1.3.9",
  },
  {
    name: "Activate Thrust",
    socket: "Almandine",
    description:
      "When using a Clash type skill, grants Activate Thrust to self.",
    effects: only(
      stat("Duration", "5s"),
      stat("Cooldown", "10s"),
      stat("Movement Speed", "5%"),
    ),
    added: "1.3.9",
  },
  {
    name: "Fiery Forced Rally",
    socket: "Almandine",
    description:
      "When using a Tow type skill, inflicts Fiery Forced Rally on the hit target.",
    effects: only(
      stat("Additional Fire Damage after 1s", "Skill Power x 550%"),
      stat("Cooldown", "10s"),
    ),
    added: "1.3.9",
  },

  // Update 1.3.12
  {
    name: "Corrosive Overshield",
    socket: "Xantic",
    description:
      "When attacking with an Overshield type Skill, grants Corrosion Barrier to self.",
    effects: [
      {
        title: "Corrosion Barrier",
        stats: [stat("Duration", "10s"), stat("Toxic Skill Power", "22%[+]")],
      },
    ],
    added: "1.3.12",
  },
];

/** A cell's address on its index: "fire-chain-catalyst". */
export function mutantCellSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
