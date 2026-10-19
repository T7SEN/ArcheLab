"use client";

import { useSyncExternalStore } from "react";

/**
 * The missions a visitor follows (T7SEN, 2026-10-19; ADR 0052): favorites, and the ones
 * whose turn shows a notice from the browser while the page is open. Kept in this
 * browser only, with every access wrapped, so the page works without storage; then they
 * last until the page is left.
 */

export interface SavedMissions {
  /** Mission addresses ("first-crater"). */
  readonly favorites: readonly string[];
  readonly alerts: readonly string[];
}

const empty: SavedMissions = { favorites: [], alerts: [] };

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

/** The saved missions from their stored text; anything unreadable is nothing saved. */
export function parseSavedMissions(raw: string | null): SavedMissions {
  if (raw === null) {
    return empty;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return empty;
    }
    const record = value as Record<string, unknown>;
    return {
      favorites: strings(record.favorites),
      alerts: strings(record.alerts),
    };
  } catch {
    return empty;
  }
}

/**
 * A store of saved lists under its own storage key: the Axion missions here, and Void
 * Erosion Purge's maps (ADR 0053).
 */
export function savedStore(storageKey: string): {
  /** The visitor's saved lists; none in the static HTML. */
  readonly useSaved: () => SavedMissions;
  /** Saves the visitor's lists, in storage when it can. */
  readonly save: (next: SavedMissions) => void;
} {
  /** What was saved when storage can't be written. */
  let memory: string | null = null;
  let cache: { readonly raw: string | null; readonly value: SavedMissions } = {
    raw: null,
    value: empty,
  };
  const listeners = new Set<() => void>();

  const readRaw = (): string | null => {
    try {
      return window.localStorage.getItem(storageKey) ?? memory;
    } catch {
      return memory;
    }
  };

  const snapshot = (): SavedMissions => {
    const raw = readRaw();
    if (raw !== cache.raw) {
      cache = { raw, value: parseSavedMissions(raw) };
    }
    return cache.value;
  };

  const subscribe = (listener: () => void): (() => void) => {
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
  };

  return {
    useSaved: () => useSyncExternalStore(subscribe, snapshot, () => empty),
    save: (next) => {
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
    },
  };
}

const axionStore = savedStore("archelab:axion-missions");

/** The visitor's saved missions; none in the static HTML. */
export const useSavedMissions = axionStore.useSaved;

/** Saves the visitor's missions, in storage when it can. */
export const saveMissions = axionStore.save;

/** A list with `slug` added, or taken out when it is there. */
export function toggled(list: readonly string[], slug: string): string[] {
  return list.includes(slug)
    ? list.filter((entry) => entry !== slug)
    : [...list, slug];
}

/** Whether this browser can show notices: "unsupported" where it can't. */
export type NoticePermission = NotificationPermission | "unsupported";

const permissionListeners = new Set<() => void>();

function permissionNow(): NoticePermission {
  return typeof Notification === "undefined"
    ? "unsupported"
    : Notification.permission;
}

/** The browser's answer on notices; "default" (not asked) in the static HTML. */
export function useNoticePermission(): NoticePermission {
  return useSyncExternalStore(
    (listener) => {
      permissionListeners.add(listener);
      return () => {
        permissionListeners.delete(listener);
      };
    },
    permissionNow,
    () => "default",
  );
}

/** Asks the browser for notices, once: after a press, as browsers require. */
export async function askForNotices(): Promise<NoticePermission> {
  if (permissionNow() === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      // An old browser without the promise form: its answer still shows below.
    }
  }
  for (const listener of permissionListeners) {
    listener();
  }
  return permissionNow();
}
