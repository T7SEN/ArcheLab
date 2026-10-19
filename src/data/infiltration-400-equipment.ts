/**
 * What each 400% Infiltration Operation gives besides materials and cores (T7SEN,
 * 2026-10-19; ADR 0049): its modules, its reactor and its external component sets.
 * NEXON's open data has no drop places for equipment, so these are tfdhub.gg's lists,
 * read 2026-10-19 (`research_notes/TFD 400 equipment tfdhub/`); tfdhub's pages are a
 * valid source, not provisional (T7SEN, 2026-10-19). A set stands for its four pieces,
 * which tfdhub lists. Heart of the Fortress isn't in tfdhub's rotation,
 * so it has no lists.
 */

export interface Equipment400 {
  readonly modules: readonly string[];
  /** The reactor it gives; its rolls follow the Descendant in use (1.3.28 notes). */
  readonly reactor: string | null;
  /**
   * External component sets, by their pieces' name without the slot, as tfdhub lists
   * the pieces ("Volcanic" for the Active Volcano set's "Volcanic Sensor"), or a name with no set
   * (HP Support). Always two: "Every single 400% mission MUST include 2 sets on it's
   * rewards list. This is how the game is coded." (T7SEN, 2026-10-19). A build warns
   * otherwise.
   */
  readonly componentSets: readonly string[];
}

/** By operation, as the game names it. */
export const equipment400: Readonly<Partial<Record<string, Equipment400>>> = {
  "Seed Vault": {
    modules: [
      "Focus Fire",
      "Predator Instinct",
      "Singer's Mercy",
      "Singing Water",
    ],
    reactor: "Tingling Mixture Reactor",
    componentSets: ["Bravery", "Crusader Knight"],
  },
  "Mystery's End": {
    modules: ["Fierce Attack", "Hypothermia", "Noise Surge", "Shattered Heart"],
    reactor: "Burning Mechanics Reactor",
    componentSets: ["Fire Brand", "Volcanic"],
  },
  "The Asylum": {
    modules: [
      "Classic Chef",
      "Self-Directed Eruption",
      "Supercooled Kuiper Round",
      "Supply Firearm Enhancer",
    ],
    reactor: "Toxic Singularity Reactor",
    componentSets: ["Invader", "Sprint Accelerator"],
  },
  "Unknown Laboratory": {
    modules: [
      "Creative Explosion",
      "Frost Bullet",
      "Tidal Wave",
      "Venom Synthesis",
    ],
    reactor: "Frozen Mechanics Reactor",
    componentSets: ["Hazmat Disposal Team", "Venom Essence"],
  },
  "The Chapel": {
    modules: [
      "Contagion",
      "Duty and Sacrifice",
      "Focused Edge",
      "Restored Heart",
    ],
    reactor: "Materialized Mixture Reactor",
    componentSets: ["Frozen Heart", "Unpredictable"],
  },
  "The Forgottense": {
    modules: [
      "Aggressive Melody",
      "Flame-Grilled Special",
      "Super Senses",
      "Superconductive Bombing MARK 2",
    ],
    reactor: "Materialized Phase Reactor",
    componentSets: ["Distorted Resolve", "Plague"],
  },
  "The Shelter": {
    modules: [
      "Explosive Evade",
      "Release Cutting Force",
      "Turret Engineering",
      "Water Play",
    ],
    reactor: "Burning Phase Reactor",
    componentSets: ["Annihilation", "Enlightened Mage"],
  },
  "Slumber Valley": {
    modules: [
      "Cluster Bomb",
      "Cryogenic Cluster Shot",
      "Electric Link",
      "Glacial Cloud",
    ],
    reactor: "Toxic Mechanics Reactor",
    componentSets: ["Pulsating Power", "Supernova"],
  },
  "Quarantine Zone": {
    modules: [
      "Bionic Fuel",
      "Mobile Strike",
      "Septic Torrent",
      "Void Explosion : Focus",
    ],
    reactor: "Tingling Singularity Reactor",
    componentSets: ["Hunter", "Manus"],
  },
  "The Haven": {
    modules: [
      "Absolute-Zero",
      "Camouflaged Sniping",
      "Increased Efficiency",
      "Void Charge",
    ],
    reactor: "Materialized Singularity Reactor",
    // Ascending Armory matches NEXON's Library: "[ Hagios ] [ Hard ] - [ The Haven ]
    // complete [ 400% ]".
    componentSets: ["Ascending Armory", "Polar Night"],
  },
  "Caligo Ossuary": {
    modules: [
      "Cold Heart",
      "Immediate Purge Code",
      "Matrix Recomputation",
      "Toxic Stimulation",
    ],
    reactor: "Frozen Phase Reactor",
    componentSets: ["Hungry Sonic", "Moving Fortress"],
  },
  "Magister Lab": {
    modules: [
      "Explosive Stacks",
      "Massive Sanguification",
      "Power Unit Change",
      "Proliferating Allergy",
    ],
    reactor: null,
    // Update 1.4.3 (Updated #2) says "Eliminated External Components dropped from the
    // 'Magister Lab.'", but T7SEN checked in game that it gives Slayer and HP Support,
    // as tfdhub lists (2026-10-19: "I checked in game it does drop these 2.").
    componentSets: ["Slayer", "HP Support"],
  },
};
