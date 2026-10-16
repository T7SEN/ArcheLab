import { Sword } from "lucide-react";
import {
  descendantModuleIconUrl,
  slotIconUrl,
  socketIconUrl,
} from "@/data/module-icons";
import { RoundsIcon } from "@/features/weapons/rounds-icon";
import { cn } from "@/lib/utils";

/**
 * Icons from NEXON's Library beside module facts (ADR 0025). Each is decorative: the
 * name next to it says the same, so none has alt text.
 */
function LibraryIcon({
  url,
  className,
}: {
  url: string | null;
  className?: string;
}) {
  return url === null ? null : (
    // eslint-disable-next-line @next/next/no-img-element -- NEXON's Library art loads directly from NEXON's CDN, never through Vercel Image Optimization (SKILL.md landmine 2).
    <img
      src={url}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
      className={cn("size-4 shrink-0 object-contain", className)}
    />
  );
}

export function SocketIcon({
  socket,
  className,
}: {
  socket: string | null;
  className?: string;
}) {
  return <LibraryIcon url={socketIconUrl(socket)} className={className} />;
}

export function SlotIcon({
  slot,
  className,
}: {
  slot: string;
  className?: string;
}) {
  return <LibraryIcon url={slotIconUrl(slot)} className={className} />;
}

/**
 * A module category's icon: the Library's for Descendant modules and each rounds class.
 * The Library has none for melee modules, so they take ArcheLab's own sword.
 */
export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  if (category === "Descendant") {
    return <LibraryIcon url={descendantModuleIconUrl} className={className} />;
  }
  if (category === "Melee Weapon") {
    return (
      <Sword
        aria-hidden="true"
        className={cn("size-4 shrink-0 text-muted-foreground", className)}
      />
    );
  }
  return <RoundsIcon rounds={category} className={className} />;
}
