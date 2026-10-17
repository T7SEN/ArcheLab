import { rarityOf } from "@/features/game-data/rarity";
import { vehicleKind } from "@/features/vehicles/vehicle-card";
import type { VehicleGroup } from "@/lib/nexon/vehicle-index";
import type { PaletteVehicle } from "./site-commands";

/**
 * The vehicles the palette offers, as plain data for the server layout to hand the
 * client provider (ADR 0022, ADR 0037): 3 rows. Each opens its details on the Vehicles page,
 * A–Z, with its tier and kind beside it.
 */
export function paletteVehicles(
  vehicles: readonly VehicleGroup[],
): PaletteVehicle[] {
  return vehicles
    .map((vehicle) => ({
      name: vehicle.name,
      href: `/vehicles?vehicle=${vehicle.slug}`,
      hint: [rarityOf(vehicle.tier)?.name ?? vehicle.tier, vehicleKind(vehicle)]
        .filter((part) => part !== "")
        .join(" · "),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
