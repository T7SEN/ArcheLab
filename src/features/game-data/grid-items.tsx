"use client";

import { cn } from "cn";
import { LoaderCircle } from "lucide-react";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motionAllowed } from "@/components/motion";

// An index's grid items (ADR 0030): its cards, the row its open details sit in, and,
// for a long index, the strip that draws more cards as the page nears it (ADR 0031).

/**
 * How many batches of cards a long index draws (`card-batches.ts`), and a function that
 * adds one. New filters (`resetKey`) start again from one batch; `needed` keeps enough
 * drawn for a card that must show, such as the open card of a shared link, and stays
 * drawn after it closes, so the page never shrinks under the reader.
 */
export function useCardBatches(
  resetKey: string,
  needed: number,
): readonly [batches: number, more: () => void] {
  const [state, setState] = useState({ key: resetKey, batches: needed });
  const batches = Math.max(state.key === resetKey ? state.batches : 1, needed);
  if (state.key !== resetKey || state.batches !== batches) {
    // Storing what this render settled, as React's docs allow: one extra render.
    setState({ key: resetKey, batches });
  }
  return [
    batches,
    () => {
      setState((current) => ({ ...current, batches: current.batches + 1 }));
    },
  ] as const;
}

/**
 * The strip under a long index's last drawn card: when it comes within a screen of
 * view, the next batch is drawn, and again while it stays that close (the observer is
 * made afresh for each batch, and reports at once if the strip is still near). Gone
 * once every card is drawn.
 */
export function MoreCards({
  drawn,
  total,
  noun,
  onMore,
}: {
  drawn: number;
  total: number;
  /** What the cards are, for screen readers: "modules". */
  noun: string;
  onMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const more = useEffectEvent(onMore);
  useEffect(() => {
    const strip = ref.current;
    if (strip === null || drawn >= total) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          more();
        }
      },
      { rootMargin: "0px 0px 100% 0px" },
    );
    observer.observe(strip);
    return () => {
      observer.disconnect();
    };
  }, [drawn, total]);
  if (drawn >= total) {
    return null;
  }
  return (
    <div ref={ref} className="flex h-16 items-center justify-center">
      <LoaderCircle
        aria-hidden="true"
        className="size-5 animate-spin text-muted-foreground"
      />
      <span className="sr-only">
        Showing {drawn} of {total} {noun}; more show as you scroll.
      </span>
    </div>
  );
}

/**
 * A card in an index's grid. With `enter`, it fades and grows in as it mounts: the
 * index passes `useChangedSince(search)`, so cards a filter brings in arrive softly,
 * and the first render doesn't move. The flag is read once, at mount, so cards already
 * on screen never replay it when a filter changes.
 */
export function CardItem({
  enter,
  children,
}: {
  enter: boolean;
  children: ReactNode;
}) {
  const [entering] = useState(enter);
  return (
    <li
      className={
        entering
          ? "duration-300 ease-out motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in"
          : undefined
      }
    >
      {children}
    </li>
  );
}

/**
 * The row an index's open details sit in (ADR 0025): the grid's full width. Closing, it
 * folds up and fades out over 200ms before it leaves, so the cards below glide up
 * instead of jumping (ADR 0030); it ignores clicks and focus meanwhile. With reduced
 * motion it leaves at once.
 */
export function DetailsRowItem({
  closing,
  onClosed,
  children,
}: {
  closing: boolean;
  /** Called once the fold has run, to drop the row. */
  onClosed: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const finish = useEffectEvent(onClosed);
  useLayoutEffect(() => {
    const row = ref.current;
    if (!closing || row === null) {
      return;
    }
    if (!motionAllowed()) {
      finish();
      return;
    }
    // `forwards` holds the folded end until React drops the row a frame or two later;
    // without it the row sprang back open for those frames (T7SEN's recording,
    // 2026-10-17).
    const animation = row.animate(
      [
        { height: `${String(row.offsetHeight)}px`, opacity: 1 },
        { height: "0px", opacity: 0 },
      ],
      { duration: 200, easing: "ease-in", fill: "forwards" },
    );
    animation.onfinish = () => {
      finish();
    };
    return () => {
      animation.cancel();
    };
  }, [closing]);
  return (
    <li
      ref={ref}
      inert={closing}
      className={cn("col-span-full", closing && "overflow-hidden")}
    >
      {children}
    </li>
  );
}
