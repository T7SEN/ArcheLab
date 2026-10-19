import { Info } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { slugOf } from "@/lib/slug";
import {
  karelsMothershipLoot,
  rotationalBoost,
  traitElementSources,
  transcendentDrops,
  transcendentFirstClears,
  transcendentShop,
  transcendentTradeMinimums,
  trialsLoot,
  type QualityRange,
} from "@/data/transcendent-weapon-sources";

const numberFormat = new Intl.NumberFormat("en-US");

const quality = (range: QualityRange) =>
  `${String(range.min)}–${String(range.max)}`;

const hard400 = " - Hard 400%";

/**
 * A Hard 400% row's operation on the 400% Infiltration Operations page, or null (ADR
 * 0050). Matched without a leading "The": the notes write "Asylum" and "The Magister
 * Lab" for The Asylum and Magister Lab.
 */
function operation400Href(
  content: string,
  operations: readonly string[],
): string | null {
  if (!content.endsWith(hard400)) {
    return null;
  }
  const bare = (slug: string) => slug.replace(/^the-/, "");
  const wanted = bare(slugOf(content.slice(0, -hard400.length)));
  const slug = operations.find((entry) => bare(entry) === wanted);
  return slug === undefined ? null : `/infiltration-400?operation=${slug}`;
}

const inlineLinkClass =
  "rounded-sm underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 outline-none hover:text-primary hover:decoration-current hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50";

/** "Transcendent Weapon Loot", linking its card on the Miscellaneous page (ADR 0050). */
function LootLink() {
  return (
    <Link
      href="/miscellaneous?item=transcendent-weapon-loot"
      prefetch={false}
      className={`${inlineLinkClass} text-foreground`}
    >
      Transcendent Weapon Loot
    </Link>
  );
}

/** A titled card in the panel's grid; `className` places it. */
function SourceCard({
  title,
  className,
  children,
}: {
  title: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`grid content-start gap-3 rounded-2xl border bg-card/60 p-5 ${className}`}
    >
      <h3 className="font-display text-xl font-semibold tracking-wide">
        {title}
      </h3>
      {children}
    </section>
  );
}

const headClass =
  "border-b px-3 py-2 text-left text-xs font-medium text-muted-foreground";
/**
 * The long table's header stays in view as it scrolls: an opaque copy of its card's
 * see-through background (`bg-card/60` over the page), so rows pass under it unseen.
 */
// Its bottom line is a shadow: a collapsed table's borders don't move with a sticky cell.
const stickyHeadClass = `${headClass} sticky top-0 z-10 bg-[color-mix(in_srgb,var(--card)_60%,var(--background))] shadow-[inset_0_-1px_0_var(--border)]`;
const cellClass = "border-b border-border/60 px-3 py-1.5";

/**
 * Where a Transcendent weapon comes from (T7SEN, 2026-10-17; ADR 0032): one set of
 * sources for every Transcendent weapon the Update 1.4.0 notes cover, from
 * `src/data/transcendent-weapon-sources.ts`, with a note that the chances are for a
 * random one, in T7SEN's words, rephrased.
 */
