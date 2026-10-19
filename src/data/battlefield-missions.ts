/**
 * Update 1.4.0's "Hard Battlefield Missions" table (https://tfd.nexon.com/en/news/3528592,
 * 2026-08-20; local copy `research_notes/TFD update notes 1.4.0 on/1.4.0.md`, lines 1213
 * to 1334): every battlefield of the eight regions with its Hard battlefield missions, in
 * the table's order and spelling (T7SEN, 2026-10-18; ADR 0048). The Difficulty Level
 * Rewards page reads its regions, battlefields and missions from here, joined to the
 * reward list and the drop places at build time. Checked 2026-10-18: all 118 mission
 * names match the drop places on Normal and on Hard, by exact name within the region.
 */

/** One battlefield as the table lists it. */
export interface TableBattlefield {
  /** As the table writes it: "The Sterile Land". */
  readonly region: string;
  /** As the table writes it: "Fallen Theater". */
  readonly battlefield: string;
  readonly missions: readonly string[];
}

export const battlefieldMissions: readonly TableBattlefield[] = [
  {
    region: "Kingston",
    battlefield: "The Destruction",
    missions: [
      "Field Communications Center",
      "Urban District",
      "Kingston Communications Repeater",
      "The Last Emergency Communicator",
    ],
  },
  {
    region: "Kingston",
    battlefield: "Fallen Theater",
    missions: ["Vulgus Occupied Buildings", "Vulgus Field Generator"],
  },
  {
    region: "Kingston",
    battlefield: "Grand Square",
    missions: [
      "Kingston Surveillance Radar",
      "Suspicious Battery Pack",
      "Vulgus Data Transmitter",
    ],
  },
  {
    region: "The Sterile Land",
    battlefield: "Rockfall",
    missions: [
      "Anticipated Ambush Point",
      "Patrol Route",
      "Deception Transmitter",
      "External Reactor",
    ],
  },
  {
    region: "The Sterile Land",
    battlefield: "The Repository",
    missions: ["Kuiper Storage Tank", "Kuiper Refinery", "Kuiper Mine"],
  },
  {
    region: "The Sterile Land",
    battlefield: "Restricted Zone",
    missions: [
      "The Barracks",
      "The Base's Power Grid",
      "Defense Garrison Rally Point",
      "High-powered Jammer",
    ],
  },
  {
    region: "The Sterile Land",
    battlefield: "The Ironworks",
    missions: [
      "Weapon Processing Facility",
      "Wastewater Treatment Plant",
      "Logistics Facility",
    ],
  },
  {
    region: "The Sterile Land",
    battlefield: "Classified Area",
    missions: [
      "Large Nuclear Reactor",
      "Weapons Engineering Facility",
      "Biological Research Facility",
    ],
  },
  {
    region: "Vespers",
    battlefield: "The Lumber Yard",
    missions: ["Frontline Base", "Collapsed Piers", "Ruins Path"],
  },
  {
    region: "Vespers",
    battlefield: "The Ruins",
    missions: [
      "Ruins Courtyard",
      "Destroyed Temple",
      "Ruins Underground Entrance",
    ],
  },
  {
    region: "Vespers",
    battlefield: "Lost Supply Depot",
    missions: ["Captured Base", "Abandoned Village", "Mossy Colossus"],
  },
  {
    region: "Vespers",
    battlefield: "Moonlight Lake",
    missions: ["Lakeside", "Old Surveillance Station", "Floodplain"],
  },
  {
    region: "Vespers",
    battlefield: "Timberfall",
    missions: [
      "Supply Depot",
      "Ancient Giant Tree",
      "Organic Recording Terminal",
      "Timberfall Power Facility",
    ],
  },
  {
    region: "Echo Swamp",
    battlefield: "Misty Woods",
    missions: [
      "Hazy Swamp",
      "Traces of Colossi Interceptions",
      "Kuiper Transport Route",
    ],
  },
  {
    region: "Echo Swamp",
    battlefield: "Abandoned Zone",
    missions: [
      "Environment Contamination Zone",
      "Abandoned Refinery Unit",
      "Abandoned Zone",
    ],
  },
  {
    region: "Echo Swamp",
    battlefield: "Muskeg Swamp",
    missions: ["Arche Motion Sensor", "The Tree of Truth"],
  },
  {
    region: "Echo Swamp",
    battlefield: "Derelict Covert",
    missions: [
      "Verdant Greenery",
      "Field Energy Station",
      "Old Human Base",
      "Ghost Marsh",
      "Emergency Landing Strip",
    ],
  },
  {
    region: "Agna Desert",
    battlefield: "Vermilion Waste",
    missions: [
      "Baggage Transport Base",
      "Surveillance Location",
      "Rock Cave Base",
    ],
  },
  {
    region: "Agna Desert",
    battlefield: "The Remnant",
    missions: ["Outpost Workshop", "Abandoned Reconstruction Site"],
  },
  {
    region: "Agna Desert",
    battlefield: "The Storage",
    missions: [
      "Kuiper Depot",
      "Stolen Spectral Digger",
      "Previous Construct Team Quarters",
    ],
  },
  {
    region: "Agna Desert",
    battlefield: "Mining Site",
    missions: ["Mining Beacon", "Ossuary", "Excavation Team Directional Radar"],
  },
  {
    region: "Agna Desert",
    battlefield: "Miragestone",
    missions: ["Heavy Equipment Entry Path", "Commanding Ground", "Red Sphere"],
  },
  {
    region: "White-night Gulch",
    battlefield: "The Mountaintops",
    missions: [
      "Order's Patrol Beat",
      "Ancient Transmission Detection Facility",
      "Decoy Operation Zone",
      "Triumphal Arch",
      "Border Line of Truth",
    ],
  },
  {
    region: "White-night Gulch",
    battlefield: "Moongrave Basin",
    missions: [
      "Cave Rally Point",
      "Water-cooling Recording Device",
      "Forgotten Comms Device",
      "Deployment Area of the Order's Forces",
    ],
  },
  {
    region: "White-night Gulch",
    battlefield: "Observatory",
    missions: [
      "Order's Veil",
      "Order's Occupied Facility",
      "Order Supply Warehouse",
      "Eye of Truth",
    ],
  },
  {
    region: "White-night Gulch",
    battlefield: "Shipment Base",
    missions: [
      "Fortress Outskirts",
      "DNA Detector Spray Zone",
      "Fortress Courtyard",
      "Fortress Control Facility",
      "Altar",
    ],
  },
  {
    region: "White-night Gulch",
    battlefield: "Hatchery",
    missions: ["Upper Hatchery", "Lower Hatchery"],
  },
  {
    region: "Hagios",
    battlefield: "Dune Base",
    missions: ["Vulgus Blockade", "Recon Squad's Trail", "Ally Retreat Route"],
  },
  {
    region: "Hagios",
    battlefield: "The Corrupted Zone",
    missions: ["Ransacked Village", "Crimson Contaminated Area", "Deep Digger"],
  },
  {
    region: "Hagios",
    battlefield: "Fractured Monolith",
    missions: [
      "The Cliff",
      "Large Supply Transport Point",
      "Ruins Modification Base",
    ],
  },
  {
    region: "Hagios",
    battlefield: "Forward Base",
    missions: [
      "Cargo Management Zone",
      "Broadband Fleet Beacon",
      "Antiaircraft Defensive Position",
      "The Passage to the Ruins",
    ],
  },
  {
    region: "Hagios",
    battlefield: "Starfall Road",
    missions: [
      "Ancient Quantum Facility",
      "Tethered Energy Position",
      "Ruins Guard Facility",
    ],
  },
  {
    region: "The Fortress",
    battlefield: "Aurora Forest",
    missions: ["Outlying Communications Facility", "Snowy Heights"],
  },
  {
    region: "The Fortress",
    battlefield: "Frozen Valley",
    missions: [
      "Gate System Control Network",
      "Munitions Loading Dock",
      "Command Relay",
    ],
  },
  {
    region: "The Fortress",
    battlefield: "Fallen Ark",
    missions: ["Ship Charging Facility", "Frozen Shipyard"],
  },
  {
    region: "The Fortress",
    battlefield: "Convertor Facility",
    missions: [
      "Giant Hangar",
      "High-thermal Source Detected Zone",
      "Central Control Unit",
    ],
  },
  {
    region: "The Fortress",
    battlefield: "Defense Line",
    missions: [
      "Destroyed Base",
      "Explosive Debris",
      "Fortress Command Entrance",
    ],
  },
];

/** The table's region names that the reward list and drop places write otherwise. */
export const tableRegionAliases: Readonly<Record<string, string>> = {
  "The Sterile Land": "Sterile Land",
  "The Fortress": "Fortress",
};

/** The table's battlefield names that the reward list writes otherwise. */
export const tableBattlefieldAliases: Readonly<Record<string, string>> = {
  "Fallen Theater": "The Fallen Theater",
  "The Repository": "Repository",
  "The Ironworks": "Ironworks",
  "The Remnant": "Remnant",
  "Mining Site": "The Mining Site",
  "Aurora Forest": "The Aurora Forest",
};
