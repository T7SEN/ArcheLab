"use client";

/*
 * PillNav from React Bits (https://reactbits.dev/components/pill-nav), adapted for
 * ArcheLab: colors from the design tokens (the light theme and the color props are
 * gone), Next.js links, a logo node instead of an image URL, a trailing pill (the
 * search button, ADR 0022), a section mark for pages under a link (ADR 0023), a fold
 * by CSS until the links are measured (`foldBelow`, ADR 0010), groups of links under
 * one button (ADR 0027), class merging with cn, lint fixes and named export (ADR 0009).
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0, see
 * LICENSE.md in this folder.
 */
import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export interface PillNavLink {
  label: string;
  href: string;
  icon?: ReactNode;
  ariaLabel?: string;
  /** False keeps Next.js from prefetching the page (a large one). */
  prefetch?: false;
}

/**
 * A button in the bar that opens a short menu of links under it, such as Database
 * (ADR 0027). It is marked while one of its links is the current page or section.
 * Folded, its links follow its label in the menu.
 */
export interface PillNavGroup {
  label: string;
  icon?: ReactNode;
  links: readonly PillNavLink[];
}

export type PillNavItem = PillNavLink | PillNavGroup;

const isGroup = (item: PillNavItem): item is PillNavGroup => "links" in item;

const keyOf = (item: PillNavItem) =>
  isGroup(item) ? `group:${item.label}` : item.href;

