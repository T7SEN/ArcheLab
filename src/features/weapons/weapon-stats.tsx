import type { WeaponStat } from "@/lib/nexon/weapon-page";
import { groupStats } from "./stat-groups";

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/**
 * Every base stat NEXON lists for a weapon (ADR 0024), in cards by what it does
 * (`stat-groups.ts`). Values are NEXON's own numbers, with no units added: the data
 * gives none.
 */
export function WeaponStats({ stats }: { stats: readonly WeaponStat[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groupStats(stats).map((group) => (
        <li
          key={group.title}
          className="grid content-start gap-3 rounded-2xl border bg-card/60 p-5"
        >
          <h3 className="font-display text-xl font-semibold tracking-wide">
            {group.title}
          </h3>
          <dl className="grid">
            {group.stats.map((stat) => (
              <div
                key={stat.name}
                className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-b-0 last:pb-0"
              >
                <dt className="text-muted-foreground">{stat.name}</dt>
                <dd className="font-medium tabular-nums">
                  {/* A real minus sign, as the core ranges and stat changes write it. */}
                  {numberFormat.format(stat.value).replace("-", "−")}
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}
