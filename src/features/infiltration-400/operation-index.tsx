"use client";

import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Skull,
  Swords,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { motionAllowed, useSlideIn } from "@/components/motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { filterChipClass } from "@/features/game-data/filter-row";
import { LoadFailed } from "@/features/game-data/load-failed";
import { useSearch, writeSearch } from "@/features/game-data/url-query";
import { dayAt, dayLabel, daySpan, dayStart, daysOf, pairOn } from "./day-400";
import {
  operation400FiltersToSearch,
  parseOperation400Filters,
  rewardEntries,
  weeksAhead,
  type DropKind,
  type RewardEntry,
  type Operation400,
  type Operation400Filters,
} from "./operation-filters";
import { useSecondClock, useToday400 } from "./use-day-400";

/** The page's address, for its links. */
const indexPath = "/infiltration-400";

/** How many rewards an operation's card previews before "+N". */
const previewCount = 5;

/** How many rewards the list shows before "Show all": three rows on wide screens. */
const rewardsFirst = 9;

/** The reward tabs: every drop, then by kind. */
const rewardTabs: readonly {
  readonly kind: DropKind | "all";
  readonly label: string;
}[] = [
  { kind: "all", label: "All" },
  { kind: "material", label: "Materials" },
  { kind: "core", label: "Cores" },
];

const monthDay = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const fullDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const weekday = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "UTC",
});

/** "18 Oct". */
const shortDate = (day: number) => monthDay.format(dayStart(day));

/** A week's span: "18–24 Oct", or "25 Oct – 1 Nov" across months. */
function weekSpan(first: number): string {
  const [startDay = "", startMonth = ""] = shortDate(first).split(" ");
  const end = shortDate(first + 6);
  const [endDay = "", endMonth = ""] = end.split(" ");
  return startMonth === endMonth
    ? `${startDay}–${endDay} ${endMonth}`
    : `${startDay} ${startMonth} – ${end}`;
}

/** A day's name in a column head: "Today", "Tomorrow", then "Tue". */
function columnLabel(day: number, today: number): string {
  const label = dayLabel(day, today);
  return label === "Today" || label === "Tomorrow"
    ? label
    : weekday.format(dayStart(day));
}

