import { Motorbike } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { ShinyText } from "@/components/react-bits/shiny-text";
import { Badge } from "@/components/ui/badge";
import { rarityOf } from "@/features/game-data/rarity";
import type { VehicleCard } from "@/features/vehicles/vehicle-card";
import {
  VehicleShowcase,
  VehicleShowcaseFromUrl,
} from "@/features/vehicles/vehicle-showcase";
import { fetchVehicles } from "@/lib/nexon/vehicle-index";
import { pageMetadata } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

export const metadata: Metadata = pageMetadata({
  path: "/vehicles",
  title: "Vehicles",
  description:
    "Every vehicle of The First Descendant, with its speed, turning and boost at every level, and its research.",
});

export default async function VehiclesPage() {
  // Fetched once while the page is prerendered and refreshed by the weekly deploy
  // (ADR 0008, ADR 0037). Three vehicles of 20 levels each come with the page, as big
  // cards that open (T7SEN, 2026-10-17).
  const vehicles = await fetchVehicles();
  // Tier names and colors come from the chat registry here, on the server.
  const entries: VehicleCard[] = vehicles.map((vehicle) => {
    const rarity = rarityOf(vehicle.tier);
    return {
      slug: vehicle.slug,
      name: vehicle.name,
      description: vehicle.description,
      tierName: rarity?.name ?? vehicle.tier,
      hex: rarity?.hex ?? palette.primary,
      imageUrl: vehicle.imageUrl,
      stats: vehicle.stats,
      levels: vehicle.levels,
      research: vehicle.research,
    };
  });
  const maxLevel = Math.max(
    0,
    ...vehicles.map((vehicle) => vehicle.levels.at(-1)?.level ?? 0),
  );

  return (
    <>
      {/* The hero slides up under the floating navbar, as on the other pages. */}
      <section className="relative -mt-(--site-header-height) overflow-hidden border-b">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-6xl px-4 pt-[calc(var(--site-header-height)+3rem)] pb-10 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <Badge variant="secondary">
            <Motorbike aria-hidden="true" className="text-primary" />
            Every vehicle
          </Badge>
          <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-wide sm:text-5xl">
            <ShinyText
              color={palette.foreground}
              shineColor={palette.primary}
              speed={3}
              delay={2.5}
            >
              Vehicles
            </ShinyText>
          </h1>
          <p className="mt-3 max-w-2xl hero-text">
            {vehicles.length === 0
              ? "The vehicles couldn't be loaded for this build. They come back with the next one."
              : `All ${String(vehicles.length)} vehicles, up to level ${String(maxLevel)}. Open one for its speed, turning and boost at every level, and its research.`}
          </p>
        </div>
      </section>
      <section
        aria-label="All vehicles"
        className="mx-auto max-w-6xl px-4 py-10"
      >
        {/* The URL's open vehicle is read in the browser; the static HTML holds the
            cards with none open, the fallback (useSearchParams needs Suspense). */}
        <Suspense fallback={<VehicleShowcase entries={entries} search="" />}>
          <VehicleShowcaseFromUrl entries={entries} />
        </Suspense>
      </section>
    </>
  );
}
