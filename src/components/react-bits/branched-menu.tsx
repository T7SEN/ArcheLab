"use client";

/*
 * BranchedMenu from React Bits (https://reactbits.dev/components/branched-menu),
 * adapted for ArcheLab (ADR 0036): colors from the design tokens, icons as React nodes
 * (the Hugeicons packages and the demo items are gone, so it adds no dependency), rows
 * that can be links (`href`), a picked row the page can set (`active`, which also opens
 * its section), a name for the nav, focus rings, lint fixes (callbacks copied to a ref
 * in an effect, no side effect inside a state updater) and named export (ADR 0009).
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0, see
 * LICENSE.md in this folder.
 */
import { cn } from "cn";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export interface BranchedMenuChild {
  value: string;
  label: string;
  /** Renders the row as a link, such as `#part` to jump within the page. */
  href?: string;
  icon?: ReactNode;
}

export interface BranchedMenuItem {
  label: string;
  value?: string;
  children?: readonly BranchedMenuChild[];
}

export interface BranchedMenuProps {
  items: readonly BranchedMenuItem[];
  defaultOpen?: number | readonly number[];
  defaultActive?: string;
  /**
   * The picked row, when the page decides it (a scroll spy, say); without it the menu
   * keeps its own. A row in a closed section opens that section.
   */
  active?: string;
  onSelect?: (
    value: string,
    item: BranchedMenuChild | BranchedMenuItem,
  ) => void;
  onToggle?: (index: number, open: boolean) => void;
  /** The nav's accessible name. */
  ariaLabel?: string;
  color?: string;
  accentColor?: string;
  lineColor?: string;
  width?: number;
  rowHeight?: number;
  indent?: number;
  trunk?: number;
  radius?: number;
  lineWidth?: number;
  fontSize?: number;
  drawDuration?: number;
  foldDuration?: number;
  className?: string;
}

const PAD = 6;
const MARK = 16;

const toSet = (open: number | readonly number[]): Set<number> =>
  typeof open === "number" ? new Set(open >= 0 ? [open] : []) : new Set(open);

const FOCUS =
  "focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/60";

