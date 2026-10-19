"use client";

import { useSyncExternalStore } from "react";

/**
 * The Wall Crasher alert (T7SEN, 2026-10-19; ADR 0054): on or off, and how many minutes
 * before each spawn. Kept in this browser only, with every access wrapped, so the page
 * works without storage; then it lasts until the page is left.
 */

export interface AlertSettings {
  readonly on: boolean;
  readonly minutes: number;
}

/** The lead times offered, in minutes. */
export const alertMinutes: readonly number[] = [1, 2, 5, 10];

export const defaultAlert: AlertSettings = { on: false, minutes: 5 };

const storageKey = "archelab:wall-crasher-alert";

/** The settings from their stored text; anything unreadable is the default. */
export function parseAlertSettings(raw: string | null): AlertSettings {
  if (raw === null) {
    return defaultAlert;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return defaultAlert;
    }
    const record = value as Record<string, unknown>;
    const minutes = record.minutes;
    return {
      on: record.on === true,
      minutes:
        typeof minutes === "number" && alertMinutes.includes(minutes)
          ? minutes
          : defaultAlert.minutes,
    };
  } catch {
    return defaultAlert;
  }
}

/** What was saved when storage can't be written. */
let memory: string | null = null;
let cache: { readonly raw: string | null; readonly value: AlertSettings } = {
  raw: null,
  value: defaultAlert,
};
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(storageKey) ?? memory;
  } catch {
    return memory;
  }
}

function snapshot(): AlertSettings {
  const raw = readRaw();
  if (raw !== cache.raw) {
    cache = { raw, value: parseAlertSettings(raw) };
  }
  return cache.value;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab's change.
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The visitor's alert; off in the static HTML. */
export function useAlertSettings(): AlertSettings {
  return useSyncExternalStore(subscribe, snapshot, () => defaultAlert);
}

/** Saves the visitor's alert, in storage when it can. */
export function saveAlertSettings(next: AlertSettings): void {
  const raw = JSON.stringify(next);
  memory = raw;
  try {
    window.localStorage.setItem(storageKey, raw);
  } catch {
    // Storage blocked or full: kept in memory for this visit.
  }
  for (const listener of listeners) {
    listener();
  }
}
