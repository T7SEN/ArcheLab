"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";

/** The gap between cards, in pixels: `gap-4` in `.card-carousel-track`. */
const gapPx = 16;

/**
 * A page is the whole cards that fit in view: four on wide screens, two on tablets, one
 * on phones, where the next card peeks in. The last page may hold fewer.
 */
function geometry(track: HTMLElement): {
  step: number;
  pages: number;
  page: number;
} {
  const first = track.firstElementChild;
  const cardStep =
    (first?.getBoundingClientRect().width ?? track.clientWidth) + gapPx;
  const perPage = Math.max(
    1,
    Math.floor((track.clientWidth + gapPx) / cardStep),
  );
  const step = perPage * cardStep;
  const pages = Math.max(1, Math.ceil(track.children.length / perPage));
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  return {
    step,
    pages,
    page: atEnd ? pages - 1 : Math.round(track.scrollLeft / step),
  };
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onChange: () => void): () => void {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

/** Reduced motion, read after hydration; the server render assumes motion is fine. */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

interface CardCarouselProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  /** A link before the buttons, such as the page that lists every card. */
  action?: ReactNode;
  /** The cards, one `<li>` each. */
  children: ReactNode;
  /** How long each page shows while the carousel rotates. */
  seconds?: number;
}

/**
 * A row of cards that steps a page at a time (ADR 0018): four cards on wide screens,
 * two on tablets, one and a peek on phones. It turns the page on its own, pauses while
 * a pointer or keyboard focus is inside, and has back, next and pause buttons. With
 * reduced motion it never turns on its own. Every card stays in the list, so screen
 * readers and a swipe reach them all.
 */
export function CardCarousel({
  icon,
  title,
  description,
  action,
  children,
  seconds = 6,
}: CardCarouselProps) {
  const ids = useId();
  const titleId = `${ids}-title`;
  const trackRef = useRef<HTMLUListElement>(null);
  const reducedMotion = useReducedMotion();
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [playing, setPlaying] = useState(true);
  // A pointer over the carousel or keyboard focus inside it holds the page still.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rotating = playing && !hovered && !focused && !reducedMotion;

  // Pages follow the track's width and scroll position, so resizing and swiping count.
  useEffect(() => {
    const track = trackRef.current;
    if (track === null) {
      return;
    }
    const measure = (): void => {
      const current = geometry(track);
      setPages(current.pages);
      setPage(current.page);
    };
    measure();
    track.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  const turn = useCallback(
    (direction: 1 | -1): void => {
      const track = trackRef.current;
      if (track === null) {
        return;
      }
      const behavior = reducedMotion ? "auto" : "smooth";
      const atEnd =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      const atStart = track.scrollLeft <= 2;
      // Past either end, wrap around to the other.
      if (direction === 1 && atEnd) {
        track.scrollTo({ left: 0, behavior });
      } else if (direction === -1 && atStart) {
        track.scrollTo({ left: track.scrollWidth, behavior });
      } else {
        track.scrollBy({ left: direction * geometry(track).step, behavior });
      }
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (!rotating) {
      return;
    }
    const timer = window.setInterval(() => {
      turn(1);
    }, seconds * 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [rotating, seconds, turn]);

  const controls = (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="min-w-10 text-center font-mono text-xs text-muted-foreground"
      >
        {page + 1}/{pages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Previous ${title}`}
        onClick={() => {
          turn(-1);
        }}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      {reducedMotion ? null : (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          aria-pressed={!playing}
          onClick={() => {
            setPlaying((current) => !current);
          }}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Next ${title}`}
        onClick={() => {
          turn(1);
        }}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );

  return (
    <section
      aria-labelledby={titleId}
      aria-roledescription="carousel"
      className="mx-auto max-w-6xl px-4 py-12"
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      onFocus={() => {
        setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <SectionHeader
        id={titleId}
        icon={icon}
        title={title}
        description={description}
        action={
          action === undefined ? (
            controls
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {action}
              {controls}
            </div>
          )
        }
      />
      {/* Announced only when the page turns by hand: rotation would be too chatty. */}
      <p className="sr-only" aria-live={rotating ? "off" : "polite"}>
        Page {page + 1} of {pages}
      </p>
      <ul
        ref={trackRef}
        aria-label={title}
        className="card-carousel-track mt-6"
      >
        {children}
      </ul>
    </section>
  );
}
