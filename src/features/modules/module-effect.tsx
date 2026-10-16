import { effectBlocks } from "./effect-blocks";

/**
 * A module's effect at one level, as NEXON words it (ADR 0025): lines of text, or a
 * trigger module's tables of names and values.
 */
export function ModuleEffect({ effect }: { effect: string | null }) {
  if (effect === null) {
    return (
      <p className="text-sm text-muted-foreground">
        No fixed effect is listed for this module.
      </p>
    );
  }
  return (
    <div className="grid gap-4">
      {effectBlocks(effect).map((block, index) =>
        block.kind === "text" ? (
          <p
            key={index}
            className="text-sm leading-relaxed whitespace-pre-line text-foreground/90"
          >
            {block.text}
          </p>
        ) : (
          <div key={index} className="grid gap-1.5">
            {block.title === null ? null : (
              <h4 className="text-xs font-medium tracking-wide text-primary uppercase">
                {block.title}
              </h4>
            )}
            <dl className="grid gap-1">
              {block.rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex justify-between gap-4 border-b border-border/50 pb-1 text-sm last:border-b-0"
                >
                  <dt className="text-muted-foreground">{row.name}</dt>
                  <dd className="text-right tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ),
      )}
    </div>
  );
}
