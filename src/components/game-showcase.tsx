import { Crosshair, UsersRound } from "lucide-react";
import type { CSSProperties } from "react";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import { descendantChatIds } from "@/features/chat/ui/descendant-icons";
import { shareHash } from "@/features/chat/ui/share-link";
import type {
  DescendantItem,
  DescendantShowcase,
  WeaponItem,
  WeaponShowcase,
} from "@/lib/nexon/showcase";
import { CardCarousel } from "./card-carousel";

/** The chat image id that shows each Descendant (ADR 0014). */
const chatIdByName = descendantChatIds();

/** The game's own color for Ultimate characters, verified in game (chat-tags.json). */
const ultimateColor =
  chatRegistry.tagsByName.get("ultimatecharacter")?.hex ?? "var(--primary)";

const glow = (color: string): CSSProperties => ({
  backgroundImage: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${color} 34%, transparent), transparent 72%)`,
});
const violetGlow = glow("var(--primary)");
const goldGlow = glow(ultimateColor);

const cardClass =
  "grid h-full overflow-hidden rounded-2xl border border-border bg-card/70";

interface GameShowcaseProps {
  descendants: DescendantShowcase;
  weapons: WeaponShowcase;
}

/**
 * The home page's Descendant and weapon carousels (ADR 0018), from NEXON's metadata,
 * built with the page and refreshed by the weekly deploy. A carousel with nothing
 * usable from NEXON is left out.
 */
export function GameShowcase({ descendants, weapons }: GameShowcaseProps) {
  return (
    <>
      {descendants.items.length === 0 ? null : (
        <CardCarousel
          icon={<UsersRound />}
          title="Descendants"
          description={`All ${String(descendants.items.length)} Descendants in NEXON's data, newest first, with the ${String(descendants.ultimates)} Ultimates in gold. Pick one to start a chat message with their icon.`}
        >
          {descendants.items.map((item) => (
            <li key={item.name}>
              <DescendantCard item={item} />
            </li>
          ))}
        </CardCarousel>
      )}
      {weapons.items.length === 0 ? null : (
        <CardCarousel
          icon={<Crosshair />}
          title="Weapons"
          description={`${String(weapons.total)} weapons in ${String(weapons.types)} types. Each card shows the highest tier of its type.`}
          seconds={7}
        >
          {weapons.items.map((item) => (
            <li key={item.name}>
              <WeaponCard item={item} />
            </li>
          ))}
        </CardCarousel>
      )}
    </>
  );
}

function DescendantCard({ item }: { item: DescendantItem }) {
  const id = chatIdByName.get(item.name);
  const hash =
    id === undefined ? null : shareHash(`<img id="${id}"/>`, "normal");
  const shortName = item.ultimate
    ? item.name.slice("Ultimate ".length)
    : item.name;
  const content = (
    <>
      <span
        className="relative block aspect-[4/3] overflow-hidden"
        style={item.ultimate ? goldGlow : violetGlow}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
        <img
          src={item.imageUrl}
          alt=""
          width={256}
          height={256}
          loading="lazy"
          decoding="async"
          className="absolute inset-x-0 bottom-0 mx-auto h-[94%] w-auto object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
      </span>
      <span className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        <span className="truncate font-display text-lg font-semibold tracking-wide">
          {shortName}
        </span>
        {/* Keeps "Hailey" and "Ultimate" apart in the card's text for assistive tech; a
            flex row draws no space. */}{" "}
        {item.ultimate ? (
          <span
            className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium"
            style={{
              color: ultimateColor,
              borderColor: `color-mix(in srgb, ${ultimateColor} 45%, transparent)`,
            }}
          >
            Ultimate
          </span>
        ) : null}
      </span>
    </>
  );
  return hash === null ? (
    <div className={cardClass}>{content}</div>
  ) : (
    <a
      href={`/tools/chat${hash}`}
      // The visible name comes first, then the badge, so speech input can say what it
      // sees (WCAG 2.5.3): "Hailey Ultimate", not "Ultimate Hailey".
      aria-label={`${shortName}${item.ultimate ? " Ultimate" : ""}: start a chat message with this Descendant's icon`}
      className={`group ${cardClass} transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset`}
    >
      {content}
    </a>
  );
}

function WeaponCard({ item }: { item: WeaponItem }) {
  return (
    <figure className={cardClass}>
      <span
        className="grid aspect-[4/3] place-items-center p-6"
        style={violetGlow}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="max-h-full w-auto max-w-full object-contain"
        />
      </span>
      <figcaption className="grid gap-0.5 border-t border-border px-4 py-3">
        <span className="truncate font-display text-lg font-semibold tracking-wide">
          {item.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {item.type} · {item.roundsType}
        </span>
      </figcaption>
    </figure>
  );
}
