/**
 * What an index shows when its data couldn't load for this build: one box, under the
 * hero that says the same, instead of empty filters and "No … matches these filters."
 * Shared by every index (ADR 0045).
 */
export function LoadFailed({ what }: { what: string }) {
  return (
    <p className="rounded-2xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground">
      The {what} couldn&apos;t be loaded for this build. They come back with the
      next one.
    </p>
  );
}
