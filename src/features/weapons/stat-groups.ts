/**
 * How a weapon page groups its base stats (ADR 0024): by what each stat does in play,
 * ArcheLab's own grouping. NEXON lists the stats in one flat list with no groups. A stat
 * NEXON adds later lands in "Other" until it is placed here.
 */
const groups: readonly { title: string; stats: readonly string[] }[] = [
  {
    title: "Damage",
    stats: [
      "Firearm Critical Hit Rate",
      "Firearm Critical Hit Damage",
      "Melee Weapon Critical Hit Rate",
      "Melee Weapon Critical Hit Damage",
      "Weak Point Damage",
      "Attribute Status Effect Trigger Rate",
      "Multi-Hit Damage",
      "Additional Attack Damage",
      "Burst",
      "Crush",
      "Pierce",
      "Penetration",
      "Melee Weapon Piercing Rate",
      "Melee Weapon Min. Piercing Rate",
    ],
  },
  {
    title: "Handling",
    stats: [
      "Fire Rate",
      "Attack Speed",
      "Rounds per Magazine",
      "Shell Capacity",
      "Load Capacity",
      "Reload Time",
      "Bullet Cost",
      "Hip Fire Accuracy",
      "Aimed Shot Accuracy",
    ],
  },
  {
    title: "Range",
    stats: [
      "Effective Range (Drop-off start)",
      "Effective Range (Drop-off end)",
      "ATK Drop-off Modifier",
      "Explosion ATK Drop-off Range",
      "Launcher Explosion Radius",
      "Max Range",
      "Max Melee Weapon Attack Range Multiplier",
    ],
  },
  {
    title: "Movement",
    stats: [
      "Sprint Speed",
      "Movement Speed",
      "Movement Speed While Firing",
      "Movement Speed While Aiming",
    ],
  },
  {
    title: "Block",
    stats: [
      "Max Block Gauge",
      "Start Block Gauge Cost",
      "Maintain Block Gauge Cost",
      "Block Gauge Recovery Start Time",
      "Block Gauge Recovery Amount",
      "Block Efficiency",
    ],
  },
  {
    title: "Special attack",
    stats: [
      "Max Special Attack Gauge",
      "Special Attack Gauge Recovery Start Time",
      "Special Attack Gauge Recovery Amount",
    ],
  },
  {
    title: "Force",
    stats: [
      "Impulse",
      "Daze Attack Value",
      "Environmental Destruction (Weapon)",
    ],
  },
];

export interface StatGroup<T> {
  readonly title: string;
  readonly stats: readonly T[];
}

/** The stats in their groups and each group's order; empty groups are left out. */
export function groupStats<T extends { readonly name: string }>(
  stats: readonly T[],
): StatGroup<T>[] {
  const placed = new Set(groups.flatMap((group) => group.stats));
  const byName = new Map(stats.map((stat) => [stat.name, stat]));
  return [
    ...groups.map((group) => ({
      title: group.title,
      stats: group.stats.flatMap((name) => {
        const stat = byName.get(name);
        return stat === undefined ? [] : [stat];
      }),
    })),
    {
      title: "Other",
      stats: stats.filter((stat) => !placed.has(stat.name)),
    },
  ].filter((group) => group.stats.length > 0);
}
