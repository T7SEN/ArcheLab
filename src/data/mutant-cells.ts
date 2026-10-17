/**
 * Every Mutant Cell, from the game's official update notes (T7SEN, 2026-10-17; ADR 0038):
 * NEXON's metadata has no Mutant Cell set, only the Arche Tuning Board's five "Mutant
 * Cell Slot" nodes. Sources, read on 2026-10-17 (research_notes/TFD Mutant Cells/):
 * - Update 1.2.18 (https://tfd.nexon.com/en/news/2907889): the first 27.
 * - Update 1.3.3 (https://tfd.nexon.com/en/news/3126231): 8.
 * - Update 1.3.6 (https://tfd.nexon.com/en/news/3164584): 9.
 * - Update 1.3.9 (https://tfd.nexon.com/en/news/3213391): 19.
 * - Update 1.3.12 (https://tfd.nexon.com/en/news/3295754): Corrosive Overshield.
 *
 * Since Update 1.3.25 a slot takes a Mutant Cell effect picked from this list instead of
 * a Mutant Cell item. tfdhub.gg lists the same 64 with the same sockets and numbers, so
 * none changed after its notes and none is provisional (T7SEN: a changed one would take
 * tfdhub's numbers, marked provisional). Names, sockets, descriptions and numbers are
 * as the notes write them; `[x]` and `[+]` are the game's own marks, and a positive
 * number drops the "+" some notes give it.
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
   * The effect's name when a cell has two (Singular Tuning, Fusion Tuning), or the
   * condition the notes head its numbers with; null when the cell's name says it.
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
  /** What sets it off, as the notes word it. */
  readonly description: string;
  readonly effects: readonly MutantCellEffect[];
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
): MutantCell {
  return {
    name: `${first} ${second} Tuning`,
    socket,
    description: `When using a ${first} Skill, grants ${first} Tuning to self. When using a ${second} Skill, grants ${second} Tuning to self. These effects can be activated multiple times.`,
    effects: [tunings[first], tunings[second]],
    added: "1.2.18",
  };
}