export interface PillNavProps {
  /** The logo mark, in a round pill that links to `logoHref`; it spins once on hover. */
  logo?: ReactNode;
  logoAlt?: string;
  logoHref?: string;
  /**
   * A round pill after the links, such as a search button: it fills the pill, which
   * stays beside the menu button when the links fold.
   */
  trailing?: ReactNode;
  items: PillNavItem[];
  activeHref?: string;
  /**
   * How the active link is marked: `page` when it is the page shown, `section` when the
   * page shown sits under it (`aria-current="true"`, with the same look).
   */
  activeKind?: "page" | "section";
  defaultActiveIndex?: number;
  onItemClick?: (
    item: PillNavLink,
    index: number,
    event: ReactMouseEvent<HTMLElement>,
  ) => void;
  layout?: "split" | "joined";
  size?: "sm" | "md" | "lg";
  surface?: "glass" | "solid" | "none";
  itemStyle?: "pill" | "plain";
  hoverEffect?: "fill" | "glide" | "none";
  indicator?: "dot" | "pill" | "none";
  bounce?: number;
  stretch?: number;
  intro?: boolean;
  collapse?: "auto" | "always" | "never";
  /**
   * With `collapse="auto"`: the screen width, in px, below which the links fold. Until
   * PillNav has measured the fold, and without JavaScript, CSS folds the links below it,
   * so the first paint fits a phone. Without it, the links show until measured.
   */
  foldBelow?: number;
  onMenuToggle?: (open: boolean) => void;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

interface LinkProps {
  className: string;
  "aria-current"?: "page" | "true";
  "aria-label"?: string;
  tabIndex?: number;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
}

interface Rect {
  left: number;
  width: number;
}

interface Engine {
  enter: (index: number, event?: ReactPointerEvent) => void;
  leave: () => void;
  focus: (index: number, event?: ReactFocusEvent) => void;
  blur: () => void;
  press: (event?: ReactPointerEvent) => void;
  release: () => void;
  refresh: () => void;
}

/** The nav's colors, from the design tokens (CSS variables). */
const TOKENS: Record<string, string> = {
  "--pn-surface": "color-mix(in srgb, var(--card) 72%, transparent)",
  "--pn-solid": "var(--card)",
  "--pn-edge": "var(--border)",
  "--pn-rim": "color-mix(in srgb, var(--foreground) 7%, transparent)",
  "--pn-shadow":
    "0 22px 44px -20px color-mix(in srgb, var(--background) 90%, transparent), 0 6px 16px -8px color-mix(in srgb, var(--background) 60%, transparent)",
  "--pn-text": "var(--muted-foreground)",
  "--pn-strong": "var(--foreground)",
  "--pn-pill":
    "linear-gradient(180deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 80%, var(--background)) 100%)",
  "--pn-pill-ink": "var(--primary-foreground)",
  "--pn-pill-shadow":
    "inset 0 1px 0 color-mix(in srgb, var(--foreground) 40%, transparent), 0 6px 16px -6px color-mix(in srgb, var(--primary) 50%, transparent)",
  "--pn-dot": "var(--primary)",
  "--pn-ring": "var(--ring)",
  "--pn-row-hover": "var(--accent)",
  "--pn-tile":
    "linear-gradient(180deg, var(--accent) 0%, var(--secondary) 100%)",
  "--pn-tile-rim":
    "inset 0 0 0 1px var(--border), inset 0 1px 0 color-mix(in srgb, var(--foreground) 8%, transparent), 0 4px 10px -4px color-mix(in srgb, var(--background) 80%, transparent)",
};

const SIZES: Record<"sm" | "md" | "lg", Record<string, string>> = {
  sm: {
    "--pn-h": "36px",
    "--pn-pad": "3px",
    "--pn-inner": "30px",
    "--pn-x": "12px",
    "--pn-font": "13px",
    "--pn-gap": "6px",
    "--pn-mark": "18px",
  },
  md: {
    "--pn-h": "44px",
    "--pn-pad": "4px",
    "--pn-inner": "36px",
    "--pn-x": "16px",
    "--pn-font": "14px",
    "--pn-gap": "8px",
    "--pn-mark": "22px",
  },
  lg: {
    "--pn-h": "52px",
    "--pn-pad": "5px",
    "--pn-inner": "42px",
    "--pn-x": "20px",
    "--pn-font": "15px",
    "--pn-gap": "10px",
    "--pn-mark": "26px",
  },
};

const ROOT =
  "group/nav relative inline-flex max-w-full items-center gap-[var(--pn-gap)] text-[length:var(--pn-font)] leading-none [-webkit-tap-highlight-color:transparent] [--pn-roll:calc(var(--pn-inner)/2_+_0.7em)] data-[collapsed]:flex data-[collapsed]:w-full data-[collapsed]:justify-between data-[layout=joined]:gap-[2px] data-[layout=joined]:rounded-full data-[layout=joined]:p-[var(--pn-pad)] data-[items=pill]:[--pn-item-gap:3px] data-[panel]:[background:transparent] data-[panel]:[box-shadow:none] data-[panel]:[-webkit-backdrop-filter:none] data-[panel]:[backdrop-filter:none]";
const SURFACE =
  "[background:var(--pn-surface)] [box-shadow:var(--pn-shadow)] [-webkit-backdrop-filter:var(--pn-blur)] [backdrop-filter:var(--pn-blur)]";
const RIM =
  "pointer-events-none absolute inset-0 z-[4] rounded-[inherit] [box-shadow:inset_0_0_0_1px_var(--pn-edge),inset_0_1px_0_var(--pn-rim)]";
const ROOT_RIM =
  "pointer-events-none absolute inset-0 z-[4] rounded-[inherit] [box-shadow:inset_0_0_0_1px_var(--pn-edge),inset_0_1px_0_var(--pn-rim)] group-data-[panel]/nav:opacity-0";
const LOGO =
  "relative z-[2] inline-grid h-[var(--pn-h)] w-[var(--pn-h)] flex-none place-items-center rounded-full group-data-[layout=joined]/nav:h-[var(--pn-inner)] group-data-[layout=joined]/nav:w-[var(--pn-inner)]";
const LOGO_LINK =
  "absolute inset-0 grid place-items-center rounded-[inherit] text-[var(--pn-strong)] no-underline outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--pn-ring)]";
const MARK =
  "grid h-[var(--pn-mark)] w-[var(--pn-mark)] place-items-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full";
const BAR =
  "relative z-[1] box-border flex h-[var(--pn-h)] min-w-0 items-center rounded-full p-[var(--pn-pad)] group-data-[layout=joined]/nav:h-[var(--pn-inner)] group-data-[layout=joined]/nav:p-0";
const TRACK = "relative h-full";
const LIST =
  "m-0 flex h-full list-none items-stretch gap-[var(--pn-item-gap,2px)] p-0";
const SLOT = "group/slot flex";
const ITEM =
  "relative isolate inline-flex h-full cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-full border-0 px-[var(--pn-x)] [background:none] [font-family:inherit] [font-size:inherit] [line-height:inherit] font-medium tracking-[-0.005em] text-[var(--pn-text)] no-underline outline-none transition-[color] duration-[250ms] ease-[ease] group-data-[lit]/slot:text-[var(--pn-strong)] aria-expanded:text-[var(--pn-strong)] aria-[current=page]:text-[var(--pn-strong)] aria-[current=true]:text-[var(--pn-strong)] group-data-[items=pill]/nav:[background:var(--pn-tile)] group-data-[items=pill]/nav:[box-shadow:var(--pn-tile-rim)] group-data-[items=pill]/nav:text-[var(--pn-strong)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--pn-ring)] motion-reduce:transition-none";
const FACE =
  "inline-flex items-center gap-[0.45em] transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] [&_svg]:h-[1.15em] [&_svg]:w-[1.15em] [&_svg]:flex-none group-data-[on]/slot:-translate-y-[var(--pn-roll)] group-data-[on]/slot:duration-500 group-data-[hover]/slot:-translate-y-[var(--pn-roll)] group-data-[hover]/slot:duration-500 motion-reduce:transition-none";
const FACE_ALT =
  "absolute inset-0 inline-flex translate-y-[var(--pn-roll)] items-center justify-center gap-[0.45em] text-[var(--pn-pill-ink)] transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] [&_svg]:h-[1.15em] [&_svg]:w-[1.15em] [&_svg]:flex-none group-data-[on]/slot:translate-y-0 group-data-[on]/slot:duration-500 group-data-[hover]/slot:translate-y-0 group-data-[hover]/slot:duration-500 motion-reduce:transition-none";
const FILL =
  "pointer-events-none absolute left-1/2 top-full z-[-1] h-[var(--pn-fill,200%)] w-[var(--pn-fill,200%)] scale-0 rounded-full [background:var(--pn-pill)] [margin:calc(var(--pn-fill,200%)/-2)_0_0_calc(var(--pn-fill,200%)/-2)] transition-transform duration-[360ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[on]/slot:scale-100 group-data-[on]/slot:duration-[550ms] group-data-[on]/slot:ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[hover]/slot:scale-100 group-data-[hover]/slot:duration-[550ms] group-data-[hover]/slot:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
const GLIDE =
  "pointer-events-none absolute inset-y-0 left-0 w-0 origin-center rounded-full opacity-0 [background:var(--pn-pill)] [box-shadow:var(--pn-pill-shadow)] will-change-[transform,width,opacity] group-data-[focus]/nav:[box-shadow:var(--pn-pill-shadow),0_0_0_2px_var(--pn-ring)]";
const INK =
  "pointer-events-none absolute inset-0 flex items-stretch gap-[var(--pn-item-gap,2px)] text-[var(--pn-pill-ink)] [clip-path:inset(0_100%_0_0)]";
const INK_ITEM =
  "inline-flex h-full items-center justify-center gap-[0.45em] whitespace-nowrap px-[var(--pn-x)] font-medium tracking-[-0.005em] [&_svg]:h-[1.15em] [&_svg]:w-[1.15em] [&_svg]:flex-none";
const DOT =
  "pointer-events-none absolute bottom-[calc((var(--pn-inner)_-_var(--pn-font))/4_-_2px)] left-0 -ml-[2px] h-[4px] w-[4px] rounded-full opacity-0 [background:var(--pn-dot)] transition-[background-color] duration-300 ease-[ease] will-change-[transform,opacity] group-data-[dot-lit]/nav:[background:var(--pn-pill-ink)]";
const TOGGLE =
  "relative z-[3] inline-grid h-[var(--pn-h)] w-[var(--pn-h)] flex-none cursor-pointer place-items-center rounded-full border-0 p-0 text-[var(--pn-strong)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--pn-ring)] group-data-[layout=joined]/nav:h-[var(--pn-inner)] group-data-[layout=joined]/nav:w-[var(--pn-inner)]";
const TOGGLE_BARE = "bg-transparent";
const BURGER = "relative h-[10px] w-[16px]";
const LINE_TOP =
  "absolute left-0 top-[1.5px] h-[1.5px] w-full rounded-[2px] bg-current transition-[top,rotate] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[open]/nav:top-[4.25px] group-data-[open]/nav:rotate-45 motion-reduce:transition-none";
const LINE_BOTTOM =
  "absolute left-0 top-[7px] h-[1.5px] w-full rounded-[2px] bg-current transition-[top,rotate] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[open]/nav:top-[4.25px] group-data-[open]/nav:-rotate-45 motion-reduce:transition-none";
const PANEL =
  "absolute inset-x-0 top-0 z-[1] box-border rounded-[24px] px-[6px] pb-[6px] pt-[calc(var(--pn-h)_+_10px)] group-data-[layout=joined]/nav:pt-[calc(var(--pn-h)_+_4px)]";
const MENU = "m-0 flex list-none flex-col gap-[2px] p-0";
const ROW =
  "box-border flex h-[calc(var(--pn-h)_+_2px)] w-full cursor-pointer items-center gap-[10px] rounded-[18px] border-0 px-[16px] text-left [background:none] [font-family:inherit] text-[length:calc(var(--pn-font)_+_1px)] leading-none font-medium text-[var(--pn-strong)] no-underline outline-none transition-[background-color] duration-200 ease-[ease] [&_svg]:h-[1.15em] [&_svg]:w-[1.15em] [&_svg]:flex-none hover:[background:var(--pn-row-hover)] aria-[current=page]:[background:var(--pn-pill)] aria-[current=page]:[box-shadow:var(--pn-pill-shadow)] aria-[current=page]:text-[var(--pn-pill-ink)] aria-[current=true]:[background:var(--pn-pill)] aria-[current=true]:[box-shadow:var(--pn-pill-shadow)] aria-[current=true]:text-[var(--pn-pill-ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--pn-ring)] motion-reduce:transition-none";
// A group's menu, under its button. It is the nav's child, not the bar's: glass inside
// the bar's glass would blur only the bar.
const DROPDOWN =
  "absolute top-[calc(var(--pn-h)_+_8px)] z-[6] box-border w-60 rounded-[22px] p-[6px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200";
const CHEVRON =
  "-mr-[0.2em] transition-transform duration-300 ease-[ease] group-aria-expanded/menu:rotate-180 motion-reduce:transition-none";
// A group's label in the folded menu, above its links.
const HEADING =
  "block px-[16px] pt-[10px] pb-[4px] text-[length:calc(var(--pn-font)_-_2px)] font-medium tracking-[0.08em] text-[var(--pn-text)] uppercase";
// The measuring copy sits in a zero-width clipped box, so it never widens the page: a
// fourth link put it past a 390px phone's edge (ADR 0024). The copy keeps its natural
// width (w-max), which is what the fold check reads.
const MEASURE =
  "pointer-events-none invisible absolute left-0 top-0 flex w-0 overflow-hidden";

/**
 * The fold before PillNav has measured it, and without JavaScript: the bar and the menu
 * button are both in the page, and the screen width hides one. Below `foldBelow` the nav
 * takes its folded layout, the same as ROOT's and the trailing pill's
 * `data-[collapsed]` classes. Unlayered, these rules win over Tailwind's utilities.
 */
const foldCss = (foldBelow: number) => {
  const nav = `nav[data-fold-below="${String(foldBelow)}"]`;
  return (
    `@media (width < ${String(foldBelow)}px) {` +
    `${nav} { display: flex; width: 100%; justify-content: space-between; }` +
    `${nav} > [data-part="bar"] { display: none; }` +
    `${nav} > [data-part="trailing"] { margin-left: auto; }` +
    `}` +
    `@media (width >= ${String(foldBelow)}px) {` +
    `${nav} > [data-part="toggle"] { display: none; }` +
    `}`
  );
};

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const readVar = (element: Element, name: string) =>
  parseFloat(getComputedStyle(element).getPropertyValue(name)) || 0;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PillNav = ({
  logo,
  logoAlt,
  logoHref = "/",
  trailing,
  items,
  activeHref,
  activeKind = "page",
  defaultActiveIndex = 0,
  onItemClick,
  layout = "split",
  size = "md",
  surface = "glass",
  itemStyle = "pill",
  hoverEffect = "fill",
  indicator = "dot",
  bounce = 0.3,
  stretch = 0.5,
  intro = true,
  collapse = "auto",
  foldBelow,
  onMenuToggle,
  ariaLabel = "Main",
  className,
  style,
}: PillNavProps) => {
  const panelId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const glideRef = useRef<HTMLSpanElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const trailingRef = useRef<HTMLSpanElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const measureListRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLLIElement | null)[]>([]);
  const groupRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const engineRef = useRef<Engine | null>(null);
  const introRef = useRef(intro);
  const slideRef = useRef(false);
  const pendingRef = useRef<boolean | null>(null);
  const [selected, setSelected] = useState(defaultActiveIndex);
  // Null until measured, when the fold is left to foldCss: the server's HTML and the
  // first render on the client.
  const [collapsed, setCollapsed] = useState<boolean | null>(
    collapse === "auto" && foldBelow !== undefined
      ? null
      : collapse === "always",
  );
  const [open, setOpen] = useState(false);
  const [panelShown, setPanelShown] = useState(false);
  // The group whose menu is open, where it sits, and the page it opened on: moving to
  // another page closes it.
  const [menu, setMenu] = useState<{
    index: number;
    left: number;
    at: string | undefined;
  } | null>(null);

