# The Vehicles page

`/vehicles` (ADR 0037): a big card per hover bike, built like the Fellows page (`docs/walkthroughs/fellows.md`); this covers what differs.

## The code path

1. **NEXON's data.** `src/lib/nexon/vehicle-index.ts` (server only) reads `vehicle.json`. `vehicleGroups` sorts vehicles by id and levels by level, names every stat from `stat.json` (a stat it can't name is left out), and finds each vehicle's research with `researchFor(research, "Vehicle", "vehicle_id", id)`. A vehicle keeps two lists: `stats`, the nine that stay the same, and `levels`, the four that grow at each level.
2. **The page.** `src/app/vehicles/page.tsx` turns each group into a `VehicleCard` (`src/features/vehicles/vehicle-card.ts`) with its tier's name and color from the chat registry.
3. **A card.** `vehicleKind` takes NEXON's line, "Speed Hover Bike, Vortex", and drops the ", Vortex"; a line that doesn't end with the name stays whole. `vehicleKeyStats` picks Max Speed, Max Speed on Boost, Turning Power and Boost Gauge Capacity at the top level, from the growing and fixed stats together.
4. **The details.** `LevelView` joins the level's growing stats and the fixed ones, then `groupVehicleStats` sorts them into `vehicleStatGroups` (Speed, Turning, Boost) in each group's own order, with anything else under Other and empty groups dropped. `formatVehicleStat` shows a name ending in "Modifier" as a percentage and anything else as NEXON gives it.

## Why it's shaped this way

- **Every stat in its group.** Players read a bike by speed, turning and boost; which numbers grow with the level matters less than where they belong.
- **No units.** NEXON gives none, so none are added (as on weapon pages).
- **`vehicleKind` is in the pure module,** not the client one: the server's database search and the palette call it too, and a server component can't call a function exported from a `"use client"` module.

## What would break it

- NEXON renaming a stat: it moves under Other until `vehicleStatGroups` names it, and a card's key number goes missing until `vehicleKeyStatNames` names it.
- A description not of the form "<kind>, <name>": the card shows the whole line.
