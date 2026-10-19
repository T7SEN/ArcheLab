"use client";

import { useSyncExternalStore } from "react";
import { dayAt, dayStart } from "./purge-day";

// "Today" is worked out in the browser (ADR 0053), as the 400% day is (ADR 0049): the
// page is built weekly and the map changes daily. The server's snapshot is null, so the
// static HTML names no day.

/** Re-reads the day when the next one starts, and when the tab comes back. */
function subscribeDay(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    // A second late, so the new day has surely begun.
    const next = dayStart(dayAt(Date.now()) + 1) - Date.now();
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

/** The visitor's day, counted from the cycle's first; null until the browser knows. */
export function usePurgeDay(): number | null {
  return useSyncExternalStore(
    subscribeDay,
    () => dayAt(Date.now()),
    () => null,
  );
}
