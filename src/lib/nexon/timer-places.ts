import "server-only";
import { bountyTargets, wallCrasher } from "@/data/timers";
import { slugOf } from "@/lib/slug";
import { sourceText, type AcquisitionRecord } from "./shared-sets";

/**
 * The drop places the Timers page covers (ADR 0054), by NEXON id, with their link: a
 * Bounty Operations target's ("[Bounty Operations] - [Hungry Abyss Scarab] - [Sync Loot
 * Reward]", and its completion) opens the bounty week with it marked, and Wall Crasher's
 * ("[Axion Plains] Intercept Battle: [Wall Crasher] [Hard]") opens its timer.
 */
export function timerPlaces(
  acquisitions: readonly AcquisitionRecord[],
): Map<string, string> {
  const targets = new Set(bountyTargets.map((target) => target.name));
  const found = new Map<string, string>();
  for (const record of acquisitions) {
    const name = sourceText(record.acquisition_detail_name);
    const bounty = /^\[Bounty Operations\] - \[([^\]]+)\]/.exec(name)?.[1];
    if (bounty !== undefined && targets.has(bounty)) {
      found.set(
        record.acquisition_detail_id,
        `/timers?bounty=${slugOf(bounty)}`,
      );
    } else if (name.includes(`Intercept Battle: [${wallCrasher.name}]`)) {
      found.set(record.acquisition_detail_id, "/timers#wall-crasher");
    }
  }
  return found;
}
