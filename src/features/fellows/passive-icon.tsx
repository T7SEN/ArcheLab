import { Crosshair, Droplets, HeartPulse, type LucideIcon } from "lucide-react";
import type { FellowPassive } from "@/data/fellows";

/** ArcheLab's symbol for each passive: what it gives back. */
const passiveIcons: Readonly<Record<FellowPassive, LucideIcon>> = {
  hp: HeartPulse,
  rounds: Crosshair,
  mp: Droplets,
};

/** A passive's symbol, beside its name. */
export function PassiveIcon({
  passive,
  className,
}: {
  passive: FellowPassive;
  className?: string;
}) {
  const Icon = passiveIcons[passive];
  return <Icon aria-hidden="true" className={className} />;
}
