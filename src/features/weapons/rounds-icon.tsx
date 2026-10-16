import { roundsIconUrl } from "@/data/rounds-icons";
import { cn } from "@/lib/utils";

/**
 * A rounds type's icon from NEXON's Library, beside its name (T7SEN, 2026-10-16). It
 * is decorative: the name next to it says the same, so it has no alt text.
 */
export function RoundsIcon({
  rounds,
  className,
}: {
  rounds: string | null;
  className?: string;
}) {
  const url = roundsIconUrl(rounds);
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
