"use client";

import { useSyncExternalStore } from "react";
import { localDays } from "./mission-filters";
import { rotationAt, rotationStart } from "./rotation";

// The rotation is worked out in the browser (ADR 0052), as the 400% day is (ADR 0049):
// the page is built weekly and the missions change every two hours. The server's
// snapshot is null, so the static HTML names no rotation and no day.

/** The rotation and the visitor's local day, as one value that changes with either. */
function moment(): string {
  const now = Date.now();
  return `${String(rotationAt(now))} ${String(localDays(now, 1)[0]?.start ?? 0)}`;
}

/**
 * Re-reads the moment when the next rotation starts or the local day ends, whichever is
 * first, and when the tab comes back.
 */
function subscribeMoment(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    const now = Date.now();
    const next = Math.min(
      rotationStart(rotationAt(now) + 1),
      localDays(now, 1)[0]?.end ?? Infinity,
    );
    // A second late, so the change has surely happened.
    timer = setTimeout(
      () => {
        onChange();
        arm();
      },
      next - now + 1000,
    );
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") {
      onChange();
      arm();
    }
  };
  arm();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/**
 * The rotation active now and the start of the visitor's day, in ms; null until the
 * browser knows.
 */
export function useAxionMoment(): {
  readonly rotation: number;
  readonly today: number;
} | null {
  const value = useSyncExternalStore(subscribeMoment, moment, () => null);
  if (value === null) {
    return null;
  }
  const [rotation = "0", today = "0"] = value.split(" ");
  return { rotation: Number(rotation), today: Number(today) };
}
