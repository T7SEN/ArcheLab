/**
 * The game's fixed times for the Timers page (T7SEN, 2026-10-19; ADR 0054). Every time
 * is in UTC. The game's day starts at 07:00 UTC all year: the update notes write it as
 * 00:00 PDT in summer and 23:00 PST the evening before in winter ("11.01.2026 (Sun)
 * 23:00 - 11.04.2026 (Wed) 22:59 PST"). An end the notes give as a last minute ("22:59
 * PST") is kept here as the next minute, when it is over.
 */

/** When the game's day starts, in UTC hours. */
export const dayStartHour = 7;

/**
 * Wall Crasher, the Axion Plains Field Intercept Battle: it "appears every hour on the
 * hour (00 minute)", and players have 5 minutes to enter (the game's Axion Plains guide;
 * NEXON's Returning guide of 2026-08-20). Named as NEXON's data writes it.
 */
export const wallCrasher = { name: "Wall Crasher", entryMinutes: 5 } as const;

/**
 * ETA-0's shop in Albion: open from 00:00 Friday to 00:00 Tuesday PDT (the game's guide,
 * and tfdhub.gg's Timers page: it closes Tuesday at 07:00 UTC). The game days it is open,
 * as UTC weekdays of each day's start: Friday, Saturday, Sunday and Monday.
 */
export const eta0OpenDays: readonly number[] = [5, 6, 0, 1];

/**
 * The weekly reset: Thursday at 07:00 UTC (tfdhub.gg's Timers page; a NEXON event notice
 * of 2025 has weekly challenges reset "at 23:00 PST every Wednesday", the same moment).
 */
export const weeklyResetDay = 4;

/**
 * Bounty Operations' target each day, by the UTC weekday of the game day's start, with
 * its attribute: tfdhub.gg's Timers page, a valid source (T7SEN, 2026-10-19). On
 * Saturday and Sunday every target is open. The names are NEXON's drop places' ("[Bounty
 * Operations] - [Hungry Abyss Scarab] - [Sync Loot Reward]"), whose ids run 101 to 105
 * in this order.
 */
export const bountyTargets: readonly {
  readonly day: number;
  readonly name: string;
  readonly attribute: string;
}[] = [
  { day: 1, name: "Resurrected Immortality Obliviant", attribute: "Fire" },
  { day: 2, name: "Seudo Engulfed by Madness", attribute: "Chill" },
  { day: 3, name: "Soul Reaper Gruncah", attribute: "Toxic" },
  { day: 4, name: "Plaudia the Gnawing Calamity", attribute: "Electric" },
  { day: 5, name: "Hungry Abyss Scarab", attribute: "Non-Attribute" },
];

/**
 * Trials' two dungeons "take turns daily at 00:00 PDT" (Update 1.4.5), but Hotfix 1.4.5b
 * shows only Protocol 002 "until this issue is fixed", which pauses the turns. When they
 * return, `paused` goes, and the page needs which dungeon a given day has.
 */
export const trials = {
  dungeons: [
    { name: "Trials: Protocol 001", legion: "Order of Truth" },
    { name: "Trials: Protocol 002", legion: "Legion of Immortality" },
  ],
  paused: { showing: "Trials: Protocol 002", by: "Hotfix 1.4.5b" },
} as const;

/** One HQ Special Order quest: its objective and the rewards to choose 1 from. */
export interface HqQuest {
  readonly objective: string;
  readonly rewards: readonly string[];
}

/** A three-day cycle of HQ Special Orders. */
export interface HqCycle {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly quests: readonly HqQuest[];
}

/** The seven weapon core picks of Update 1.4.5's Core Acquisition Quests. */
export const hqCoreChoice: readonly string[] = [
  "4x Firepower Augmentation Core X",
  "4x Attribute Augmentation Core X",
  "4x Hit Augmentation Core X",
  "4x Hit Augmentation Core (Variant AB) X",
  "4x Precision Augmentation Core X",
  "4x Special Augmentation Core X",
  "4x Tactical Augmentation Core X",
];

