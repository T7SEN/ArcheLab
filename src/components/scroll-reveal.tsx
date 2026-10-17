"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motionAllowed } from "@/components/motion";

/**
 * The home page's sections fade up the first time they scroll into view, their carousel
 * cards one after another (ADR 0030; `[data-reveal]` in globals.css). Only sections that
 * start below the fold wait: what is on screen at load stays put, and without
 * JavaScript, or with reduced motion, every section simply shows.
 */
export function ScrollReveal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (root === null || !motionAllowed()) {
      return;
    }
    const below = [...root.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.getBoundingClientRect().top > window.innerHeight,
    );
    if (below.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            entry.target.dataset.reveal = "shown";
            observer.unobserve(entry.target);
          }
        }
      },
      // A section shows once its top is a tenth of the screen above the bottom edge.
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const section of below) {
      section.dataset.reveal = "waiting";
      observer.observe(section);
    }
    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