  const controlled = activeHref !== undefined;
  const activeIndex = controlled
    ? items.findIndex((item) =>
        isGroup(item)
          ? item.links.some((link) => link.href === activeHref)
          : item.href === activeHref,
      )
    : selected;
  const shownMenu =
    menu !== null && menu.at === activeHref && collapsed === false
      ? menu
      : null;
  const menuItem = shownMenu === null ? undefined : items.at(shownMenu.index);
  const menuGroup =
    menuItem !== undefined && isGroup(menuItem) ? menuItem : undefined;
  const menuId = `${panelId}-menu`;
  const activeCurrent = activeKind === "section" ? "true" : "page";
  const joined = layout === "joined";
  const hasLogo = Boolean(logo);
  const hasTrailing = Boolean(trailing);
  const fill = hoverEffect === "fill";
  const glide = !fill && (hoverEffect === "glide" || indicator === "pill");

  const settings = {
    hoverEffect,
    indicator,
    activeIndex,
    bounce: clamp(bounce, 0, 1),
    stretch: clamp(stretch, 0, 1),
  };
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  });

  const vars: Record<string, string> = { ...TOKENS, ...SIZES[size] };
  if (surface === "glass") vars["--pn-blur"] = "blur(20px) saturate(1.6)";
  if (surface === "solid") {
    vars["--pn-surface"] = TOKENS["--pn-solid"];
    vars["--pn-blur"] = "none";
  }
  if (surface === "none") {
    vars["--pn-surface"] = "transparent";
    vars["--pn-shadow"] = "none";
    vars["--pn-blur"] = "none";
    vars["--pn-edge"] = "transparent";
    vars["--pn-rim"] = "transparent";
  }

  useEffect(() => {
    const root = rootRef.current;
    // Unmeasured, the layout effect below is about to settle the fold.
    if (!root || collapsed === null) return undefined;
    const reduce = prefersReducedMotion();
    const state = {
      x0: 0,
      x1: 0,
      v0: 0,
      v1: 0,
      alpha: 0,
      pop: 1,
      press: 1,
      pressVelocity: 0,
      dotX: 0,
      dotVelocity: 0,
      dotAlpha: 0,
      hover: -1,
      focus: false,
      sliding: false,
      pressing: false,
      waiting: slideRef.current && !reduce,
    };
    slideRef.current = false;
    const rects: Rect[] = [];
    // An index of -1 means no target.
    const rectAt = (index: number): Rect | undefined => rects[index];
    let trackWidth = 0;
    let trackHeight = 0;
    let raf = 0;
    let last = 0;

    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      trackWidth = track.offsetWidth;
      trackHeight = track.offsetHeight;
      slotRefs.current.forEach((slot, index) => {
        if (!slot) return;
        rects[index] = { left: slot.offsetLeft, width: slot.offsetWidth };
        const reach =
          Math.ceil(
            2 * Math.sqrt((slot.offsetWidth / 2) ** 2 + slot.offsetHeight ** 2),
          ) + 2;
        slot.style.setProperty("--pn-fill", `${String(reach)}px`);
      });
    };

    const glideIndex = () => {
      const s = settingsRef.current;
      if (s.hoverEffect === "fill") return -1;
      if (s.hoverEffect === "glide" && state.hover >= 0) return state.hover;
      return s.indicator === "pill" ? s.activeIndex : -1;
    };

    const sync = () => {
      const s = settingsRef.current;
      slotRefs.current.forEach((slot, index) => {
        if (!slot) return;
        const hovered = state.hover === index;
        slot.toggleAttribute("data-lit", hovered);
        slot.toggleAttribute("data-hover", hovered && s.hoverEffect === "fill");
      });
      root.toggleAttribute("data-focus", state.focus && state.hover >= 0);
      root.toggleAttribute(
        "data-dot-lit",
        s.hoverEffect === "fill" &&
          state.hover >= 0 &&
          state.hover === s.activeIndex,
      );
    };

    const render = () => {
      const glideEl = glideRef.current;
      const ink = inkRef.current;
      const dot = dotRef.current;
      const width = Math.max(0, state.x1 - state.x0);
      const scale = state.press * state.pop;
      const target = rectAt(glideIndex());
      const squash = target
        ? 1 - clamp((width / Math.max(target.width, 1) - 1) * 0.3, 0, 0.14)
        : 1;
      if (glideEl) {
        glideEl.style.width = `${String(width)}px`;
        glideEl.style.transform = `translate3d(${String(state.x0)}px, 0, 0) scale(${String(scale)}, ${String(scale * squash)})`;
        glideEl.style.opacity = String(state.alpha);
      }
      if (ink) {
        const half = (width * scale) / 2;
        const center = (state.x0 + state.x1) / 2;
        const inset = (trackHeight * (1 - scale * squash)) / 2;
        ink.style.clipPath = `inset(${String(inset)}px ${String(trackWidth - center - half)}px ${String(inset)}px ${String(center - half)}px round ${String(trackHeight / 2)}px)`;
        ink.style.opacity = String(state.alpha);
      }
      if (dot) {
        const pull = clamp(Math.abs(state.dotVelocity) / 700, 0, 2.2);
        dot.style.transform = `translate3d(${String(state.dotX)}px, 0, 0) scaleX(${String(1 + pull)})`;
        dot.style.opacity = String(state.dotAlpha);
      }
    };

    const tick = (now: number) => {
      raf = 0;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = rectAt(glideIndex());
      const zeta = 1 - 0.55 * s.bounce;
      const base = 520;
      let busy = false;

      if (target && !state.waiting) {
        const t0 = target.left;
        const t1 = target.left + target.width;
        if (state.alpha < 0.02 && !state.sliding) {
          state.x0 = t0;
          state.x1 = t1;
          state.v0 = 0;
          state.v1 = 0;
          state.pop = 0.9;
        }
        if (reduce) {
          state.x0 = t0;
          state.x1 = t1;
          state.v0 = 0;
          state.v1 = 0;
        } else {
          const direction = Math.sign(
            (t0 + t1) / 2 - (state.x0 + state.x1) / 2,
          );
          const lead = base * (1 + 0.9 * s.stretch);
          const trail = base * (1 - 0.5 * s.stretch);
          const k0 = direction < 0 ? lead : direction > 0 ? trail : base;
          const k1 = direction > 0 ? lead : direction < 0 ? trail : base;
          const steps = Math.ceil(dt / (1 / 240));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            state.v0 +=
              (-k0 * (state.x0 - t0) - 2 * zeta * Math.sqrt(k0) * state.v0) * h;
            state.x0 += state.v0 * h;
            state.v1 +=
              (-k1 * (state.x1 - t1) - 2 * zeta * Math.sqrt(k1) * state.v1) * h;
            state.x1 += state.v1 * h;
          }
        }
        state.alpha +=
          (1 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.06));
        busy =
          Math.abs(state.x0 - t0) > 0.05 ||
          Math.abs(state.x1 - t1) > 0.05 ||
          Math.abs(state.v0) > 0.5 ||
          Math.abs(state.v1) > 0.5 ||
          state.alpha < 0.999;
        if (!busy) state.sliding = false;
      } else {
        state.alpha +=
          (0 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.07));
        if (state.alpha > 0.002) busy = true;
        else state.alpha = 0;
      }

      state.pop += (1 - state.pop) * (reduce ? 1 : 1 - Math.exp(-dt / 0.09));
      if (Math.abs(1 - state.pop) > 0.001) busy = true;

      const pressTarget = state.pressing ? 0.95 : 1;
      if (reduce) {
        state.press = pressTarget;
        state.pressVelocity = 0;
      } else {
        state.pressVelocity +=
          (-700 * (state.press - pressTarget) - 30 * state.pressVelocity) * dt;
        state.press += state.pressVelocity * dt;
      }
      if (
        Math.abs(state.press - pressTarget) > 0.0005 ||
        Math.abs(state.pressVelocity) > 0.01
      )
        busy = true;

      const dotTarget =
        s.indicator === "dot" ? rectAt(s.activeIndex) : undefined;
      if (dotTarget && !state.waiting) {
        const center = dotTarget.left + dotTarget.width / 2;
        if (state.dotAlpha < 0.02) {
          state.dotX = center;
          state.dotVelocity = 0;
        }
        if (reduce) {
          state.dotX = center;
          state.dotVelocity = 0;
        } else {
          const k = 360;
          const steps = Math.ceil(dt / (1 / 240));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            state.dotVelocity +=
              (-k * (state.dotX - center) -
                2 * (1 - 0.5 * s.bounce) * Math.sqrt(k) * state.dotVelocity) *
              h;
            state.dotX += state.dotVelocity * h;
          }
        }
        state.dotAlpha +=
          (1 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
        if (
          Math.abs(state.dotX - center) > 0.05 ||
          Math.abs(state.dotVelocity) > 0.5 ||
          state.dotAlpha < 0.999
        )
          busy = true;
      } else {
        state.dotAlpha +=
          (0 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
        if (state.dotAlpha > 0.002) busy = true;
        else state.dotAlpha = 0;
      }

      render();
      if (busy) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const engine: Engine = {
      enter: (index, event) => {
        if (event?.pointerType === "touch") return;
        state.hover = index;
        state.focus = false;
        sync();
        wake();
      },
      leave: () => {
        if (state.focus) return;
        state.hover = -1;
        sync();
        wake();
      },
      focus: (index, event) => {
        const target = event?.target;
        const visible =
          target instanceof Element && target.matches(":focus-visible");
        state.focus = visible;
        state.hover = visible ? index : state.hover;
        sync();
        wake();
      },
      blur: () => {
        if (!state.focus) return;
        state.focus = false;
        state.hover = -1;
        sync();
        wake();
      },
      press: (event) => {
        if (event && event.button > 0) return;
        state.pressing = true;
        wake();
      },
      release: () => {
        if (!state.pressing) return;
        state.pressing = false;
        wake();
      },
      refresh: () => {
        measure();
        sync();
        wake();
      },
    };
    engineRef.current = engine;

    measure();
    sync();
    render();
    wake();

    let timer = 0;
    if (state.waiting) {
      state.x0 = 0;
      state.x1 = 0;
      timer = window.setTimeout(() => {
        state.waiting = false;
        if (glideIndex() >= 0) {
          state.alpha = 1;
          state.sliding = true;
        }
        wake();
      }, 420);
    }

    const resizeObserver = new ResizeObserver(() => {
      measure();
      render();
      wake();
    });
    if (trackRef.current) resizeObserver.observe(trackRef.current);
    void document.fonts.ready.then(() => {
      engine.refresh();
    });
    window.addEventListener("pointerup", engine.release);
    window.addEventListener("pointercancel", engine.release);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener("pointerup", engine.release);
      window.removeEventListener("pointercancel", engine.release);
      engineRef.current = null;
    };
  }, [collapsed, items.length]);

  useEffect(() => {
    engineRef.current?.refresh();
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const measureEl = measureListRef.current;
    if (!root || !measureEl) return undefined;
    const evaluate = () => {
      if (collapse === "always" || collapse === "never") {
        setCollapsed(collapse === "always");
        return;
      }
      const parent = root.parentElement;
      if (!parent) return;
      const styles = getComputedStyle(parent);
      const available =
        parent.clientWidth -
        (parseFloat(styles.paddingLeft) || 0) -
        (parseFloat(styles.paddingRight) || 0);
      const listWidth = measureListRef.current?.offsetWidth ?? 0;
      const logoWidth = logoRef.current?.offsetWidth ?? 0;
      const trailingWidth = trailingRef.current?.offsetWidth ?? 0;
      const pad = readVar(root, "--pn-pad");
      const gap = readVar(root, "--pn-gap");
      const need = joined
        ? pad * 2 +
          (hasLogo ? logoWidth + 2 : 0) +
          listWidth +
          (hasTrailing ? trailingWidth + 2 : 0)
        : (hasLogo ? logoWidth + gap : 0) +
          listWidth +
          pad * 2 +
          (hasTrailing ? trailingWidth + gap : 0);
      const next = need > available + 0.5;
      if (introRef.current && next !== collapsed) pendingRef.current = next;
      setCollapsed(next);
      // The menu only exists while collapsed; the original left it marked shown.
      if (!next) {
        setOpen(false);
        setPanelShown(false);
      } else {
        // A group's menu belongs to the bar, which folding takes away.
        setMenu(null);
      }
    };
    evaluate();
    const observer = new ResizeObserver(evaluate);
    if (root.parentElement) observer.observe(root.parentElement);
    observer.observe(measureEl);
    return () => {
      observer.disconnect();
    };
  }, [collapse, collapsed, joined, hasLogo, hasTrailing, size]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !introRef.current || collapsed === null) return;
    if (pendingRef.current !== null && pendingRef.current !== collapsed) return;
    pendingRef.current = null;
    introRef.current = false;
    if (prefersReducedMotion()) return;
    const pop = (element: HTMLElement | null, delay: number) =>
      element?.animate(
        [
          { opacity: 0, transform: "scale(0.6)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        {
          duration: 700,
          delay,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          fill: "backwards",
        },
      );
    const reveal = (element: HTMLElement | null) => {
      if (!element) return;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      element.animate(
        [
          {
            clipPath: `inset(0px ${String(Math.max(0, width - height))}px 0px 0px round ${String(height / 2)}px)`,
          },
          { clipPath: `inset(0px 0px 0px 0px round ${String(height / 2)}px)` },
        ],
        { duration: 760, delay: 90, easing: EASE_OUT, fill: "backwards" },
      );
    };
    pop(logoRef.current, 0);
    pop(trailingRef.current, 60);
    if (collapsed) {
      pop(toggleRef.current, 120);
      return;
    }
    slideRef.current = true;
    reveal(joined ? root : barRef.current);
    slotRefs.current.forEach((slot, index) => {
      slot?.animate(
        [
          { opacity: 0, transform: "translateX(-10px)" },
          { opacity: 1, transform: "translateX(0)" },
        ],
        {
          duration: 560,
          delay: 200 + index * 50,
          easing: EASE_OUT,
          fill: "backwards",
        },
      );
    });
  }, [collapsed, joined]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const root = rootRef.current;
    if (!panel || !root) return undefined;
    const reduce = prefersReducedMotion();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const header = joined
      ? root.offsetHeight
      : (toggleRef.current?.offsetHeight ?? 44);
    const start = joined
      ? `inset(0px 0px ${String(Math.max(0, height - header))}px 0px round ${String(header / 2)}px)`
      : `inset(0px 0px ${String(Math.max(0, height - header))}px ${String(Math.max(0, width - header))}px round ${String(header / 2)}px)`;
    const end = "inset(0px 0px 0px 0px round 24px)";
    const rows = panel.querySelectorAll("li");
    const running: Animation[] = [];
    if (open) {
      if (reduce) return undefined;
      running.push(
        panel.animate([{ clipPath: start }, { clipPath: end }], {
          duration: 560,
          easing: EASE_OUT,
        }),
      );
      rows.forEach((row, index) => {
        running.push(
          row.animate(
            [
              { opacity: 0, transform: "translateY(-8px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 420,
              delay: 90 + index * 40,
              easing: EASE_OUT,
              fill: "backwards",
            },
          ),
        );
      });
    } else {
      if (reduce) return undefined;
      const morph = panel.animate([{ clipPath: end }, { clipPath: start }], {
        duration: 380,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      });
      morph.onfinish = () => {
        setPanelShown(false);
      };
      running.push(morph);
      rows.forEach((row) => {
        running.push(
          row.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 160,
            fill: "forwards",
          }),
        );
      });
    }
    return () => {
      running.forEach((animation) => {
        animation.onfinish = null;
        animation.cancel();
      });
    };
  }, [open, panelShown, joined]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setOpen(false);
      if (prefersReducedMotion()) setPanelShown(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      if (prefersReducedMotion()) setPanelShown(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // A group's menu closes on a press outside its button and itself, and on Escape,
  // which gives focus back to its button.
  const menuIndex = shownMenu?.index ?? null;
  useEffect(() => {
    if (menuIndex === null) return undefined;
    const inside = (target: EventTarget | null) =>
      target instanceof Node &&
      ((slotRefs.current[menuIndex]?.contains(target) ?? false) ||
        (dropdownRef.current?.contains(target) ?? false));
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target)) setMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenu(null);
      groupRefs.current[menuIndex]?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuIndex]);

  // One turn of the mark per hover, as in React Bits: not for touch, not while a turn
  // is still running, and never under reduced motion.
  const spin = (event: ReactPointerEvent) => {
    const mark = markRef.current;
    if (
      mark === null ||
      event.pointerType === "touch" ||
      mark.getAnimations().length > 0 ||
      prefersReducedMotion()
    ) {
      return;
    }
    mark.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      { duration: 900, easing: "cubic-bezier(0.65, 0, 0.25, 1)" },
    );
  };

  const choose = (
    item: PillNavLink,
    index: number,
    event: ReactMouseEvent<HTMLElement>,
  ) => {
    onItemClick?.(item, index, event);
    if (!controlled) setSelected(index);
  };

  // The menu is as wide as DROPDOWN's w-60, centered under its button and kept 16px
  // inside the screen.
  const menuWidth = 240;
  const toggleMenu = (index: number) => {
    if (menuIndex === index) {
      setMenu(null);
      return;
    }
    const slot = slotRefs.current[index];
    const root = rootRef.current;
    if (!slot || !root) return;
    const box = slot.getBoundingClientRect();
    const origin = root.getBoundingClientRect().left;
    const left = clamp(
      box.left + box.width / 2 - menuWidth / 2,
      16,
      window.innerWidth - 16 - menuWidth,
    );
    setMenu({ index, left: left - origin, at: activeHref });
  };

  // Focus moving out of a group's button and menu closes the menu. A press elsewhere
  // moves focus to nothing, and the pointerdown listener handles it.
  const leaveMenu = (index: number, event: ReactFocusEvent) => {
    const next = event.relatedTarget;
    if (
      menuIndex !== index ||
      next === null ||
      slotRefs.current[index]?.contains(next) ||
      dropdownRef.current?.contains(next)
    ) {
      return;
    }
    setMenu(null);
  };

  const toggle = () => {
    const next = !open;
    if (next) setPanelShown(true);
    else if (prefersReducedMotion()) setPanelShown(false);
    setOpen(next);
    onMenuToggle?.(next);
  };

  const link = (item: PillNavLink, props: LinkProps, children: ReactNode) => (
    <Link href={item.href} prefetch={item.prefetch} {...props}>
      {children}
    </Link>
  );

  const face = (item: PillNavItem) => (
    <>
      {item.icon}
      {item.label}
      {isGroup(item) && <ChevronDown aria-hidden="true" className={CHEVRON} />}
    </>
  );

  /** A link's row in the folded menu, which closes the menu. */
  const row = (item: PillNavLink, index: number, current: boolean) =>
    link(
      item,
      {
        className: ROW,
        "aria-current": current ? activeCurrent : undefined,
        tabIndex: open ? undefined : -1,
        onClick: (event) => {
          choose(item, index, event);
          setOpen(false);
          if (prefersReducedMotion()) setPanelShown(false);
          onMenuToggle?.(false);
        },
      },
      face(item),
    );

  return (
    <nav
      ref={rootRef}
      className={cn(ROOT, joined && SURFACE, className)}
      data-layout={layout}
      data-items={itemStyle}
      data-collapsed={collapsed ? "" : undefined}
      data-fold-below={collapsed === null ? foldBelow : undefined}
      data-open={open ? "" : undefined}
      data-panel={panelShown ? "" : undefined}
      style={{ ...vars, ...style }}
      aria-label={ariaLabel}
    >
      {hasLogo && (
        <span ref={logoRef} className={cn(LOGO, !joined && SURFACE)}>
          <Link
            href={logoHref}
            className={LOGO_LINK}
            aria-label={logoAlt}
            onPointerEnter={spin}
          >
            <span ref={markRef} className={MARK}>
              {logo}
            </span>
          </Link>
          {!joined && <span className={RIM} />}
        </span>
      )}

      {!collapsed && (
        <div
          ref={barRef}
          className={cn(BAR, !joined && SURFACE)}
          data-part="bar"
        >
          <div
            ref={trackRef}
            className={TRACK}
            onPointerLeave={() => {
              engineRef.current?.leave();
            }}
          >
            <ul className={LIST}>
              {items.map((item, index) => {
                const faces = (
                  <>
                    {fill && <span className={FILL} aria-hidden="true" />}
                    <span className={FACE}>{face(item)}</span>
                    {fill && (
                      <span className={FACE_ALT} aria-hidden="true">
                        {face(item)}
                      </span>
                    )}
                  </>
                );
                return (
                  <li
                    key={keyOf(item)}
                    ref={(element) => {
                      slotRefs.current[index] = element;
                    }}
                    className={SLOT}
                    data-on={
                      fill && indicator === "pill" && index === activeIndex
                        ? ""
                        : undefined
                    }
                    onPointerEnter={(event) => {
                      engineRef.current?.enter(index, event);
                    }}
                    onPointerDown={(event) => {
                      engineRef.current?.press(event);
                    }}
                    onFocus={(event) => {
                      engineRef.current?.focus(index, event);
                    }}
                    onBlur={(event) => {
                      engineRef.current?.blur();
                      leaveMenu(index, event);
                    }}
                  >
                    {isGroup(item) ? (
                      // A disclosure button: its menu is a list of links, not a
                      // menu widget (ADR 0027). Marked as a section while one of
                      // its links is current.
                      <button
                        ref={(element) => {
                          groupRefs.current[index] = element;
                        }}
                        type="button"
                        className={cn(ITEM, "group/menu")}
                        aria-expanded={menuIndex === index}
                        aria-controls={menuIndex === index ? menuId : undefined}
                        aria-current={
                          index === activeIndex ? "true" : undefined
                        }
                        onClick={() => {
                          toggleMenu(index);
                        }}
                      >
                        {faces}
                      </button>
                    ) : (
                      link(
                        item,
                        {
                          className: ITEM,
                          "aria-current":
                            index === activeIndex ? activeCurrent : undefined,
                          "aria-label": item.ariaLabel,
                          onClick: (event) => {
                            choose(item, index, event);
                          },
                        },
                        faces,
                      )
                    )}
                  </li>
                );
              })}
            </ul>
            {glide && (
              <span ref={glideRef} className={GLIDE} aria-hidden="true" />
            )}
            {glide && (
              <div ref={inkRef} className={INK} aria-hidden="true">
                {items.map((item) => (
                  <span key={keyOf(item)} className={INK_ITEM}>
                    {face(item)}
                  </span>
                ))}
              </div>
            )}
            {indicator === "dot" && (
              <span ref={dotRef} className={DOT} aria-hidden="true" />
            )}
          </div>
          {!joined && <span className={RIM} />}
        </div>
      )}

      {shownMenu !== null && menuGroup !== undefined && (
        // Right after the bar, so Tab goes from the group's button into its links:
        // the group is the bar's last item today (ADR 0027).
        <div
          ref={dropdownRef}
          id={menuId}
          className={cn(DROPDOWN, SURFACE)}
          style={{ left: `${String(shownMenu.left)}px` }}
          onBlur={(event) => {
            leaveMenu(shownMenu.index, event);
          }}
        >
          <ul className={MENU}>
            {menuGroup.links.map((item) => (
              <li key={item.href}>
                {link(
                  item,
                  {
                    className: ROW,
                    "aria-current":
                      item.href === activeHref ? activeCurrent : undefined,
                    onClick: (event) => {
                      choose(item, shownMenu.index, event);
                      setMenu(null);
                    },
                  },
                  face(item),
                )}
              </li>
            ))}
          </ul>
          <span className={RIM} />
        </div>
      )}

      {hasTrailing && (
        // Folded, it moves to the right, beside the menu button.
        <span
          ref={trailingRef}
          className={cn(
            LOGO,
            !joined && SURFACE,
            "group-data-[collapsed]/nav:ml-auto",
          )}
          data-part="trailing"
        >
          {trailing}
          {!joined && <span className={RIM} />}
        </span>
      )}

      {collapsed !== false && (
        <button
          ref={toggleRef}
          type="button"
          className={cn(TOGGLE, joined ? TOGGLE_BARE : SURFACE)}
          data-part="toggle"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={toggle}
        >
          <span className={BURGER} aria-hidden="true">
            <span className={LINE_TOP} />
            <span className={LINE_BOTTOM} />
          </span>
          {!joined && <span className={RIM} />}
        </button>
      )}

      {collapsed && panelShown && (
        <div ref={panelRef} id={panelId} className={cn(PANEL, SURFACE)}>
          <ul className={MENU}>
            {items.map((item, index) =>
              isGroup(item) ? (
                // Folded, a group is its label over its links.
                <li key={keyOf(item)}>
                  <span id={`${panelId}-${String(index)}`} className={HEADING}>
                    {item.label}
                  </span>
                  <ul
                    aria-labelledby={`${panelId}-${String(index)}`}
                    className={MENU}
                  >
                    {item.links.map((child) => (
                      <li key={child.href}>
                        {row(child, index, child.href === activeHref)}
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={keyOf(item)}>
                  {row(item, index, index === activeIndex)}
                </li>
              ),
            )}
          </ul>
          <span className={RIM} />
        </div>
      )}

      <div className={MEASURE} aria-hidden="true">
        <div ref={measureListRef} className={`${LIST} w-max`}>
          {items.map((item) => (
            <span key={keyOf(item)} className={INK_ITEM}>
              {face(item)}
            </span>
          ))}
        </div>
      </div>

      {joined && <span className={ROOT_RIM} />}

      {collapsed === null && foldBelow !== undefined && (
        <style>{foldCss(foldBelow)}</style>
      )}
    </nav>
  );
};

export { PillNav };
