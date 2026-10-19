import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { DescendantModule } from "@/lib/nexon/descendant-page";
import { moduleTierOf } from "@/features/game-data/rarity";
import { SlotIcon, SocketIcon } from "@/features/modules/fact-icons";
import { slugOf } from "@/lib/slug";

const factClass = "flex justify-between gap-3 text-sm";

/**
 * The modules only this Descendant can equip (ADR 0023), each in its rarity's color
 * from the chat registry, or as Ancestors, a tier of its own (ADR 0025): its image,
 * type, socket, slot, capacity across its levels, and its effect as NEXON words it.
 * Its name links to its details on the modules index.
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
        // Ancestor modules are a tier of their own, in Transcendent's color.
        const rarity = moduleTierOf(module.tier, module.type);
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
                  {/* Its details on the modules index, every level (ADR 0025). No
                      prefetch: each would load the whole index. */}
                  <Link
                    href={`/modules?module=${slugOf(module.name)}`}
                    prefetch={false}
                    className="group/name rounded-sm underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {module.name}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="ml-1 inline size-4 align-baseline text-muted-foreground transition-colors group-hover/name:text-primary"
                    />
                  </Link>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {rarity === null ? null : (
                    <span
                      className="w-fit rounded-full border px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: accent,
                        borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
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
                        borderColor: `color-mix(in srgb, ${ultimateColor} 45%, transparent)`,
                      }}
                    >
                      Ultimate only
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <dl className="grid gap-1.5 border-y py-3">
              {/* In the modules index's order, with its icons: socket, type, slot. */}
              {module.socket === null ? null : (
                <div className={factClass}>
                  <dt className="text-muted-foreground">Socket</dt>
                  <dd className="flex items-center gap-1.5">
                    <SocketIcon socket={module.socket} />
                    {module.socket}
                  </dd>
                </div>
              )}
              {/* An Ancestor module's type is its tier, already shown above. */}
              {module.type === null || module.type === rarity?.name ? null : (
                <div className={factClass}>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{module.type}</dd>
                </div>
              )}
              <div className={factClass}>
                <dt className="text-muted-foreground">Slot</dt>
                <dd className="grid justify-items-end gap-1">
                  {module.slots.map((slot) => (
                    <span key={slot} className="flex items-center gap-1.5">
                      <SlotIcon slot={slot} />
                      {slot}
                    </span>
                  ))}
                </dd>
              </div>
              {module.capacity === null ? null : (
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
              )}
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
