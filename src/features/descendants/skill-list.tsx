import type { DescendantSkill } from "@/lib/nexon/descendant-page";
import { ArcheIcon, ElementIcon } from "./type-icons";

const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground";

/** What the equipped Transcendent module changes, for marking the skills it names. */
export interface SkillChange {
  readonly moduleName: string;
  /** The module's rarity color. */
  readonly hex: string;
  readonly effect: string;
  readonly skills: readonly string[];
}

/**
 * Every skill at once, in NEXON's order (ADR 0023): its icon, name, type, attribute
 * and Arche type, and the full description, so nothing needs a click to read. The
 * passive skill spans the row on wide screens. A skill the equipped Transcendent
 * module names is marked, with the module's effect beneath it.
 */
export function SkillList({
  skills,
  elementIcons,
  change = null,
}: {
  skills: readonly DescendantSkill[];
  /** Each attribute's icon URL, from `elementIconUrls`. */
  elementIcons: Readonly<Record<string, string>>;
  change?: SkillChange | null;
}) {
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {skills.map((skill) => {
        const passive = /passive/i.test(skill.type);
        const changed = change?.skills.includes(skill.name) === true;
        return (
          <li
            key={skill.name}
            data-changed={changed || undefined}
            className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 rounded-2xl border bg-card/60 p-4 transition-colors motion-reduce:transition-none sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:p-5 ${passive ? "border-primary/40 lg:col-span-2" : ""}`}
            style={
              changed
                ? {
                    borderColor: change.hex,
                    boxShadow: `0 0 0 1px ${change.hex}, 0 12px 32px -16px ${change.hex}`,
                  }
                : undefined
            }
          >
            <span className="grid aspect-square place-items-center rounded-xl bg-[radial-gradient(circle_at_50%_35%,color-mix(in_srgb,var(--primary)_30%,transparent),transparent_70%)] ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
              <img
                src={skill.imageUrl}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="size-[80%] object-contain"
              />
            </span>
            <div className="grid min-w-0 content-start gap-2">
              <h3 className="font-display text-xl font-semibold tracking-wide">
                {skill.name}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={`${chipClass} ${passive ? "border-primary/50 text-foreground" : ""}`}
                >
                  {skill.type}
                </span>
                {skill.element === null ? null : (
                  <span className={chipClass}>
                    <ElementIcon
                      url={elementIcons[skill.element]}
                      className="size-3.5"
                    />
                    {skill.element}
                  </span>
                )}
                {skill.archeType === null ? null : (
                  <span className={chipClass}>
                    <ArcheIcon
                      archeType={skill.archeType}
                      className="size-3.5"
                    />
                    {skill.archeType}
                  </span>
                )}
              </div>
              <div className="grid gap-2 text-sm leading-relaxed text-foreground/85">
                {skill.description
                  .split(/\n{2,}/)
                  .filter((paragraph) => paragraph.trim() !== "")
                  .map((paragraph, index) => (
                    // NEXON's text, as text nodes; its line breaks stay.
                    <p key={index} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
              </div>
              {changed ? (
                <div
                  className="mt-1 grid gap-1 rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: `color-mix(in srgb, ${change.hex} 45%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${change.hex} 8%, transparent)`,
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: change.hex }}
                  >
                    Changed by {change.moduleName}
                  </span>
                  <p className="whitespace-pre-line text-foreground/85">
                    {change.effect}
                  </p>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
