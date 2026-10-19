"use client";

import { useEffect, useRef, useState } from "react";
import { motionAllowed } from "@/components/motion";

/**
 * A page that shows one choice's details below its list, such as the 400% Infiltration
 * Operations and Axion Operational Areas pages, scrolls them into view and moves focus to
 * their heading when the visitor picks what they show (T7SEN, 2026-10-19), and when the
 * page opens on a link that names one. Picking a day doesn't move the page.
 */

/**
 * How many times the details were asked for: 1 when the page opens on a named choice,
 * and up by one on each pick. Pass `request` to the details panel; call `focus` on a pick.
 */
export function useDetailsRequest(opened: boolean): {
  readonly request: number;
  readonly focus: () => void;
} {
  const [request, setRequest] = useState(() => (opened ? 1 : 0));
  return {
    request,
    focus: () => {
      setRequest((count) => count + 1);
    },
  };
}

/**
 * The details panel's side: its refs, and the scroll and focus on each request. The panel
 * wants `detailsScrollMargin`, so the floating navbar doesn't cover its top, and the
 * heading `tabIndex={-1}`.
 */
export function useDetailsFocus<
  Panel extends HTMLElement,
  Heading extends HTMLElement,
>(request: number) {
  const panelRef = useRef<Panel>(null);
  const headingRef = useRef<Heading>(null);
  useEffect(() => {
    if (request === 0) {
      return;
    }
    panelRef.current?.scrollIntoView({
      behavior: motionAllowed() ? "smooth" : "auto",
      block: "start",
    });
    headingRef.current?.focus({ preventScroll: true });
  }, [request]);
  return { panelRef, headingRef };
}

/** Room above a details panel scrolled into view, for the floating navbar. */
export const detailsScrollMargin =
  "scroll-mt-[calc(var(--site-header-height)+1rem)]";