/** Update 1.2.18: more Skill Power against a target with a status. */
function vulnerability(status: string, socket: MutantCellSocket): MutantCell {
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
): MutantCell {
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
): MutantCell {
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
): MutantCell {
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
function impairment(attribute: string, socket: MutantCellSocket): MutantCell {
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
function damageConversion(skill: string, socket: MutantCellSocket): MutantCell {
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
export const mutantCells: readonly MutantCell[] = [
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

/**
 * Each cell's icon on NEXON's image host, by name: the art tfdhub.gg shows for it, used at
 * T7SEN's request (2026-10-17; ADR 0038). NEXON's keyless sets don't list these images,
 * so the match is tfdhub's. Linked, never copied into the repository; each is 144 by 144.
 */
export const mutantCellArt: Readonly<Partial<Record<string, string>>> = {
  "Activate Thrust": "be5e98a98016864cc08c475b1e4d85ce",
  "Arche Chain Catalyst": "10c2ae9bdc92d8b09ead809c6b935f62",
  "Arche Concentration": "84d48d03bfd85dc9804684ce54adaad3",
  "Arche Efficiency Enhancement": "eb9453c277ab96f58a1f7ae96f2e6c1c",
  "Arche Maximization": "595e319e852d5f42c5058b94b9d51ea9",
  "Arche Overheat Shield": "f6c9dffade975afd374059d5d8bbdba8",
  "Arche Reload": "4079f2d3b5405f3f06be4b9a333fe280",
  "Attack Neutralization": "691e9aafd9a809d552b8daf68dbfeafa",
  "Battlesuit Efficiency Enhancement": "ea2c81421ad7a223d9db07c6c843e67b",
  "Burn Vulnerability": "2de09723b9d6e587b36fa4f19deaeb27",
  "Chill Chain Catalyst": "07d33ef90178e592d4480327f3ea0f86",
  "Chill Cohesion": "4b972082dfb9fe2da272024293b99337",
  "Chill Element Adaptation": "a76a0ddfc9009685de7fc4a5c592ee7f",
  "Chill Focus Aiming": "3f88336b401c1b4132acf8c34e2cf714",
  "Chill Impairment": "883f34c2d0d66e13991fc4baae7145d2",
  "Corrosive Overshield": "0131c4a65ce9d0a2a9f3952654e886f3",
  "Defense Neutralization": "fbe440ae8eeeb8b6304e612e3be4d390",
  "Dimension Damage Conversion": "a24d8152b9eaa1ace1920045f8940ebc",
  "Electric Chain Catalyst": "80b498572206014c797354be53ec8946",
  "Electric Cohesion": "35cd13677dea809bd1856dcef8d13459",
  "Electric Element Adaptation": "d5e4fb7dabc3cead1c6ee1f0c3677304",
  "Electric Impairment": "17d14309e30351c66b9bd4095f88bd20",
  "Electric Release": "9d2c9a46d00f496f19be7443d6ad954b",
  "Electrocution Vulnerability": "0c154c6bcd96528e17ea5965a0fcd542",
  "Exploding Gunpowder Cache": "90bb06e0ffefcc68776d80b967ef6376",
  "Fiery Forced Rally": "98e97c78f74de60fa1b28dd3f91bf385",
  "Fight Song": "72534b3fa18abf36cc2ffb8ed23ba933",
  "Final Preparations": "6ddc0c1319a4851533041ba1e170b74a",
  "Fire Chain Catalyst": "d13075e264025f40c36d58f52ab1e9a7",
  "Fire Cohesion": "b8745b1f1457e53d593a257aaf7afe81",
  "Fire Element Adaptation": "984e882f423573c929a77607ec651bfc",
  "Fire Impairment": "039a776871cabd5d2c0c3b464cf9deae",
  "Frostbite Vulnerability": "f5f5f336e01b83003735b35d4e6f8b94",
  "Fusion Damage Conversion": "18ee0af5b75873cde1333416aae49e43",
  "Fusion Dimension Tuning": "48c8588fd41a686394317841c2fac3f1",
  "Fusion Tech Tuning": "a4b2e2a203936919b1b4b576990db3e3",
  "Fusion Zone": "cdbb462e50ab53730dc35a74905d2043",
  "Induced Arche Eruption": "90dc1f6fa719ac77d98d8cece4b74e27",
  "Inflict Piercing Wound": "97ca63930ae102df7e60c63e299463ef",
  "Maximize Piercing Wound": "7c8ad20a3e48d534918203a65599f374",
  "Mixed Enhancer Healing": "8bab291fb2eeec38ca78a74458db0a5a",
  "Non-Attribute Cohesion": "143d1bba29c148db11388d4ac223aaa8",
  "Non-Attribute Impairment": "bb16ec3b4be4253f648afb32112d5a16",
  "Poison Vulnerability": "2c5504e1ecb37e43964255b69a4d80c5",
  "Putrid Zone": "c4d0c0b9efbad60acdc58a178d1042c6",
  "Rapid Supply Support": "4d98a2ccb51457b7c04065d5dcee2be2",
  "Recover MP": "c9cdb28151b205dff79535ed68cf6a86",
  "Recovery Amplification Wave": "4cd1c947d80a4f1382555c0eef7e1218",
  "Reinforced Barrier Tactics": "15c8ba941a199806939e324fb264ac18",
  "Shield Enhanced Arche": "8af9c3e30a7eede092c496c6a869fc8e",
  "Singular Damage Conversion": "f8244b0e889b0b361408ee0320388cf0",
  "Singular Dimension Tuning": "ca4aad17595845e2bdff9bc36fc43b1c",
  "Singular Fusion Tuning": "fd4902491f1c082ffc5a8a71071599ba",
  "Singular Tech Tuning": "082c419d1435e9232f66da8b3225c130",
  "Steady Hands": "d352e5a0bf68dc246d716a07c62c7d46",
  "Survival Instinct": "d68891c0c9c639a2306d368f5b679256",
  "Tech Damage Conversion": "c76554a304edcacc2bd24c1fd231b1af",
  "Tech Dimension Tuning": "b42b937aa72ca5c53f834a26368cc65c",
  "Toxic Element Adaptation": "e6e99fda3dd2b5c76f855bd55dab90a8",
  "Toxic Impairment": "50010f197695ed98413cc012d8850e51",
  "Toxin Chain Catalyst": "cb7e1af9ecface5b63f3fe9edf698ccd",
  "Toxin Cohesion": "a0144bdb3736c806fcb5b32d70b88e29",
  "Venomous Spike": "65435fde1782e89871b6cfe45c043410",
  "Wide Range Battery": "546869498bcd40ae459616e9d5c91049",
};

const imageHost = "https://open.api.nexon.com/static/tfd/img/";

/** A cell's icon, or null for a cell with none listed. */
export function mutantCellImageUrl(name: string): string | null {
  const id = mutantCellArt[name];
  return id === undefined ? null : imageHost + id;
}
