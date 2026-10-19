import { coreOptionDisplay } from "@/data/core-option-display";
import { slugOf } from "@/lib/slug";

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

/** The slot a core type goes in: "Firepower" for Firepower Augmentation. */
export function coreSlotName(typeName: string): string {
  return typeName.replace(/ Augmentation$/, "");
}

/**
 * A core type's card on the Cores index, open (ADR 0044): Firepower Augmentation is
 * `/cores?core=firepower`, and with a weapon type, only what it rolls on that type.
 */
export function coreHref(typeName: string, weaponType?: string): string {
  const core = `core=${slugOf(coreSlotName(typeName))}`;
  return weaponType === undefined
    ? `/cores?${core}`
    : `/cores?type=${slugOf(weaponType)}&${core}`;
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
 * (Reload Time Modifier 2–74% [+], Fire Rate 1–20% [x]). Low to high, negatives with a
 * minus sign and a spaced dash (Recoil −92 – −80% [+]); NEXON's floating-point noise
 * (0.28200000000000003) rounds away.
 */
export function formatCoreRange(option: CoreOption): string {
  const display = coreOptionDisplay[option.name];
  const percent =
    display?.percent ?? (option.operator === "Multiply" ? "scaled" : "none");
  const sign = display?.flip === true ? -1 : 1;
  const [low, high] = [option.min * sign, option.max * sign].sort(
    (a, b) => a - b,
  ) as [number, number];
  // A negative end takes a minus sign (U+2212), and the dash between the ends then
  // takes spaces: in the ranges' monospace font a minus and an en dash look alike, so
  // −92 – −80% reads where −92–−80% looked like -92--80%.
  const format = (value: number) => {
    const text =
      percent === "scaled"
        ? twoPlaces.format(Math.abs(value) * 100)
        : threePlaces.format(Math.abs(value));
    return value < 0 && text !== "0" ? `−${text}` : text;
  };
  const [from, to] = [format(low), format(high)];
  const dash = from.startsWith("−") || to.startsWith("−") ? " – " : "–";
  const range = `${from}${dash}${to}${percent === "none" ? "" : "%"}`;
  const marker =
    option.operator === "Multiply"
      ? " [x]"
      : option.operator === "Add"
        ? " [+]"
        : "";
  return `${range}${marker}`;
}
