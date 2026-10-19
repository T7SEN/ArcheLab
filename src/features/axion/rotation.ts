import { axionCycle, axionRotation } from "@/data/axion-operational-areas";

/**
 * The Axion Operational Areas' rotations (ADR 0052): a pair of missions every
 * `axionRotation.hours` hours from `axionRotation.startsAt`, the cycle repeating.
 * Rotations are counted from the cycle's first. Pure, on times in ms: the browser works
 * out the visitor's local days and the tests pass them in.
 */

export const rotationMs = axionRotation.hours * 60 * 60 * 1000;

const anchorMs = Date.parse(axionRotation.startsAt);

/** The rotation that holds `ms`, counted from the cycle's first. */
export function rotationAt(ms: number): number {
  return Math.floor((ms - anchorMs) / rotationMs);
}

/** When a rotation starts, in ms since the epoch. */
export function rotationStart(rotation: number): number {
  return anchorMs + rotation * rotationMs;
}

/** A rotation's two missions, by name. */
export function pairIn(rotation: number): readonly [string, string] | null {
  const length = axionCycle.length;
  return length === 0
    ? null
    : (axionCycle[((rotation % length) + length) % length] ?? null);
}

/** Every rotation active at some moment from `from` up to `to` (ms, `to` excluded). */
export function rotationsBetween(from: number, to: number): number[] {
  const rotations: number[] = [];
  for (
    let rotation = rotationAt(from);
    rotationStart(rotation) < to;
    rotation += 1
  ) {
    rotations.push(rotation);
  }
  return rotations;
}

/** The next `count` rotations from `from` on, `from` included, with a mission in them. */
export function rotationsOf(
  name: string,
  from: number,
  count: number,
): number[] {
  const found: number[] = [];
  for (
    let rotation = from;
    found.length < count && rotation < from + axionCycle.length * count;
    rotation += 1
  ) {
    if (pairIn(rotation)?.includes(name) === true) {
      found.push(rotation);
    }
  }
  return found;
}