export function BranchedMenu({
  items,
  defaultOpen = 0,
  defaultActive = "",
  active: activeProp,
  onSelect,
  onToggle,
  ariaLabel,
  color = "var(--foreground)",
  accentColor = "var(--primary)",
  lineColor = "var(--border)",
  width = 240,
  rowHeight = 36,
  indent = 40,
  trunk = 14,
  radius = 10,
  lineWidth = 1.5,
  fontSize = 14,
  drawDuration = 400,
  foldDuration = 300,
  className,
}: BranchedMenuProps) {
  const ids = useId();
  const [open, setOpen] = useState<Set<number>>(() => toSet(defaultOpen));
  const [ownActive, setOwnActive] = useState(() => {
    if (defaultActive) return defaultActive;
    const first = items.find(
      (item, index) =>
        item.children !== undefined && toSet(defaultOpen).has(index),
    );
    return first?.children?.at(0)?.value ?? "";
  });
  const active = activeProp ?? ownActive;
  const navRef = useRef<HTMLElement>(null);
  const heads = useRef<(HTMLButtonElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);
  const latest = useRef<{
    onSelect?: BranchedMenuProps["onSelect"];
    onToggle?: BranchedMenuProps["onToggle"];
  }>({});
  useLayoutEffect(() => {
    latest.current = { onSelect, onToggle };
  });

  const activeSection = items.findIndex((item) =>
    item.children?.some((kid) => kid.value === active),
  );
  // A row picked from outside opens its section, once per section it moves to; the
  // reader can still close it.
  const [openedFor, setOpenedFor] = useState(activeSection);
  if (activeSection !== openedFor) {
    setOpenedFor(activeSection);
    if (activeSection >= 0 && !open.has(activeSection)) {
      setOpen(new Set(open).add(activeSection));
    }
  }
  const markerShown = activeSection >= 0 && open.has(activeSection);

  useLayoutEffect(() => {
    const place = (glide: boolean) => {
      const marker = markerRef.current;
      if (!marker) return;
      // -1 is no section: `at` would count from the end.
      const head = activeSection >= 0 ? heads.current[activeSection] : null;
      const on = markerShown ? head : null;
      if (!glide) marker.style.transition = "none";
      if (on) {
        marker.style.top = `${String(on.offsetTop + (on.offsetHeight - MARK) / 2)}px`;
      }
      marker.toggleAttribute("data-on", on !== null);
      if (!glide) {
        // Reading layout applies the jump before the transition comes back.
        marker.getBoundingClientRect();
        marker.style.transition = "";
      }
    };
    place(true);
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      place(false);
    });
    if (navRef.current) observer.observe(navRef.current);
    return () => {
      observer.disconnect();
    };
  }, [activeSection, markerShown, items, fontSize, rowHeight]);

  const select = (
    value: string,
    item: BranchedMenuChild | BranchedMenuItem,
  ) => {
    setOwnActive(value);
    latest.current.onSelect?.(value, item);
  };
  const toggle = (index: number) => {
    const isOpen = !open.has(index);
    setOpen((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(index);
      else next.delete(index);
      return next;
    });
    latest.current.onToggle?.(index, isOpen);
  };

  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = (k: number) => PAD + k * rowHeight + rowHeight / 2;
  const branch = (k: number) =>
    `M ${String(trunk)} ${String(rowY(k) - r)} A ${String(r)} ${String(r)} 0 0 0 ${String(trunk + r)} ${String(rowY(k))} H ${String(endX)}`;
  const reach = (k: number) =>
    `M ${String(trunk)} 0 V ${String(rowY(k) - r)} A ${String(r)} ${String(r)} 0 0 0 ${String(trunk + r)} ${String(rowY(k))} H ${String(endX)}`;
  const length = (k: number) =>
    rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);
  const rowClass = cn(
    "m-0 box-border flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent py-0 pr-0 text-left no-underline outline-none [height:var(--bm-row)] [padding-left:var(--bm-indent)] [color:var(--bm-muted)] [font-family:inherit] [-webkit-tap-highlight-color:transparent] [transition:color_200ms_ease] hover:[color:var(--bm-ink)] data-[active]:font-medium data-[active]:[color:var(--bm-accent)]",
    FOCUS,
  );

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      className={cn(
        "relative flex w-fit max-w-[min(var(--bm-w),100%)] flex-col pl-3.5 [font-family:inherit] [font-size:var(--bm-font)] leading-[1.2] [color:var(--bm-ink)] before:absolute before:top-2 before:bottom-0 before:left-0 before:w-0.5 before:rounded-[1px] before:content-[''] before:[background:linear-gradient(to_bottom,var(--bm-line)_0%,var(--bm-line)_55%,transparent_100%)]",
        className,
      )}
      style={
        {
          "--bm-w": `${String(width)}px`,
          "--bm-ink": color,
          "--bm-accent": accentColor,
          "--bm-line": lineColor,
          "--bm-font": `${String(fontSize)}px`,
          "--bm-row": `${String(rowHeight)}px`,
          "--bm-indent": `${String(indent)}px`,
          "--bm-line-w": lineWidth,
          "--bm-draw": `${String(drawDuration)}ms`,
          "--bm-muted": `color-mix(in srgb, ${color} 55%, transparent)`,
          "--bm-fold": `${String(foldDuration)}ms`,
        } as CSSProperties
      }
    >
      <span
        ref={markerRef}
        className="absolute -top-px left-0 z-[1] h-4 w-0.5 rounded-[1px] opacity-0 [background:var(--bm-accent)] [transition:top_220ms_cubic-bezier(0.23,1,0.32,1),opacity_150ms_ease] data-[on]:opacity-100 motion-reduce:[transition:opacity_150ms_ease]"
        aria-hidden="true"
      />
      {items.map((item, i) => {
        const kids = item.children;
        const isOpen = kids ? open.has(i) : false;
        const leafValue = item.value ?? item.label;
        const leafActive = !kids && leafValue === active;
        const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0;
        const bodyId = `${ids}-${String(i)}`;
        return (
          <div
            key={item.value ?? item.label}
            className="group/section flex flex-col"
            data-open={isOpen ? "" : undefined}
          >
            <button
              ref={(element) => {
                heads.current[i] = element;
              }}
              type="button"
              className={cn(
                "m-0 block cursor-pointer border-0 bg-transparent py-[9px] text-left [font-family:inherit] [font-size:calc(var(--bm-font)+1px)] font-medium [color:var(--bm-muted)] outline-none [-webkit-tap-highlight-color:transparent] [transition:color_200ms_ease] group-data-[open]/section:[color:var(--bm-ink)] hover:[color:var(--bm-ink)] data-[active]:[color:var(--bm-ink)]",
                FOCUS,
              )}
              aria-expanded={kids ? isOpen : undefined}
              aria-controls={kids ? bodyId : undefined}
              aria-current={leafActive ? "true" : undefined}
              data-active={leafActive ? "" : undefined}
              onClick={() => {
                if (kids) {
                  toggle(i);
                } else {
                  select(leafValue, item);
                }
              }}
            >
              {item.label}
            </button>
            {kids ? (
              <div
                id={bodyId}
                className="grid [grid-template-rows:0fr] [transition:grid-template-rows_var(--bm-fold)_cubic-bezier(0.23,1,0.32,1)] group-data-[open]/section:[grid-template-rows:1fr] motion-reduce:transition-none"
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className="relative box-border py-1.5"
                    style={{ height: bodyH }}
                  >
                    <svg
                      className="pointer-events-none absolute top-0 left-0 overflow-visible opacity-0 [transition:opacity_200ms_ease] group-data-[open]/section:opacity-100 group-data-[open]/section:[transition:opacity_250ms_ease_100ms]"
                      width={indent}
                      height={bodyH}
                      aria-hidden="true"
                    >
                      <path
                        className="fill-none [stroke:var(--bm-line)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round]"
                        d={`M ${String(trunk)} 0 V ${String(rowY(kids.length - 1) - r)}`}
                      />
                      {kids.map((kid, k) => (
                        <path
                          key={kid.value}
                          className="fill-none [stroke:var(--bm-line)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round]"
                          d={branch(k)}
                        />
                      ))}
                      {kids.map((kid, k) => (
                        <path
                          key={kid.value}
                          className="fill-none [stroke:var(--bm-accent)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round] [transition:stroke-dashoffset_var(--bm-draw)_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                          d={reach(k)}
                          style={{
                            strokeDasharray: length(k),
                            strokeDashoffset:
                              kid.value === active ? 0 : length(k),
                          }}
                        />
                      ))}
                    </svg>
                    {kids.map((kid) => {
                      const picked = kid.value === active;
                      const content = (
                        <>
                          {kid.icon ? (
                            <span
                              className="inline-flex flex-none [&>svg]:size-4"
                              aria-hidden="true"
                            >
                              {kid.icon}
                            </span>
                          ) : null}
                          <span className="whitespace-nowrap">{kid.label}</span>
                        </>
                      );
                      return kid.href === undefined ? (
                        <button
                          key={kid.value}
                          type="button"
                          className={rowClass}
                          aria-current={picked ? "true" : undefined}
                          data-active={picked ? "" : undefined}
                          tabIndex={isOpen ? 0 : -1}
                          onClick={() => {
                            select(kid.value, kid);
                          }}
                        >
                          {content}
                        </button>
                      ) : (
                        <a
                          key={kid.value}
                          href={kid.href}
                          className={rowClass}
                          aria-current={picked ? "true" : undefined}
                          data-active={picked ? "" : undefined}
                          tabIndex={isOpen ? 0 : -1}
                          onClick={() => {
                            select(kid.value, kid);
                          }}
                        >
                          {content}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
