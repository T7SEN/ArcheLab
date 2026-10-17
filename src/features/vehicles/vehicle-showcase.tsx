"use client";

import { useId } from "react";
import { useClosing } from "@/components/motion";
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
  openVehicle,
  vehicleKeyStats,
  vehicleKind,
  vehicleSearch,
  type VehicleCard,
} from "./vehicle-card";
import { VehicleDetails } from "./vehicle-details";

/** The page's address, for a card's link. */
const indexPath = "/vehicles";

/** A card's id, for focus to come back to it when its details close. */
const cardId = (slug: string) => `vehicle-card-${slug}`;

interface VehicleShowcaseProps {
  entries: readonly VehicleCard[];
}

/** The showcase with the URL's open vehicle. Render it inside `<Suspense>` (`useSearch`). */
export function VehicleShowcaseFromUrl(props: VehicleShowcaseProps) {
  return <VehicleShowcase {...props} search={useSearch()} />;
}

/**
 * Every vehicle as a big card (T7SEN, 2026-10-17; ADR 0037): its art, tier and kind and
 * four key numbers at its top level. A card opens every stat and the research in a row
 * under its own row; the open vehicle lives in the URL query (`?vehicle=`). With
 * `search` "" this is what the static HTML holds.
 */
export function VehicleShowcase({
  entries,
  search,
}: VehicleShowcaseProps & {
  /** The URL query the open vehicle comes from. */
  search: string;
}) {
  const ids = useId();
  const open = openVehicle(
    search,
    entries.map((entry) => entry.slug),
  );
  const columns = useShowcaseColumns();
  const openIndex = entries.findIndex((entry) => entry.slug === open);
  // `at(-1)` would be the last card: nothing open finds no index.
  const openCard = openIndex === -1 ? null : (entries.at(openIndex) ?? null);
  const detailsId = `${ids}-details`;
  const closeDetails = (slug: string) => {
    writeSearch(vehicleSearch(null));
    // The details held focus; it goes back to the card that opened them.
    document.getElementById(cardId(slug))?.focus({ preventScroll: true });
  };
  const items = entries.map((entry) => {
    const isOpen = entry.slug === openCard?.slug;
    const top = entry.levels.at(-1)?.level;
    return (
      <CardItem key={entry.slug} enter={false}>
        <ShowcaseCardLink
          id={cardId(entry.slug)}
          href={`${indexPath}${vehicleSearch(entry.slug)}`}
          hex={entry.hex}
          open={isOpen}
          controls={detailsId}
          onToggle={() => {
            writeSearch(vehicleSearch(isOpen ? null : entry.slug));
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
              {vehicleKind(entry)}
            </span>
          </span>{" "}
          <span className="order-first">
            <ShowcaseArt imageUrl={entry.imageUrl} hex={entry.hex} />
          </span>
          <ShowcaseStats
            stats={vehicleKeyStats(entry)}
            note={`At level ${String(top ?? "")}. ${isOpen ? "Close details" : "Open for every stat and research"}`}
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
        <VehicleDetails
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
      The vehicles couldn&apos;t be loaded for this build. They come back with
      the next one.
    </p>
  ) : (
    <ul aria-label="Vehicles" className={showcaseGridClass}>
      {items}
    </ul>
  );
}
