import { useEffect, type RefObject } from "react";

/**
 * Opening a card's details in an index's grid (ADR 0025, ADR 0026): focus moves to the
 * details' name, so a screen reader announces it, and the details come into view, below
 * the navbar. Run once, when the details mount.
 */
export function useRevealDetails(
  sectionRef: RefObject<HTMLElement | null>,
  titleRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const section = sectionRef.current;
    if (section === null) {
      return;
    }
    titleRef.current?.focus({ preventScroll: true });
    const { top, bottom } = section.getBoundingClientRect();
    if (top < window.innerHeight * 1.5 && bottom > 0) {
      // Opened from a card in view: a short scroll, smooth unless motion is reduced
      // (the page's scroll-behavior).
      section.scrollIntoView({ block: "nearest" });
      return;
    }
    // Far off, as from a shared link: jump, since a smooth scroll over hundreds of
    // cards overshoots. Off-screen cards may be drawn at a guessed height
    // (`content-visibility`), so jump again once the cards around it have their own.
    section.scrollIntoView({ block: "center", behavior: "instant" });
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        section.scrollIntoView({ block: "center", behavior: "instant" });
      });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [sectionRef, titleRef]);
}