/** Whether a click is a plain left click, which the page handles in place. */
function plainClick(event: MouseEvent): boolean {
  return !(
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

/**
 * "Resets in 19:03:05": the time to the next day's operations, ticking each second. In
 * the static HTML, when the day changes instead.
 */
export function ResetCountdown() {
  const now = useSecondClock();
  if (now === null) {
    return (
      <span className="text-sm text-muted-foreground">
        The operations change every day at 07:00 UTC.
      </span>
    );
  }
  const left = Math.max(0, dayStart(dayAt(now) + 1) - now);
  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs">
      <Clock aria-hidden="true" className="size-3.5 text-primary" />
      Resets in
      <span className="font-semibold tabular-nums">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </span>
  );
}

interface Infiltration400Props {
  operations: readonly Operation400[];
}

/** The page filtered by the URL query. Render it inside `<Suspense>` (`useSearch`). */
export function Infiltration400FromUrl(props: Infiltration400Props) {
  return <Infiltration400 {...props} search={useSearch()} />;
}

/**
 * The 400% Infiltration Operations page (ADR 0049), in the layout of tfdhub.gg's (T7SEN,
 * 2026-10-18): the upcoming rotation by week, seven days a row, each day's two
 * operations as buttons; then the chosen day's two operations, and the chosen
 * operation's rewards in tabs. The day is worked out in the browser; with `search` ""
 * and no day yet, this is what the static HTML holds.
 */
export function Infiltration400({
  operations,
  search,
}: Infiltration400Props & {
  /** The URL query the choice comes from. */
  search: string;
}) {
  const ids = useId();
  const today = useToday400();
  const filters = parseOperation400Filters(search, {
    today,
    operations: operations.map((operation) => operation.slug),
  });
  const day = today === null ? null : (filters.day ?? today);
  const pair = day === null ? null : pairOn(day);
  const bySlug = new Map(operations.map((entry) => [entry.slug, entry]));
  const byName = new Map(operations.map((entry) => [entry.name, entry]));
  const chosen =
    (filters.open === null ? undefined : bySlug.get(filters.open)) ??
    (pair === null ? undefined : byName.get(pair[0])) ??
    null;
  const choose = (change: Partial<Operation400Filters>) => {
    writeSearch(operation400FiltersToSearch({ ...filters, ...change }));
  };
  const pick = (next: number, operation: Operation400) => {
    choose({ day: next === today ? null : next, open: operation.slug });
  };

  // The week on show: the chosen day's, until the arrows or tabs move it.
  const chosenWeek =
    day === null || today === null ? 0 : Math.floor((day - today) / 7);
  const [shownWeek, setShownWeek] = useState<number | null>(null);
  const week = shownWeek ?? chosenWeek;

  if (operations.length === 0) {
    return <LoadFailed what="400% Infiltration Operations" />;
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section
        aria-labelledby={`${ids}-upcoming`}
        className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5"
      >
        <div className="grid gap-1">
          <h2
            id={`${ids}-upcoming`}
            className="flex items-center gap-2 font-display text-lg font-semibold tracking-wider uppercase"
          >
            <CalendarDays aria-hidden="true" className="size-4 text-primary" />
            Upcoming rotation
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick either operation on a day to open its rewards.
          </p>
        </div>
        {today === null || day === null ? (
          <p
            role="status"
            aria-busy="true"
            className="text-sm text-muted-foreground"
          >
            The operations change every day at 07:00 UTC.
          </p>
        ) : (
          <>
            <WeekTabs
              today={today}
              week={week}
              onWeek={(next) => {
                setShownWeek(next);
              }}
            />
            <DayColumns
              today={today}
              week={week}
              day={day}
              chosen={chosen}
              byName={byName}
              filters={filters}
              onPick={pick}
            />
          </>
        )}
      </section>

      {today === null || day === null || pair === null ? null : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
          <section
            aria-labelledby={`${ids}-rotation`}
            className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:p-5"
          >
            <div className="grid gap-1 border-b pb-3">
              <h2
                id={`${ids}-rotation`}
                className="flex items-center gap-2 font-display text-lg font-semibold tracking-wider uppercase"
              >
                <Swords aria-hidden="true" className="size-4 text-primary" />
                {day === today ? "Current rotation" : "Rotation"}
              </h2>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {fullDate.format(dayStart(day)).replace(",", "")}
              </p>
            </div>
            <ul className="grid gap-3">
              {pair.map((name) => {
                const operation = byName.get(name);
                return operation === undefined ? null : (
                  <li key={name}>
                    <OperationSummary
                      operation={operation}
                      chosen={operation.slug === chosen?.slug}
                      href={`${indexPath}${operation400FiltersToSearch({ ...filters, open: operation.slug })}`}
                      onChoose={() => {
                        choose({ open: operation.slug });
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          </section>

          {chosen === null ? null : (
            <OperationRewards
              key={chosen.slug}
              operation={chosen}
              day={day}
              today={today}
              onPickDay={(next) => {
                setShownWeek(null);
                choose({ day: next === today ? null : next });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** The weeks ahead as tabs, with arrows for the one before and after. */
function WeekTabs({
  today,
  week,
  onWeek,
}: {
  today: number;
  week: number;
  onWeek: (week: number) => void;
}) {
  const arrowClass =
    "grid size-10 shrink-0 place-items-center rounded-xl border bg-background/40 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40";
  // The row scrolls so the chosen week's tab is always whole in view.
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = rowRef.current;
    const tab = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (row === null || tab === undefined || tab === null) {
      return;
    }
    const start = tab.offsetLeft;
    const end = start + tab.offsetWidth;
    const behavior = motionAllowed() ? "smooth" : "auto";
    if (start < row.scrollLeft) {
      row.scrollTo({ left: start, behavior });
    } else if (end > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: end - row.clientWidth, behavior });
    }
  }, [week]);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={week === 0}
        onClick={() => {
          onWeek(week - 1);
        }}
        className={arrowClass}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        <span className="sr-only">Week before</span>
      </button>
      {/* Positioned: the tabs' offsets are measured from it, and the screen-reader-only
          labels stay inside it. */}
      <div
        ref={rowRef}
        className="relative min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto"
      >
        <ToggleGroup
          aria-label="Week"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex w-max gap-2"
          value={[String(week)]}
          onValueChange={(value) => {
            const next = value.at(0);
            if (next !== undefined) {
              onWeek(Number(next));
            }
          }}
        >
          {Array.from({ length: weeksAhead }, (_, index) => (
            <ToggleGroupItem
              key={index}
              value={String(index)}
              className="h-auto w-36 flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left aria-pressed:border-primary/60 aria-pressed:bg-primary/15"
            >
              <span className="text-[0.6875rem] font-semibold tracking-wider uppercase">
                {index === 0 ? "This week" : `Week ${String(index + 1)}`}
              </span>
              <span className="text-xs text-muted-foreground">
                {weekSpan(today + index * 7)}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <button
        type="button"
        disabled={week === weeksAhead - 1}
        onClick={() => {
          onWeek(week + 1);
        }}
        className={arrowClass}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
        <span className="sr-only">Week after</span>
      </button>
    </div>
  );
}

/** A week's seven days, each with its two operations as buttons. */
function DayColumns({
  today,
  week,
  day,
  chosen,
  byName,
  filters,
  onPick,
}: {
  today: number;
  week: number;
  day: number;
  chosen: Operation400 | null;
  byName: ReadonlyMap<string, Operation400>;
  filters: Operation400Filters;
  onPick: (day: number, operation: Operation400) => void;
}) {
  const days = Array.from(
    { length: 7 },
    (_, index) => today + week * 7 + index,
  );
  const order = Array.from({ length: weeksAhead }, (_, index) => String(index));
  // A week change slides the days in from its side (ADR 0030). The list is positioned
  // so the screen-reader-only labels in it stay in its scroll box on phones; outside
  // it they widened the page.
  const ref = useSlideIn<HTMLUListElement>(String(week), order);
  return (
    <ul
      ref={ref}
      aria-label="Days"
      className="relative -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-7 lg:overflow-visible"
    >
      {days.map((entry) => {
        const pair = pairOn(entry) ?? [];
        const isToday = entry === today;
        const isChosen = entry === day;
        return (
          <li
            key={entry}
            className={`grid w-40 shrink-0 snap-start grid-cols-[minmax(0,1fr)] content-start gap-2 rounded-xl border bg-background/40 p-2.5 lg:w-auto ${isChosen ? "border-primary/70" : ""} ${isToday ? "border-t-2 border-t-primary" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-2 border-b pb-2">
              <span
                className={`text-[0.6875rem] font-semibold tracking-wider uppercase ${isToday ? "text-primary" : ""}`}
              >
                {columnLabel(entry, today)}
              </span>
              <span className="text-[0.6875rem] text-muted-foreground">
                {shortDate(entry)}
              </span>
            </div>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
              {pair.map((name) => {
                const operation = byName.get(name);
                if (operation === undefined) {
                  return null;
                }
                const pressed = isChosen && operation.slug === chosen?.slug;
                return (
                  <li key={name}>
                    <a
                      href={`${indexPath}${operation400FiltersToSearch({ ...filters, day: entry === today ? null : entry, open: operation.slug })}`}
                      aria-current={pressed ? "true" : undefined}
                      onClick={(event) => {
                        if (!plainClick(event)) {
                          return;
                        }
                        event.preventDefault();
                        onPick(entry, operation);
                      }}
                      className="flex h-12 w-full items-center gap-2 rounded-lg border bg-card/70 px-1.5 text-[0.6875rem] leading-tight font-semibold transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:border-primary/70 aria-[current]:bg-primary/15"
                    >
                      <OperationIcon size="sm" />
                      <span className="line-clamp-2 min-w-0">
                        {operation.name}
                        <span className="sr-only">
                          , {operation.region}, {daySpan(entry)}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

/** An Infiltration Operation's mark: a skull in a diamond, in the primary tint. */
function OperationIcon({ size }: { size: "sm" | "md" | "lg" }) {
  const box = { sm: "size-5", md: "size-9", lg: "size-12" }[size];
  const icon = { sm: "size-3", md: "size-5", lg: "size-6" }[size];
  const room = { sm: "m-0.5", md: "m-1", lg: "m-1" }[size];
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 rotate-45 place-items-center rounded-md border border-primary/50 bg-primary/15 ${room} ${box}`}
    >
      <Skull className={`-rotate-45 text-primary ${icon}`} />
    </span>
  );
}

/** "Vespers • 400%": an operation's region over its name. */
function Eyebrow({ operation }: { operation: Operation400 }) {
  return (
    <span className="block text-[0.6875rem] font-semibold tracking-wider text-primary uppercase">
      {operation.region} <span aria-hidden="true">•</span>
      <span className="sr-only">,</span> 400%
    </span>
  );
}

/** A reward's art on a small square, for previews. */
function RewardThumb({ entry }: { entry: RewardEntry }) {
  return (
    <span className="grid size-10 place-items-center rounded-md border bg-background/60">
      {entry.imageUrl === "" ? null : (
        // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
        <img
          src={entry.imageUrl}
          alt=""
          width={32}
          height={32}
          loading="lazy"
          decoding="async"
          className="size-8 object-contain"
        />
      )}
    </span>
  );
}

/**
 * One of the day's two operations: its mark, region and name, and a strip of its
 * rewards. A real link to it; a plain click opens its rewards beside it.
 */
function OperationSummary({
  operation,
  chosen,
  href,
  onChoose,
}: {
  operation: Operation400;
  chosen: boolean;
  href: string;
  onChoose: () => void;
}) {
  const entries = rewardEntries(operation.drops);
  const shown = entries.slice(0, previewCount);
  const more = entries.length - shown.length;
  return (
    <a
      href={href}
      aria-current={chosen ? "true" : undefined}
      onClick={(event) => {
        if (!plainClick(event)) {
          return;
        }
        event.preventDefault();
        onChoose();
      }}
      className="grid gap-3 rounded-xl border bg-background/40 p-3 transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:border-primary/70 aria-[current]:bg-primary/10"
    >
      <span className="flex items-center gap-3">
        <OperationIcon size="md" />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <Eyebrow operation={operation} />
          <span className="font-display text-lg leading-tight font-semibold tracking-wide">
            {operation.name}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      </span>
      <span className="grid gap-2 border-t border-border/60 pt-3">
        <span className="flex items-center justify-between text-[0.6875rem] font-semibold tracking-wider uppercase">
          Rewards
          <span className="tabular-nums">{entries.length}</span>
        </span>
        <span aria-hidden="true" className="flex gap-1.5">
          {shown.map((entry) => (
            <RewardThumb key={entry.name} entry={entry} />
          ))}
          {more > 0 ? (
            <span className="grid size-10 place-items-center rounded-md border text-xs font-semibold text-muted-foreground">
              +{more}
            </span>
          ) : null}
        </span>
      </span>
    </a>
  );
}

/**
 * The chosen operation's panel: its name, reward count, Transcendent weapon chance and
 * 400% days, and its rewards as tiles in tabs by kind.
 */
function OperationRewards({
  operation,
  day,
  today,
  onPickDay,
}: {
  operation: Operation400;
  day: number;
  today: number;
  onPickDay: (day: number) => void;
}) {
  const ids = useId();
  const [tab, setTab] = useState<DropKind | "all">("all");
  const [showAll, setShowAll] = useState(false);
  // Every grade of a kind of core is one entry, so the list stays short.
  const entries = rewardEntries(operation.drops);
  const shown =
    tab === "all" ? entries : entries.filter((entry) => entry.kind === tab);
  const count = (kind: DropKind | "all") =>
    kind === "all"
      ? entries.length
      : entries.filter((entry) => entry.kind === kind).length;
  const days = operation.inCycle ? daysOf(operation.name, today) : [];
  // A tab switch slides the tiles in from its side (ADR 0030).
  const tilesRef = useSlideIn<HTMLUListElement>(
    tab,
    rewardTabs.map((entry) => entry.kind),
  );

  return (
    <section
      aria-labelledby={`${ids}-title`}
      className="grid gap-5 rounded-2xl border border-t-2 border-primary/40 border-t-primary bg-card/60 p-4 duration-300 motion-safe:animate-in motion-safe:fade-in sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <OperationIcon size="lg" />
          <h2
            id={`${ids}-title`}
            className="grid gap-0.5 font-display text-2xl leading-tight font-semibold tracking-wide"
          >
            <Eyebrow operation={operation} />
            {operation.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold tracking-wider uppercase">
          <span className="rounded-lg border px-3 py-2">
            {entries.length} rewards
          </span>
          {operation.transcendent === null ? null : (
            <Link
              href="/weapons?tier=Transcendent"
              prefetch={false}
              className="rounded-lg border px-3 py-2 transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Transcendent {operation.transcendent.chance}
              <span className="sr-only">
                {" "}
                on mission completion, Quality {
                  operation.transcendent.min
                } to {operation.transcendent.max}
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        <p className="text-muted-foreground">
          400% Infiltration Operations drop a{" "}
          <Link
            href="/reactors"
            prefetch={false}
            className="rounded-sm underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 outline-none hover:text-primary hover:decoration-current hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            reactor
          </Link>{" "}
          that matches the attribute and Arche type of the Descendant in use.
          {operation.transcendent === null
            ? null
            : ` Transcendent weapons: ${operation.transcendent.chance} on mission completion, Quality ${String(operation.transcendent.min)}–${String(operation.transcendent.max)}.`}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            400% days
          </span>
          {!operation.inCycle ? (
            <span className="text-xs text-muted-foreground">
              Not in the daily rotation
            </span>
          ) : (
            days.map((entry) => (
              <button
                key={entry}
                type="button"
                aria-pressed={entry === day}
                onClick={() => {
                  onPickDay(entry);
                }}
                className="rounded-full border bg-background/40 px-2.5 py-1 text-xs transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary/60 aria-pressed:bg-primary/15"
              >
                {dayLabel(entry, today)}
                <span className="sr-only">, {daySpan(entry)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold tracking-wider uppercase">
          <span
            aria-hidden="true"
            className="h-4 w-1 rounded-full bg-primary"
          />
          Rewards
        </h3>
        <ToggleGroup
          aria-label="Rewards"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          value={[tab]}
          onValueChange={(value) => {
            const next = rewardTabs.find((entry) => entry.kind === value.at(0));
            if (next !== undefined) {
              setTab(next.kind);
              setShowAll(false);
            }
          }}
        >
          {rewardTabs.map((entry) => (
            <ToggleGroupItem
              key={entry.kind}
              value={entry.kind}
              className={filterChipClass}
            >
              {entry.label}
              <span className="ml-1 text-muted-foreground tabular-nums">
                {count(entry.kind)}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not listed yet</p>
        ) : (
          <>
            <ul
              ref={tilesRef}
              className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
            >
              {(showAll ? shown : shown.slice(0, rewardsFirst)).map((entry) => (
                <li key={entry.name}>
                  <RewardTile entry={entry} />
                </li>
              ))}
            </ul>
            {shown.length > rewardsFirst ? (
              <button
                type="button"
                aria-expanded={showAll}
                onClick={() => {
                  setShowAll(!showAll);
                }}
                className="justify-self-center rounded-full border bg-background/40 px-4 py-1.5 text-sm transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {showAll
                  ? "Show fewer"
                  : `Show all ${String(shown.length)} rewards`}
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

/**
 * A reward as a compact tile: its art beside its name, a core's grades, and each way it
 * comes. A link to its page when it has one.
 */
function RewardTile({ entry }: { entry: RewardEntry }) {
  const body = (
    <>
      <span
        className={`grid size-14 shrink-0 place-items-center rounded-lg border ${entry.kind === "core" ? "border-primary/40" : ""}`}
        style={{
          backgroundImage:
            entry.kind === "core"
              ? "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--primary) 26%, transparent), transparent 75%)"
              : "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--foreground) 10%, transparent), transparent 75%)",
        }}
      >
        {entry.imageUrl === "" ? null : (
          // eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
          <img
            src={entry.imageUrl}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            className="size-12 object-contain"
          />
        )}
      </span>
      <span className="grid min-w-0 flex-1 content-center gap-1">
        <span className="text-xs leading-snug font-semibold">
          {entry.name}
          {entry.grades === null ? null : (
            <span className="font-normal text-muted-foreground">
              , {entry.grades}
            </span>
          )}
        </span>
        <span className="flex flex-wrap gap-1">
          {entry.ways.map((way) => (
            <span
              key={way}
              className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.625rem] leading-snug text-muted-foreground"
            >
              {way}
            </span>
          ))}
        </span>
      </span>
    </>
  );
  const tileClass =
    "flex h-full items-center gap-3 rounded-xl border bg-background/40 p-2";
  return entry.href === null ? (
    <span className={tileClass}>{body}</span>
  ) : (
    // A tile with a page wears an arrow, so it reads as a link.
    <Link
      href={entry.href}
      prefetch={false}
      className={`group/tile ${tileClass} transition-colors outline-none hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50`}
    >
      {body}
      <ArrowUpRight
        aria-hidden="true"
        className="size-3.5 shrink-0 self-start text-muted-foreground transition-colors group-hover/tile:text-primary"
      />
    </Link>
  );
}
