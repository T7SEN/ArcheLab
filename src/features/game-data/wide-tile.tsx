import { wideArt } from "./wide-art";

/**
 * Reactor or external component art on a tile in its tier's color, as wide as the art's
 * own shape (ADR 0026, ADR 0027).
 */
export function WideTile({
  imageUrl,
  color,
  size,
}: {
  imageUrl: string;
  color: string;
  size: "sm" | "md" | "lg";
}) {
  const box = {
    sm: "h-12 w-[4.5rem]",
    md: "h-16 w-24",
    lg: "h-20 w-28",
  }[size];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl border px-1.5 ${box}`}
      style={{
        borderColor: `color-mix(in srgb, ${color} 45%, var(--border))`,
        backgroundImage: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${color} 35%, transparent), color-mix(in srgb, ${color} 8%, transparent) 75%)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- NEXON images load directly from NEXON's host, never through Vercel Image Optimization (SKILL.md landmine 2). */}
      <img
        src={imageUrl}
        alt=""
        width={wideArt.width}
        height={wideArt.height}
        loading="lazy"
        decoding="async"
        className="h-auto max-h-full w-full object-contain"
      />
    </span>
  );
}
