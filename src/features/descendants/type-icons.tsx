import { Atom, Box, Cog, Orbit } from "lucide-react";

/** An attribute's NEXON icon (from `elementIconUrls`), or nothing without one. */
export function ElementIcon({
  url,
  className = "size-4",
}: {
  url: string | undefined;
  className?: string;
}) {
  return url === undefined ? null : (
    // eslint-disable-next-line @next/next/no-img-element -- NEXON's Library art loads from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2).
    <img
      src={url}
      alt=""
      width={32}
      height={32}
      loading="lazy"
      decoding="async"
      className={`${className} shrink-0 object-contain`}
    />
  );
}

/**
 * An Arche type's symbol, or nothing for a type ArcheLab has none for. These are
 * ArcheLab's own symbols (ADR 0023): NEXON publishes no Arche type icons, none in the
 * Open API and none in the Library's icons (checked 2026-10-16).
 */
export function ArcheIcon({
  archeType,
  className = "size-4",
}: {
  archeType: string;
  className?: string;
}) {
  const props = {
    "aria-hidden": true,
    className: `${className} shrink-0 text-primary`,
  } as const;
  switch (archeType) {
    case "Fusion":
      return <Atom {...props} />;
    case "Singular":
      return <Orbit {...props} />;
    case "Dimension":
      return <Box {...props} />;
    case "Tech":
      return <Cog {...props} />;
    default:
      return null;
  }
}
