"use client";

import { useId, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DescendantModule,
  DescendantSkill,
} from "@/lib/nexon/descendant-page";
import { SkillList, type SkillChange } from "./skill-list";

const none = "none";

/** A Transcendent module as the switch needs it, with its rarity color resolved. */
export interface TranscendentChoice {
  readonly module: DescendantModule;
  readonly hex: string;
}

/**
 * The skills with a Transcendent module switch (ADR 0023). Equipping a module in game
 * can change a skill, as Nightfall does to Raven Feather. NEXON's data gives the
 * module's effect, not the changed skill text, so picking one shows that effect and
 * marks the skills it names. With no Transcendent modules there is no switch.
 */
export function SkillsSection({
  skills,
  modules,
  elementIcons,
}: {
  skills: readonly DescendantSkill[];
  modules: readonly TranscendentChoice[];
  elementIcons: Readonly<Record<string, string>>;
}) {
  const labelId = useId();
  const [picked, setPicked] = useState<string>(none);
  const choice = modules.find((entry) => entry.module.name === picked) ?? null;
  const effect = choice?.module.effect ?? null;
  const change: SkillChange | null =
    choice === null || effect === null
      ? null
      : {
          moduleName: choice.module.name,
          hex: choice.hex,
          effect,
          skills: choice.module.changesSkills,
        };
  const items = [
    { value: none, label: "None" },
    ...modules.map((entry) => ({
      value: entry.module.name,
      label: entry.module.name,
    })),
  ];

  return (
    <div className="grid gap-5">
      {modules.length === 0 ? null : (
        <div className="grid gap-4 rounded-2xl border bg-card/60 p-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span id={labelId} className="text-sm font-medium">
              Transcendent module
            </span>
            <Select
              items={items}
              value={picked}
              onValueChange={(value) => {
                setPicked(typeof value === "string" ? value : none);
              }}
            >
              <SelectTrigger
                aria-labelledby={labelId}
                className="min-w-52 bg-background/60"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              Shows what equipping it changes.
            </span>
          </div>
          {/* Mounted before any pick, so screen readers announce the first one. */}
          <div aria-live="polite">
            {choice === null ? null : (
              <div
                key={choice.module.name}
                className="flex items-start gap-4 rounded-xl border px-4 py-3 duration-300 motion-safe:animate-in motion-safe:fade-in"
                style={{
                  borderColor: `color-mix(in srgb, ${choice.hex} 45%, var(--border))`,
                  backgroundImage: `radial-gradient(circle at 0% 50%, color-mix(in srgb, ${choice.hex} 14%, transparent), transparent 70%)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
                <img
                  src={choice.module.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="size-12 shrink-0 object-contain"
                />
                <div className="grid gap-1 text-sm">
                  <span className="font-display text-lg font-semibold tracking-wide">
                    {choice.module.name} equipped
                  </span>
                  {effect === null ? null : (
                    <p className="whitespace-pre-line text-foreground/85">
                      {effect}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {choice.module.changesSkills.length === 0
                      ? "Its effect names no skill, so no skill is marked."
                      : `Marked below: ${choice.module.changesSkills.join(", ")}. The module's effect is shown, not the changed skill text.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <SkillList skills={skills} elementIcons={elementIcons} change={change} />
    </div>
  );
}
