"use client";

import { useSyncExternalStore } from "react";
import { currentRotation, rotationAt, weekStart } from "./reward-week";

// "This week" is worked out in the browser (ADR 0048): the page is built on Mondays and
// the week changes on Tuesdays, so the build can't know which week a visitor is in. The
// server's snapshot is null: the static HTML names no week, and React swaps in the
// browser's week after hydrating, without a mismatch.

/** Re-reads the week when the next one starts, and when the tab comes back. */
function subscribeWeek(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    const next = weekStart(rotationAt(Date.now()) + 1) - Date.now();
    // A second late, so the new week has surely begun.
    timer = setTimeout(() => {
      onChange();
      arm();
    }, next + 1000);
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

/** The visitor's week, never before the build's first; null until the browser knows. */
export function useCurrentRotation(firstShipped: number | null): number | null {
  return useSyncExternalStore(
    subscribeWeek,
    () =>
      firstShipped === null ? null : currentRotation(Date.now(), firstShipped),
    () => null,
  );
}

const minuteMs = 60_000;

/** Ticks at the start of each minute, and when the tab comes back. */
function subscribeMinute(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(
      () => {
        onChange();
        arm();
      },
      minuteMs - (Date.now() % minuteMs) + 50,
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

/** The time to the minute, in ms, for countdowns; null until the browser knows. */
export function useMinuteClock(): number | null {
  const minute = useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / minuteMs),
    () => null,
  );
  return minute === null ? null : minute * minuteMs;
}