/**
 * HQ Special Orders, cycle by cycle, as the update notes list them: Update 1.4.3's last
 * cycle, then Update 1.4.5's schedule to 11.22.2026 (Sun) 22:59 PST. Each update that
 * adds a schedule adds its cycles here.
 */
export const hqOrderCycles: readonly HqCycle[] = [
  {
    // 10.18.2026 (Sun) 00:00 - 10.20.2026 (Tue) 23:59 PDT (Update 1.4.3)
    startsAt: "2026-10-18T07:00:00Z",
    endsAt: "2026-10-21T07:00:00Z",
    quests: [
      {
        objective: "Complete Intercept Battles on any difficulty 5 times",
        rewards: [
          "Snowy Sled Dog Code",
          "Snowy Sled Dog Enhanced Cells",
          "Snowy Sled Dog Stabilizer",
          "Snowy Sled Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete Mobile Energy Monitoring 4 times",
        rewards: [
          "Hammer and Anvil Blueprint",
          "Hammer and Anvil Polymer Syncytium",
          "Hammer and Anvil Synthetic Fiber",
          "Hammer and Anvil Nano Tube",
        ],
      },
      {
        objective: "Complete Axion Plains Field Missions 3 times",
        rewards: [
          "Secret Garden Blueprint",
          "Secret Garden Polymer Syncytium",
          "Secret Garden Synthetic Fiber",
          "Secret Garden Nano Tube",
        ],
      },
      {
        objective: "Complete Void Vessel Missions on Hard Difficulty 2 times",
        rewards: [
          "Shadow Blueprint",
          "Shadow Polymer Syncytium",
          "Shadow Synthetic Fiber",
          "Shadow Nano Tube",
        ],
      },
      {
        objective: "Complete Special Operation: Hard Difficulty 2 times",
        rewards: [
          "4x Precision Augmentation Core X",
          "4x Special Augmentation Core X",
          "4x Tactical Augmentation Core X",
        ],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 10.21.2026 (Wed) 00:00 - 10.23.2026 (Fri) 23:59 PDT (Update 1.4.5)
    startsAt: "2026-10-21T07:00:00Z",
    endsAt: "2026-10-24T07:00:00Z",
    quests: [
      {
        objective: "Complete Infiltration Operations on any difficulty 4 times",
        rewards: [
          "Ultimate Freyna Code",
          "Ultimate Freyna Enhanced Cells",
          "Ultimate Freyna Stabilizer",
          "Ultimate Freyna Spiral Catalyst",
        ],
      },
      {
        objective: "Complete Void Vessel on any difficulty 2 times",
        rewards: [
          "Nazeistra's Devotion Blueprint",
          "Nazeistra's Devotion Polymer Syncytium",
          "Nazeistra's Devotion Synthetic Fiber",
          "Nazeistra's Devotion Nano Tube",
        ],
      },
      {
        objective: "Complete Sigma Sectors on any difficulty 4 times",
        rewards: [
          "Fallen Hope Blueprint",
          "Fallen Hope Polymer Syncytium",
          "Fallen Hope Synthetic Fiber",
          "Fallen Hope Nano Tube",
        ],
      },
      {
        objective: "Complete Axion Plains Operational Areas 3 times",
        rewards: [
          "Crime and Punishment Blueprint",
          "Crime and Punishment Polymer Syncytium",
          "Crime and Punishment Synthetic Fiber",
          "Crime and Punishment Nano Tube",
        ],
      },
      {
        objective:
          "Complete Void Intercept Battles on Extreme Difficulty 5 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 10.24.2026 (Sat) 00:00 - 10.26.2026 (Mon) 23:59 PDT (Update 1.4.5)
    startsAt: "2026-10-24T07:00:00Z",
    endsAt: "2026-10-27T07:00:00Z",
    quests: [
      {
        objective: "Complete Intercept Battles on any difficulty 5 times",
        rewards: [
          "Vespers Hunting Dog Code",
          "Vespers Hunting Dog Enhanced Cells",
          "Vespers Hunting Dog Stabilizer",
          "Vespers Hunting Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete 400% Infiltration Operations 4 times",
        rewards: [
          "Blue Beetle Blueprint",
          "Blue Beetle Polymer Syncytium",
          "Blue Beetle Synthetic Fiber",
          "Blue Beetle Nano Tube",
        ],
      },
      {
        objective: "Complete Mobile Energy Monitoring 4 times",
        rewards: [
          "ERASER Blueprint",
          "ERASER Polymer Syncytium",
          "ERASER Synthetic Fiber",
          "ERASER Nano Tube",
        ],
      },
      {
        objective: "Complete Void Vessel Missions on Hard Difficulty 2 times",
        rewards: [
          "Shadow Blueprint",
          "Shadow Polymer Syncytium",
          "Shadow Synthetic Fiber",
          "Shadow Nano Tube",
        ],
      },
      { objective: "Defeat the Wall Crasher 1 time", rewards: hqCoreChoice },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 10.27.2026 (Tue) 00:00 - 10.29.2026 (Thu) 23:59 PDT (Update 1.4.5)
    startsAt: "2026-10-27T07:00:00Z",
    endsAt: "2026-10-30T07:00:00Z",
    quests: [
      {
        objective: "Complete Void Vessel on any difficulty 2 times",
        rewards: [
          "Vespers Hunting Dog Code",
          "Vespers Hunting Dog Enhanced Cells",
          "Vespers Hunting Dog Stabilizer",
          "Vespers Hunting Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete Axion Plains Field Missions 3 times",
        rewards: [
          "Shackles of Mortality Blueprint",
          "Shackles of Mortality Polymer Syncytium",
          "Shackles of Mortality Synthetic Fiber",
          "Shackles of Mortality Nano Tube",
        ],
      },
      {
        objective: "Complete Sigma Sectors on any difficulty 4 times",
        rewards: [
          "Piercing Light Blueprint",
          "Piercing Light Polymer Syncytium",
          "Piercing Light Synthetic Fiber",
          "Piercing Light Nano Tube",
        ],
      },
      {
        objective: "Complete Infiltration Operations on any difficulty 4 times",
        rewards: [
          "Deus Ex Manus Blueprint",
          "Deus Ex Manus Polymer Syncytium",
          "Deus Ex Manus Synthetic Fiber",
          "Deus Ex Manus Nano Tube",
        ],
      },
      {
        objective:
          "Complete Void Intercept Battles on Extreme Difficulty 5 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 10.30.2026 (Fri) 00:00 PDT - 11.01.2026 (Sun) 22:59 PST (Update 1.4.5)
    startsAt: "2026-10-30T07:00:00Z",
    endsAt: "2026-11-02T07:00:00Z",
    quests: [
      {
        objective: "Complete Mobile Energy Monitoring 4 times",
        rewards: [
          "Ultimate Gley Code",
          "Ultimate Gley Enhanced Cells",
          "Ultimate Gley Stabilizer",
          "Ultimate Gley Spiral Catalyst",
        ],
      },
      {
        objective:
          "Complete Void Erosion Purges on Normal Difficulty for any Stage 4 times",
        rewards: [
          "Nazeistra's Devotion Blueprint",
          "Nazeistra's Devotion Polymer Syncytium",
          "Nazeistra's Devotion Synthetic Fiber",
          "Nazeistra's Devotion Nano Tube",
        ],
      },
      {
        objective: "Complete 400% Infiltration Operations 4 times",
        rewards: [
          "Secret Garden Blueprint",
          "Secret Garden Polymer Syncytium",
          "Secret Garden Synthetic Fiber",
          "Secret Garden Nano Tube",
        ],
      },
      {
        objective: "Complete Intercept Battles on any difficulty 5 times",
        rewards: [
          "Hammer and Anvil Blueprint",
          "Hammer and Anvil Polymer Syncytium",
          "Hammer and Anvil Synthetic Fiber",
          "Hammer and Anvil Nano Tube",
        ],
      },
      { objective: "Defeat the Wall Crasher 1 time", rewards: hqCoreChoice },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 11.01.2026 (Sun) 23:00 - 11.04.2026 (Wed) 22:59 PST (Update 1.4.5)
    startsAt: "2026-11-02T07:00:00Z",
    endsAt: "2026-11-05T07:00:00Z",
    quests: [
      {
        objective: "Complete Special Operations on any difficulty 2 times",
        rewards: [
          "Snowy Sled Dog Code",
          "Snowy Sled Dog Enhanced Cells",
          "Snowy Sled Dog Stabilizer",
          "Snowy Sled Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete Infiltration Operations on any difficulty 4 times",
        rewards: [
          "Fallen Hope Blueprint",
          "Fallen Hope Polymer Syncytium",
          "Fallen Hope Synthetic Fiber",
          "Fallen Hope Nano Tube",
        ],
      },
      {
        objective: "Complete Breach Tracking 3 times",
        rewards: [
          "Blue Beetle Blueprint",
          "Blue Beetle Polymer Syncytium",
          "Blue Beetle Synthetic Fiber",
          "Blue Beetle Nano Tube",
        ],
      },
      {
        objective: "Complete Void Vessel Missions on Hard Difficulty 2 times",
        rewards: [
          "Crime and Punishment Blueprint",
          "Crime and Punishment Polymer Syncytium",
          "Crime and Punishment Synthetic Fiber",
          "Crime and Punishment Nano Tube",
        ],
      },
      {
        objective:
          "Complete Void Intercept Battles on Extreme Difficulty 5 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 11.04.2026 (Wed) 23:00 - 11.07.2026 (Sat) 22:59 PST (Update 1.4.5)
    startsAt: "2026-11-05T07:00:00Z",
    endsAt: "2026-11-08T07:00:00Z",
    quests: [
      {
        objective: "Complete Mobile Energy Monitoring 4 times",
        rewards: [
          "Snowy Sled Dog Code",
          "Snowy Sled Dog Enhanced Cells",
          "Snowy Sled Dog Stabilizer",
          "Snowy Sled Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete Intercept Battles on any difficulty 5 times",
        rewards: [
          "ERASER Blueprint",
          "ERASER Polymer Syncytium",
          "ERASER Synthetic Fiber",
          "ERASER Nano Tube",
        ],
      },
      {
        objective:
          "Complete Void Erosion Purges on Normal Difficulty for any Stage 4 times",
        rewards: [
          "Shackles of Mortality Blueprint",
          "Shackles of Mortality Polymer Syncytium",
          "Shackles of Mortality Synthetic Fiber",
          "Shackles of Mortality Nano Tube",
        ],
      },
      {
        objective: "Complete 400% Infiltration Operations 4 times",
        rewards: [
          "Shadow Blueprint",
          "Shadow Polymer Syncytium",
          "Shadow Synthetic Fiber",
          "Shadow Nano Tube",
        ],
      },
      {
        objective: "Complete Sigma Sectors on any difficulty 4 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 11.07.2026 (Sat) 23:00 - 11.10.2026 (Tue) 22:59 PST (Update 1.4.5)
    startsAt: "2026-11-08T07:00:00Z",
    endsAt: "2026-11-11T07:00:00Z",
    quests: [
      {
        objective: "Complete Infiltration Operations on any difficulty 4 times",
        rewards: [
          "Enzo Code",
          "Enzo Enhanced Cells",
          "Enzo Stabilizer",
          "Enzo Spiral Catalyst",
        ],
      },
      {
        objective: "Complete Special Operation: Hard Difficulty 2 times",
        rewards: [
          "Piercing Light Blueprint",
          "Piercing Light Polymer Syncytium",
          "Piercing Light Synthetic Fiber",
          "Piercing Light Nano Tube",
        ],
      },
      {
        objective: "Complete Axion Plains Operational Areas 3 times",
        rewards: [
          "Secret Garden Blueprint",
          "Secret Garden Polymer Syncytium",
          "Secret Garden Synthetic Fiber",
          "Secret Garden Nano Tube",
        ],
      },
      {
        objective: "Complete 400% Infiltration Operations 4 times",
        rewards: [
          "Deus Ex Manus Blueprint",
          "Deus Ex Manus Polymer Syncytium",
          "Deus Ex Manus Synthetic Fiber",
          "Deus Ex Manus Nano Tube",
        ],
      },
      {
        objective:
          "Complete Void Intercept Battles on Extreme Difficulty 5 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 11.10.2026 (Tue) 23:00 - 11.13.2026 (Fri) 22:59 PST (Update 1.4.5)
    startsAt: "2026-11-11T07:00:00Z",
    endsAt: "2026-11-14T07:00:00Z",
    quests: [
      {
        objective: "Complete Intercept Battles on any difficulty 5 times",
        rewards: [
          "Vespers Hunting Dog Code",
          "Vespers Hunting Dog Enhanced Cells",
          "Vespers Hunting Dog Stabilizer",
          "Vespers Hunting Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete Special Operations on any difficulty 2 times",
        rewards: [
          "Fallen Hope Blueprint",
          "Fallen Hope Polymer Syncytium",
          "Fallen Hope Synthetic Fiber",
          "Fallen Hope Nano Tube",
        ],
      },
      {
        objective: "Complete 400% Infiltration Operations 4 times",
        rewards: [
          "Nazeistra's Devotion Blueprint",
          "Nazeistra's Devotion Polymer Syncytium",
          "Nazeistra's Devotion Synthetic Fiber",
          "Nazeistra's Devotion Nano Tube",
        ],
      },
      {
        objective: "Complete Void Vessel Missions on Hard Difficulty 2 times",
        rewards: [
          "Hammer and Anvil Blueprint",
          "Hammer and Anvil Polymer Syncytium",
          "Hammer and Anvil Synthetic Fiber",
          "Hammer and Anvil Nano Tube",
        ],
      },
      {
        objective: "Complete Sigma Sectors on any difficulty 4 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 11.13.2026 (Fri) 23:00 - 11.16.2026 (Mon) 22:59 PST (Update 1.4.5)
    startsAt: "2026-11-14T07:00:00Z",
    endsAt: "2026-11-17T07:00:00Z",
    quests: [
      {
        objective: "Complete Mobile Energy Monitoring 4 times",
        rewards: [
          "Vespers Hunting Dog Code",
          "Vespers Hunting Dog Enhanced Cells",
          "Vespers Hunting Dog Stabilizer",
          "Vespers Hunting Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete Infiltration Operations on any difficulty 4 times",
        rewards: [
          "ERASER Blueprint",
          "ERASER Polymer Syncytium",
          "ERASER Synthetic Fiber",
          "ERASER Nano Tube",
        ],
      },
      {
        objective: "Complete Supermassive Receptors 3 times",
        rewards: [
          "Blue Beetle Blueprint",
          "Blue Beetle Polymer Syncytium",
          "Blue Beetle Synthetic Fiber",
          "Blue Beetle Nano Tube",
        ],
      },
      {
        objective: "Complete Axion Plains Field Missions 3 times",
        rewards: [
          "Crime and Punishment Blueprint",
          "Crime and Punishment Polymer Syncytium",
          "Crime and Punishment Synthetic Fiber",
          "Crime and Punishment Nano Tube",
        ],
      },
      {
        objective:
          "Complete Void Intercept Battles on Extreme Difficulty 5 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 11.16.2026 (Mon) 23:00 - 11.19.2026 (Thu) 22:59 PST (Update 1.4.5)
    startsAt: "2026-11-17T07:00:00Z",
    endsAt: "2026-11-20T07:00:00Z",
    quests: [
      {
        objective: "Complete Intercept Battles on any difficulty 5 times",
        rewards: [
          "Snowy Sled Dog Code",
          "Snowy Sled Dog Enhanced Cells",
          "Snowy Sled Dog Stabilizer",
          "Snowy Sled Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete Sigma Sectors on any difficulty 4 times",
        rewards: [
          "Piercing Light Blueprint",
          "Piercing Light Polymer Syncytium",
          "Piercing Light Synthetic Fiber",
          "Piercing Light Nano Tube",
        ],
      },
      {
        objective: "Complete 400% Infiltration Operations 4 times",
        rewards: [
          "Shackles of Mortality Blueprint",
          "Shackles of Mortality Polymer Syncytium",
          "Shackles of Mortality Synthetic Fiber",
          "Shackles of Mortality Nano Tube",
        ],
      },
      {
        objective: "Complete Void Vessel Missions on Hard Difficulty 2 times",
        rewards: [
          "Shadow Blueprint",
          "Shadow Polymer Syncytium",
          "Shadow Synthetic Fiber",
          "Shadow Nano Tube",
        ],
      },
      {
        objective: "Complete Special Operation: Hard Difficulty 2 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
  {
    // 11.19.2026 (Thu) 23:00 - 11.22.2026 (Sun) 22:59 PST (Update 1.4.5)
    startsAt: "2026-11-20T07:00:00Z",
    endsAt: "2026-11-23T07:00:00Z",
    quests: [
      {
        objective: "Complete Infiltration Operations on any difficulty 4 times",
        rewards: [
          "Snowy Sled Dog Code",
          "Snowy Sled Dog Enhanced Cells",
          "Snowy Sled Dog Stabilizer",
          "Snowy Sled Dog Spiral Catalyst",
          "2x Special Synthetic Calcium",
        ],
      },
      {
        objective: "Complete Mobile Energy Monitoring 4 times",
        rewards: [
          "Secret Garden Blueprint",
          "Secret Garden Polymer Syncytium",
          "Secret Garden Synthetic Fiber",
          "Secret Garden Nano Tube",
        ],
      },
      {
        objective: "Complete Sigma Sectors on any difficulty 4 times",
        rewards: [
          "Hammer and Anvil Blueprint",
          "Hammer and Anvil Polymer Syncytium",
          "Hammer and Anvil Synthetic Fiber",
          "Hammer and Anvil Nano Tube",
        ],
      },
      {
        objective: "Complete Axion Plains Field Missions 3 times",
        rewards: [
          "Deus Ex Manus Blueprint",
          "Deus Ex Manus Polymer Syncytium",
          "Deus Ex Manus Synthetic Fiber",
          "Deus Ex Manus Nano Tube",
        ],
      },
      {
        objective:
          "Complete Void Intercept Battles on Extreme Difficulty 5 times",
        rewards: hqCoreChoice,
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box I"],
      },
      {
        objective: "Complete Missions of any type 5 times",
        rewards: ["Anais's Research Material Box II"],
      },
    ],
  },
];

/** An event from the update notes, with the times it runs. */
export interface GameEvent {
  /** As the notes write it. */
  readonly name: string;
  /** "Login Event", "Boost Event", "Leaderboard"… as the notes write it. */
  readonly kind: string;
  readonly startsAt: string;
  readonly endsAt: string;
  /** For an event that runs on some days only: the UTC weekdays of those game days. */
  readonly days?: readonly number[];
  /** What it gives or asks, in the notes' words, short. */
  readonly details: string;
  readonly source: string;
}

/**
 * Every event the update notes give a period for that hasn't ended yet when added, newest
 * notes first. An event "after the update" starts here at the update day's 07:00 UTC;
 * the notes give no hour. Each update's events are added from its notes, and ended ones
 * drop off the page by themselves.
 */
export const gameEvents: readonly GameEvent[] = [
  {
    name: "Halloween Pass",
    kind: "Event Pass",
    startsAt: "2026-10-15T07:00:00Z",
    endsAt: "2026-11-17T07:00:00Z",
    details:
      "Max level 30, in the Event Pass menu on the Battle Pass screen. Rewards include the Little Red Riding Hood Costume and the Big Bad Wolf Mask.",
    source: "Update 1.4.5",
  },
  {
    name: "[Login Event] Tactician Medical Support",
    kind: "Login Event",
    startsAt: "2026-10-15T07:00:00Z",
    endsAt: "2026-11-24T07:00:00Z",
    details:
      "33 days. Attendance Memento can be swapped for past attendance rewards.",
    source: "Update 1.4.5",
  },
  {
    name: "Descendant Overhaul Mission",
    kind: "Event Challenge",
    startsAt: "2026-10-15T07:00:00Z",
    endsAt: "2026-11-17T07:00:00Z",
    details: "Played with the rebalanced Freyna, Gley and Enzo.",
    source: "Update 1.4.5",
  },
  {
    name: "[Growth Support] Descendant Overhaul Deployment Mission",
    kind: "Event Challenge",
    startsAt: "2026-10-15T07:00:00Z",
    endsAt: "2026-11-17T07:00:00Z",
    details: "For Mastery Rank 20 or below.",
    source: "Update 1.4.5",
  },
  {
    name: "Battlefield Monster Hunter",
    kind: "Boost Event",
    startsAt: "2026-10-15T07:00:00Z",
    endsAt: "2026-11-17T07:00:00Z",
    details:
      "+15% Transcendent Weapon Acquisition Chance Boost on specific zones and content each day; the World Map's Ongoing Events pop-up shows which.",
    source: "Update 1.4.5",
  },
  {
    name: "Descendant's Weekend",
    kind: "Boost Event",
    startsAt: "2026-10-16T07:00:00Z",
    endsAt: "2026-11-16T07:00:00Z",
    days: [5, 6, 0],
    details:
      "Every Friday, Saturday and Sunday. Karel's Mothership, Infiltration Operations & Sigma Sector: Descendant EXP, Weapon Proficiency, Unique Arche Factor EXP +20%. Special Operations: Gold +20%. Breach Tracking: Gold, Kuiper Shard +20% (when defeating an enemy).",
    source: "Update 1.4.5",
  },
  {
    name: "[Weekday] Accelerate Research Week and [Weekend] Accelerate Research Week",
    kind: "Accelerate Research",
    startsAt: "2026-10-15T07:00:00Z",
    endsAt: "2026-11-17T07:00:00Z",
    details:
      "Clearing Accelerate Research content shortens research time. The Weekend bonus is double the Weekday one.",
    source: "Update 1.4.5",
  },
  {
    name: "[Attendance] Eastern Mystic Gley",
    kind: "Login Event",
    startsAt: "2026-09-17T07:00:00Z",
    endsAt: "2026-10-22T07:00:00Z",
    details: "28 days. Attendance Memento, and new Gley Customizations.",
    source: "Update 1.4.3",
  },
  {
    name: "Exchange Intercept Battle Rewards",
    kind: "Exchange",
    startsAt: "2026-08-20T07:00:00Z",
    endsAt: "2026-11-19T07:00:00Z",
    details:
      'Adds the skin "Blazing One" (for Harris, Dia and Raven) and the Back Attachment "Colotoys - Lava Citadel".',
    source: "Update 1.4.0",
  },
  {
    name: "[Returning] Back to Albion",
    kind: "Event Challenge",
    startsAt: "2026-08-20T07:00:00Z",
    endsAt: "2026-11-12T07:00:00Z",
    details: "Challenges for returning players.",
    source: "Update 1.4.0",
  },
  {
    name: "Boost Path: Ultimate Bunny Build Guide",
    kind: "Starter-only event",
    startsAt: "2026-08-20T07:00:00Z",
    endsAt: "2026-11-17T07:00:00Z",
    details:
      "For Descendants at Mastery Rank 20 or lower: 13 chapters played with Bunny or Ultimate Bunny. Chapter Completion Rewards must be claimed before it ends.",
    source: "Update 1.4.0",
  },
  {
    name: "Void Erosion Purge: Challenge",
    kind: "Leaderboard",
    startsAt: "2026-08-20T07:00:00Z",
    endsAt: "2026-11-18T07:20:00Z",
    details:
      "Solo, all platforms. The Top 100 get the Ingris Prime Challenger Medal (limited-time).",
    source: "Update 1.4.0",
  },
  {
    name: 'Void Intercept Battle: Critical Point Breakthrough "Lava Citadel"',
    kind: "Leaderboard",
    startsAt: "2026-08-20T07:00:00Z",
    endsAt: "2026-11-18T07:20:00Z",
    details:
      "Solo and 2-4 Player Squads, all platforms. The Top 100 get the Critical Point Prime Challenger Medal (limited-time).",
    source: "Update 1.4.0",
  },
];
