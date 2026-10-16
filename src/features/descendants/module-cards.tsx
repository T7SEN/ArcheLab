import type { DescendantModule } from "@/lib/nexon/descendant-page";
import { rarityOf } from "@/features/game-data/rarity";

const factClass = "flex justify-between gap-3 text-sm";

/**
 * The modules only this Descendant can equip (ADR 0023), each in its rarity's color
 * from the chat registry: its image, type, socket, slot, capacity across its levels,
 * and its effect as NEXON words it.
 */
export function ModuleCards({
  modules,
  ultimateColor,
}: {
  modules: readonly DescendantModule[];
  /** The game's Ultimate color, for marking modules only the Ultimate can equip. */
  ultimateColor: string;
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => {
        const rarity = rarityOf(module.tier);
        const accent = rarity?.hex ?? "var(--primary)";
        return (
          <li
            key={module.name}
            className="grid content-start gap-4 overflow-hidden rounded-2xl border bg-card/60 p-5"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 45%, var(--border))`,
              backgroundImage: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${accent} 16%, transparent), transparent 65%)`,
            }}
          >
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
              <img
                src={module.imageUrl}
                alt=""
                width={72}
                height={72}
                loading="lazy"
                decoding="async"
                className="size-16 shrink-0 object-contain"
              />
              <div className="grid min-w-0 gap-1.5">
                <h3 className="font-display text-xl leading-tight font-semibold tracking-wide">
                  {module.name}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {rarity === null ? null : (
                    <span
                      className="w-fit rounded-full border px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: rarity.hex,
                        borderColor: `color-mix(in srgb, ${rarity.hex} 50%, transparent)`,
                      }}
                    >
                      {rarity.name}
                    </span>
                  )}
                  {module.ultimateOnly ? (
                    <span
                      className="w-fit rounded-full border px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: ultimateColor,
                        borderColor: `color-mix(in srgb, ${ultimateColor} 50%, transparent)`,
                      }}
                    >
                      Ultimate only
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <dl className="grid gap-1.5 border-y py-3">
              {module.type === null ? null : (
                <div className={factClass}>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{module.type}</dd>
                </div>
              )}
              {module.socket === null ? null : (
                <div className={factClass}>
                  <dt className="text-muted-foreground">Socket</dt>
                  <dd>{module.socket}</dd>
                </div>
              )}
              <div className={factClass}>
                <dt className="text-muted-foreground">Slot</dt>
                <dd>{module.slots.join(", ")}</dd>
              </div>
              <div className={factClass}>
                <dt className="text-muted-foreground">Capacity</dt>
                <dd className="tabular-nums">
                  {module.capacity.from.value === module.capacity.to.value
                    ? module.capacity.from.value
                    : `${String(module.capacity.from.value)} → ${String(module.capacity.to.value)}`}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {module.capacity.from.level === module.capacity.to.level
                      ? `level ${String(module.capacity.from.level)}`
                      : `levels ${String(module.capacity.from.level)}–${String(module.capacity.to.level)}`}
                  </span>
                </dd>
              </div>
            </dl>
            {module.effect === null ? (
              <p className="text-sm text-muted-foreground">
                No fixed effect is listed for this module.
              </p>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
                {module.effect}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
