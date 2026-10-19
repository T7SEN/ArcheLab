import "server-only";
import { fetchRewardSchedule } from "./difficulty-rewards";
import { operation400Places } from "./infiltration-400";
import { fetchAcquisitions } from "./shared-sets";

/**
 * Pages for drop places, by NEXON's place id (T7SEN, 2026-10-18; ADR 0050): a 400%
 * Infiltration Operation's places at 400% open it on the 400% Infiltration Operations
 * page, and a battlefield's missions, outpost and Void Fusion Reactor open it on the
 * Difficulty Level Rewards page. By id, not name: a 400% place's name says "[Hard]", as
 * the Hard one's does. Every page that lists where an item drops links through this.
 */

let operationsPromise: Promise<readonly string[]> | null = null;

/**
 * The 400% Infiltration Operations' addresses ("the-shelter"), from the drop places
 * alone: each Transcendent weapon's How to obtain tab links its Hard 400% rows.
 */
export function fetchOperation400Slugs(): Promise<readonly string[]> {
  operationsPromise ??= fetchAcquisitions().then((acquisitions) => [
    ...new Set(operation400Places(acquisitions).values()),
  ]);
  return operationsPromise;
}

let hrefsPromise: Promise<ReadonlyMap<string, string>> | null = null;

/** Every place with a page, fetched once per build worker. */
export function fetchPlaceHrefs(): Promise<ReadonlyMap<string, string>> {
  hrefsPromise ??= Promise.all([
    fetchAcquisitions(),
    fetchRewardSchedule(),
  ]).then(([acquisitions, schedule]) => {
    const hrefs = new Map<string, string>();
    for (const [id, slug] of operation400Places(acquisitions)) {
      hrefs.set(id, `/infiltration-400?operation=${slug}`);
    }
    for (const [id, slug] of schedule.placeBattlefields) {
      hrefs.set(id, `/difficulty-level-rewards?battlefield=${slug}`);
    }
    return hrefs;
  });
  return hrefsPromise;
}
