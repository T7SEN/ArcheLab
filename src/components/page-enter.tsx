"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { motionAllowed } from "@/components/motion";

/**
 * Every page fades in and rises 8px (ADR 0030): on the first load through CSS, which
 * runs before React does, and on each move to another page through the Web Animations
 * API. A new query or hash (an index's filters, a page's tabs) is the same page and
 * doesn't move it.
 */
export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(pathname);
  useLayoutEffect(() => {
    if (previous.current === pathname) {
      return;
    }
    previous.current = pathname;
    if (ref.current === null || !motionAllowed()) {
      return;
    }
    ref.current.animate(
      [
        { opacity: 0, translate: "0 8px" },
        { opacity: 1, translate: "0 0" },
      ],
      { duration: 300, easing: "ease-out" },
    );
  }, [pathname]);
  return (
    <div
      ref={ref}
      className="duration-300 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
    >
      {children}
    </div>
  );
}
