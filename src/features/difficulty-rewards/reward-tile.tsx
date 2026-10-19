import { CalendarX, CircuitBoard } from "lucide-react";
import { ArcheIcon, ElementIcon } from "@/features/descendants/type-icons";
import type { Reward } from "./reward-filters";

/** Each attribute's icon, by name. */
export type AttributeIcons = Readonly<Record<string, string>>;

/**
 * A reward's tile, in the box of the reactors' art tiles (ADR 0048): the attribute's
 * icon and the Arche type's symbol for a reactor, the External Components page's icon
 * for a slot. Always hidden from assistive tech: the words beside it say the same.
 */
export function RewardTile({
  reward,
  attributeIcons,
  size,
}: {
  /** null: not published; undefined: the week isn't known yet. */
  reward: Reward | null | undefined;
  attributeIcons: AttributeIcons;
  size: "md" | "lg";
}) {
  const box = size === "md" ? "h-16 w-24" : "h-20 w-28";
  const tinted = reward !== null;
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 grid-flow-col place-content-center items-center gap-2 rounded-xl border ${box}`}
      style={
        tinted
          ? {
              borderColor:
                "color-mix(in srgb, var(--primary) 45%, var(--border))",
              backgroundImage:
                "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--primary) 30%, transparent), color-mix(in srgb, var(--primary) 6%, transparent) 75%)",
            }
          : undefined
      }
    >
      {reward === undefined ? null : reward === null ? (
        <CalendarX className="size-6 text-muted-foreground" />
      ) : reward.kind === "reactor" ? (
        <>
          <ElementIcon
            url={attributeIcons[reward.attribute]}
            className={size === "md" ? "size-8" : "size-9"}
          />
          <ArcheIcon
            archeType={reward.archeType}
            className={size === "md" ? "size-6" : "size-7"}
          />
        </>
      ) : (
        <CircuitBoard
          className={`${size === "md" ? "size-7" : "size-8"} text-primary`}
        />
      )}
    </span>
  );
}

/**
 * A reward in words with its icons: "Electric", "Tech" for a reactor, "Processor" for a
 * slot. `kind` adds what it is for screen readers, where the card says it nowhere else.
 */
export function RewardText({
  reward,
  attributeIcons,
  kind = false,
}: {
  reward: Reward;
  attributeIcons: AttributeIcons;
  /** Say "Reactor" or "External component" first, to screen readers only. */
  kind?: boolean;
}) {
  if (reward.kind === "component") {
    return (
      <span className="flex items-center gap-1.5">
        <CircuitBoard
          aria-hidden="true"
          className="size-4 shrink-0 text-primary"
        />
        {kind ? <span className="sr-only">External component, </span> : null}
        {reward.slot}
      </span>
    );
  }
  return (
    <>
      {kind ? <span className="sr-only">Reactor, </span> : null}
      <span className="flex items-center gap-1.5">
        <ElementIcon url={attributeIcons[reward.attribute]} />
        {reward.attribute}
      </span>{" "}
      <span className="flex items-center gap-1.5">
        <ArcheIcon archeType={reward.archeType} />
        {reward.archeType}
      </span>
    </>
  );
}

/** A reward's name in a sentence or a heading: "Electric Tech", "Processor". */
export function rewardName(reward: Reward): string {
  return reward.kind === "reactor"
    ? `${reward.attribute} ${reward.archeType}`
    : reward.slot;
}
