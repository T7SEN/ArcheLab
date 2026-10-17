"use client";

import { useId } from "react";
import { useClosing } from "@/components/motion";
import { fellowPassives } from "@/data/fellows";
import { rowEnd } from "@/features/game-data/details-row";
import { CardItem, DetailsRowItem } from "@/features/game-data/grid-items";
import {
  ShowcaseArt,
  ShowcaseCardLink,
  ShowcaseStats,
  TierPill,
  showcaseGridClass,
  useShowcaseColumns,
} from "@/features/game-data/showcase";
import { useSearch, writeSearch } from "@/features/game-data/url-query";
import {
  fellowNumbersAt,
  fellowSearch,
  openFellow,
  type FellowCard,
} from "./fellow-card";
import { FellowDetails } from "./fellow-details";
import { PassiveIcon } from "./passive-icon";

/** The page's address, for a card's link. */
const indexPath = "/fellows";

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `fellow-card-${slug}`;

interface FellowShowcaseProps {
  entries: readonly FellowCard[];
}

/** The showcase with the URL's open Fellow. Render it inside `<Suspense>` (`useSearch`). */
export function FellowShowcaseFromUrl(props: FellowShowcaseProps) {
  return <FellowShowcase {...props} search={useSearch()} />;
}

/**
 * Every Fellow as a big card (T7SEN, 2026-10-17; ADR 0035): its art, tier and passive
 * and its four numbers at its top level. A card opens the Inversion Reinforcement
 * effects, every level and the research in a row under its own row; the open Fellow
 * lives in the URL query (`?fellow=`). With `search` "" this is what the static HTML
 * holds.
 */
export function FellowShowcase({
  entries,
  search,
}: FellowShowcaseProps & {
  /** The URL query the open Fellow comes from. */
  search: string;
}) {
  const ids = useId();
  const open = openFellow(
    search,
    entries.map((entry) => entry.slug),
  );
  const columns = useShowcaseColumns();
  const openIndex = entries.findIndex((entry) => entry.slug === open);
  // `at(-1)` would be the last card: nothing open finds no index.
  const openCard = openIndex === -1 ? null : (entries.at(openIndex) ?? null);
  const detailsId = `${ids}-details`;
  const closeDetails = (slug: string) => {
    writeSearch(fellowSearch(null));
    // The details held focus; it goes back to the card that opened them.
    document.getElementById(cardId(slug))?.focus({ preventScroll: true });
  };
  const items = entries.map((entry) => {
    const isOpen = entry.slug === openCard?.slug;
    const top = entry.levels.at(-1)?.level;
    const passive =
      entry.passive === null ? null : fellowPassives[entry.passive];
    return (
      <CardItem key={entry.slug} enter={false}>
        <ShowcaseCardLink
          id={cardId(entry.slug)}
          href={`${indexPath}${fellowSearch(entry.slug)}`}
          hex={entry.hex}
          open={isOpen}
          controls={detailsId}
          onToggle={() => {
            writeSearch(fellowSearch(isOpen ? null : entry.slug));
          }}
        >
          {/* The name comes first in the card's text, for assistive tech; the art sits
              above it on screen. */}
          <span className="grid gap-1.5">
            <span className="font-display text-2xl leading-tight font-semibold tracking-wide">
              {entry.name}
            </span>{" "}
            <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <TierPill name={entry.tierName} hex={entry.hex} />{" "}
              {passive === null || entry.passive === null ? null : (
                <span className="flex items-center gap-1.5">
                  <PassiveIcon
                    passive={entry.passive}
                    className="size-4 text-primary"
                  />
                  {passive.name}
                </span>
              )}
            </span>
          </span>{" "}
          <span className="order-first">
            <ShowcaseArt imageUrl={entry.imageUrl} hex={entry.hex} />
          </span>
          <ShowcaseStats
            stats={fellowNumbersAt(entry, top)}
            note={`At level ${String(top ?? "")}. ${isOpen ? "Close details" : "Open for every level, its effects and research"}`}
          />
        </ShowcaseCardLink>
      </CardItem>
    );
  });
  // Closed, the details fold away before they leave (ADR 0030).
  const [detailsCard, closing, closed] = useClosing(
    openCard,
    (card) => card.slug,
  );
  const detailsIndex =
    detailsCard === null
      ? -1
      : entries.findIndex((entry) => entry.slug === detailsCard.slug);
  if (detailsCard !== null && detailsIndex !== -1) {
    items.splice(
      rowEnd(detailsIndex, columns, entries.length) + 1,
      0,
      <DetailsRowItem
        key={`details-${detailsCard.slug}`}
        closing={closing}
        onClosed={closed}
      >
        <FellowDetails
          id={detailsId}
          card={detailsCard}
          onClose={() => {
            closeDetails(detailsCard.slug);
          }}
        />
      </DetailsRowItem>,
    );
  }

  return entries.length === 0 ? (
    <p className="rounded-2xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground">
      The Fellows couldn&apos;t be loaded for this build. They come back with
      the next one.
    </p>
  ) : (
    <ul aria-label="Fellows" className={showcaseGridClass}>
      {items}
    </ul>
  );
}
