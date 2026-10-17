import { coreOptionDisplay } from "@/data/core-option-display";

/**
 * Core types as weapon pages and external component cards show them (ADR 0024, ADR
 * 0027): each type's cores and, at every core grade, the options a core can roll, from
 * NEXON's `core-type.json`. Plain data, shared by the server and the client.
 */

/** One option a core can roll, as a range. */
export interface CoreOption {
  /** As NEXON names it, such as "Max HP". */
  readonly name: string;
  /** NEXON's operator: "Multiply" for a percentage, "Add" for an amount. */
  readonly operator: string;
  readonly min: number;
  readonly max: number;
}

/** A core item, such as Hit Augmentation Core X. */
export interface CoreItem {
  readonly name: string;
  readonly imageUrl: string;
}

/** A core type at one grade: the core items it takes and what they can roll. */
export interface CoreGrade {
  /** 1 to 10, shown as I to X, as the game names the cores. */
  readonly grade: number;
  readonly cores: readonly CoreItem[];
  readonly options: readonly CoreOption[];
}

/** A core type, such as Recovery Augmentation, lowest grade first. */
export interface CoreType {
  readonly id: string;
  readonly name: string;
  /** The slots it fits, when a page has more slots than types ("Free", "Firepower"). */
  readonly slots: readonly string[];
  readonly grades: readonly CoreGrade[];
}

const romanNumerals = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
];

/** A grade as the game numbers its cores: 10 is X. Past X, the number. */
export function romanGrade(grade: number): string {
  return (
    (grade >= 1 ? romanNumerals.at(grade - 1) : undefined) ?? String(grade)
  );
}

/** An option's name as the game writes it ("Multi-Hit Chance(+)"). */
export function coreOptionLabel(option: CoreOption): string {
  return coreOptionDisplay[option.name]?.label ?? option.name;
}

const twoPlaces = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const threePlaces = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

/**
 * An option's range as the game writes it: a "Multiply" option as a percentage marked
 * [x] (Max HP 28.2–37.5% [x]), an "Add" option as an amount marked [+] (DEF
 * 5,625–7,500 [+]), unless `core-option-display.ts` says the game writes it otherwise
 * (Reload Time Modifier 2–74% [+], Fire Rate 1–20% [x]). Low to high; NEXON's
 * floating-point noise (0.28200000000000003) rounds away.
 */
export function formatCoreRange(option: CoreOption): string {
  const display = coreOptionDisplay[option.name];
  const percent =
    display?.percent ?? (option.operator === "Multiply" ? "scaled" : "none");
  const sign = display?.flip === true ? -1 : 1;
  const [low, high] = [option.min * sign, option.max * sign].sort(
    (a, b) => a - b,
  ) as [number, number];
  const format = (value: number) =>
    percent === "scaled"
      ? twoPlaces.format(value * 100)
      : threePlaces.format(value);
  const range = `${format(low)}–${format(high)}${percent === "none" ? "" : "%"}`;
  const marker =
    option.operator === "Multiply"
      ? " [x]"
      : option.operator === "Add"
        ? " [+]"
        : "";
  return `${range}${marker}`;
}
