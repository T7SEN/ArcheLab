/**
 * A research time in words. NEXON's `research_time` is in seconds: T7SEN checked in game
 * that Raven takes 16 hours (57600) and each of her parts 8 hours (28800), 2026-10-17.
 * Hours stay hours past a day, as 36 hours rather than a day and a half.
 */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const units = [
    { size: 3600, name: "hour" },
    { size: 60, name: "minute" },
    { size: 1, name: "second" },
  ] as const;
  let left = whole;
  const parts: string[] = [];
  for (const unit of units) {
    const count = Math.floor(left / unit.size);
    left -= count * unit.size;
    if (count > 0) {
      parts.push(`${String(count)} ${unit.name}${count === 1 ? "" : "s"}`);
    }
  }
  return parts.length === 0 ? "0 seconds" : parts.join(" ");
}