export function TranscendentSources({
  name,
  operations400,
}: {
  name: string;
  /** The 400% Infiltration Operations' addresses, for the Hard 400% rows' links. */
  operations400: readonly string[];
}) {
  return (
    <div className="grid gap-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        As of Update 1.4.5. A Transcendent weapon&apos;s Quality falls within
        the range of the content it comes from; defeating a monster has a very
        small chance to drop one above it. Each one you get raises your Base
        Quality, the lowest Quality you can get, up to 400.
      </p>
      {/* T7SEN, 2026-10-17: the chances are for random Transcendent Weapon Loot, and
          drop-rate bonuses raise them. */}
      <div
        role="note"
        className="flex gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
      >
        <Info
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        {/* Two lines, as T7SEN asked. */}
        <div className="grid gap-1">
          <p>
            Chances are for a random Transcendent weapon, not {name}{" "}
            specifically. Drop-rate bonuses raise them.
          </p>
          <p>
            One-time first-clear guarantees aren&apos;t in the mission rewards.
          </p>
        </div>
      </div>
      {/* One grid for the list and its six cards, so no space is left empty
          (T7SEN, 2026-10-17). Wide: 15 columns, the list 9 wide beside three cards 6
          wide, then three cards 5 wide. The list's card takes no height of its own
          (h-0) and fills its three rows (min-h-full), so the cards beside it set
          their height and the list scrolls within. Medium: the list across, the cards
          in pairs. Narrow: one column. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-15">
        <section className="flex flex-col gap-3 rounded-2xl border bg-card/60 p-5 md:col-span-2 lg:col-span-9 lg:row-span-3 lg:h-0 lg:min-h-full">
          <div className="grid gap-1">
            <h3
              id="transcendent-drops"
              className="font-display text-xl font-semibold tracking-wide"
            >
              Mission rewards
            </h3>
            <p className="text-sm text-muted-foreground">
              The chance on mission completion; defeating monsters there can
              drop one too.
            </p>
          </div>
          {/* 71 rows: the table scrolls inside its card (T7SEN, 2026-10-17). A
              scrolling box takes focus, so keyboards can scroll it too. */}
          <div
            role="region"
            aria-labelledby="transcendent-drops"
            tabIndex={0}
            className="max-h-[28rem] overflow-auto rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:max-h-none lg:min-h-0 lg:flex-1"
          >
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className={stickyHeadClass}>
                    Content
                  </th>
                  <th scope="col" className={`${stickyHeadClass} text-right`}>
                    Quality
                  </th>
                  <th scope="col" className={`${stickyHeadClass} text-right`}>
                    Chance
                  </th>
                </tr>
              </thead>
              <tbody>
                {transcendentDrops.map((drop) => {
                  const href = operation400Href(drop.content, operations400);
                  return (
                    <tr key={drop.content} className="even:bg-background/30">
                      <th
                        scope="row"
                        className={`${cellClass} text-left font-normal`}
                      >
                        {/* A 400% operation opens on its page (ADR 0050). */}
                        {href === null ? (
                          drop.content
                        ) : (
                          <Link
                            href={href}
                            prefetch={false}
                            className={inlineLinkClass}
                          >
                            {drop.content}
                          </Link>
                        )}
                      </th>
                      <td
                        className={`${cellClass} text-right font-mono whitespace-nowrap tabular-nums`}
                      >
                        {quality(drop.quality)}
                      </td>
                      <td
                        className={`${cellClass} text-right font-mono tabular-nums`}
                      >
                        {drop.chance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <SourceCard title="First clear" className="lg:col-span-6">
          <p className="text-sm text-muted-foreground">
            Guaranteed on the first clear of these Infiltration Operations, at
            this Quality.
          </p>
          <dl className="grid gap-1.5 text-sm">
            {transcendentFirstClears.map((clear) => (
              <div key={clear.content} className="flex justify-between gap-4">
                <dt>{clear.content}</dt>
                <dd className="font-mono tabular-nums">{clear.quality}</dd>
              </div>
            ))}
          </dl>
        </SourceCard>

        <SourceCard title="Karel's Mothership" className="lg:col-span-6">
          <dl className="grid gap-1.5 text-sm">
            {karelsMothershipLoot.map((loot) => (
              <div key={loot.difficulty} className="flex justify-between gap-4">
                <dt>
                  {loot.difficulty}{" "}
                  <span className="text-muted-foreground">
                    Quality {quality(loot.quality)}
                  </span>
                </dt>
                <dd className="font-mono tabular-nums">{loot.chance}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">
            <LootLink /> on mission completion. Its Commanders have a small
            chance to drop one, and Common and Elite monsters a very small
            chance.
          </p>
        </SourceCard>

        <SourceCard title="Trials" className="lg:col-span-6">
          <p className="text-sm text-muted-foreground">
            <LootLink />, a {trialsLoot.chance} chance each round, at this
            Quality. Its two dungeons, Protocol 001 and Protocol 002, take turns
            each day with the same rewards.
          </p>
          {/* A row per round and a column per build: four rounds across didn't fit
                the side column (T7SEN, 2026-10-17). */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className={headClass}>
                  Round
                </th>
                <th scope="col" className={`${headClass} text-right`}>
                  Your build
                </th>
                <th scope="col" className={`${headClass} text-right`}>
                  Rotational Build
                </th>
              </tr>
            </thead>
            <tbody>
              {trialsLoot.rounds.map((own, index) => {
                const rotational = trialsLoot.rotational.at(index);
                return (
                  <tr key={index}>
                    <th
                      scope="row"
                      className={`${cellClass} text-left font-normal`}
                    >
                      {index + 1}
                    </th>
                    <td
                      className={`${cellClass} text-right font-mono whitespace-nowrap tabular-nums`}
                    >
                      {quality(own)}
                    </td>
                    <td
                      className={`${cellClass} text-right font-mono whitespace-nowrap tabular-nums`}
                    >
                      {rotational === undefined ? "" : quality(rotational)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SourceCard>
        <SourceCard title="Deslin in Albion" className="lg:col-span-5">
          <p className="text-sm text-muted-foreground">
            Sells Transcendent Weapon Boxes for Transcendent Trait Element.
          </p>
          <dl className="grid gap-2 text-sm">
            {transcendentShop.map((entry) => (
              <div key={entry.item} className="grid gap-0.5">
                <dt className="font-medium">{entry.item}</dt>
                <dd className="text-muted-foreground">
                  {numberFormat.format(entry.price)} Transcendent Trait Element
                  · {entry.limit}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">
            Dismantling a Transcendent weapon gives Transcendent Trait Element,
            more for a higher level and Quality range. Merit Exchange
            (Excavation Chief Reina in Albion) sells{" "}
            {traitElementSources.meritExchange.amount} for{" "}
            {traitElementSources.meritExchange.price} Merit Token,{" "}
            {traitElementSources.meritExchange.limit}.
          </p>
        </SourceCard>

        <SourceCard title="Daily boost" className="lg:col-span-5">
          <p className="text-sm text-muted-foreground">
            Each day, {rotationalBoost.perDay} of these get a{" "}
            {rotationalBoost.boost} chance on Transcendent weapons, on top of
            other boosts. The map marks them among content with ongoing events.
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {rotationalBoost.contents.map((content) => (
              <li
                key={content}
                className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.6875rem] leading-snug text-foreground/85"
              >
                {content}
              </li>
            ))}
          </ul>
        </SourceCard>

        <SourceCard title="Trading" className="lg:col-span-5">
          <p className="text-sm text-muted-foreground">
            Players sell Transcendent weapons by Private Trading or Lounge
            Storage Trade, at no less than this many Caliber each. A traded
            weapon becomes bound and gives no Base Quality EXP.
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {transcendentTradeMinimums.map((entry) => (
              <div key={entry.category} className="flex justify-between gap-4">
                <dt>{entry.category}</dt>
                <dd className="font-mono tabular-nums">
                  {numberFormat.format(entry.caliber)}
                </dd>
              </div>
            ))}
          </dl>
        </SourceCard>
      </div>
    </div>
  );
}
