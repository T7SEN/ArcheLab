import { useLayoutEffect, useRef, useState, type RefObject } from "react";

// The site's motion (ADR 0030): short, light, decoration only. CSS animations follow the
// reduced-motion rule in globals.css; these hooks drive the Web Animations API, which
// that rule can't reach, so they check the setting themselves.

/** Whether the visitor allows motion (`prefers-reduced-motion` is not "reduce"). */
export function motionAllowed(): boolean {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** How far a switch's content slides in, in pixels, and for how long, in ms. */
const slideDistance = 16;
const slideDuration = 200;

/**
 * Slides an element in when `value` changes: from the right when the new choice comes
 * after the old one in `order`, from the left otherwise, fading in, like the page tabs.
 * Nothing moves on the first render. Attach the returned ref to the content that
 * changes, not to the switch.
 */
export function useSlideIn<T extends HTMLElement>(
  value: string,
  order: readonly string[],
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const previous = useRef(value);
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = value;
    const element = ref.current;
    if (from === value || element === null || !motionAllowed()) {
      return;
    }
    const side = order.indexOf(value) < order.indexOf(from) ? -1 : 1;
    element.animate(
      [
        { opacity: 0, translate: `${String(side * slideDistance)}px 0` },
        { opacity: 1, translate: "0 0" },
      ],
      { duration: slideDuration, easing: "ease-out" },
    );
  }, [value, order]);
  return ref;
}

/**
 * True once `value` has differed from its first value, and from then on. An index uses
 * it so its cards fade in only when a filter brings them, never on the first render,
 * which after a Suspense fallback would make every card blink.
 */
export function useChangedSince(value: string): boolean {
  const [first] = useState(value);
  const [changed, setChanged] = useState(false);
  if (!changed && value !== first) {
    // Storing what an earlier render saw, as React's docs allow: one extra render.
    setChanged(true);
  }
  return changed || value !== first;
}

/**
 * Keeps the last open item on screen while it closes: `[shown, closing, closed]`.
 * `shown` is the open item, or the one closing; call `closed` when its exit has run.
 * Opening another item replaces a closing one at once. Items are compared by `key`.
 */
export function useClosing<T>(
  current: T | null,
  key: (item: T) => string,
): readonly [shown: T | null, closing: boolean, closed: () => void] {
  const [last, setLast] = useState(current);
  if (current !== null && (last === null || key(current) !== key(last))) {
    setLast(current);
  }
  const shown = current ?? last;
  return [
    shown,
    current === null && last !== null,
    () => {
      setLast(null);
    },
  ] as const;
}
