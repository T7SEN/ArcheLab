/** One small box on a card: a name, with a muted note such as a chance. */
export interface CardTag {
  readonly text: string;
  /** After the text, muted: "20%". */
  readonly note?: string;
}

/**
 * A card's description in a small box, the look of the Cores cards' roll tags (T7SEN,
 * 2026-10-18), on the Basic and Enhancement Materials and Mutant Cells cards. Cut to
 * `lines` lines. A span, since it sits inside a card's link.
 */
export function CardText({
  children,
  lines = 3,
}: {
  children: string;
  /** How many lines it shows before it is cut. */
  lines?: 2 | 3;
}) {
  return (
    <span className="rounded-md bg-secondary px-2.5 py-2 text-xs leading-relaxed text-foreground/85">
      <span className={lines === 2 ? "line-clamp-2" : "line-clamp-3"}>
        {children}
      </span>
    </span>
  );
}

/**
 * Short names in small boxes under a label, below a card's name: the look of the Cores
 * cards' "Can roll" (T7SEN, 2026-10-18), used for the rewards on the Amorphous
 * Materials cards. Spans only, since it sits inside a card's link.
 */
export function CardTags({
  label,
  tags,
}: {
  label: string;
  tags: readonly (string | CardTag)[];
}) {
  return (
    <span className="grid gap-1.5 border-t border-border/60 pt-3">
      <span className="text-[0.6875rem] font-medium text-muted-foreground">
        {label}
      </span>{" "}
      <span className="flex flex-wrap gap-1">
        {tags.map((entry) => {
          const tag = typeof entry === "string" ? { text: entry } : entry;
          return (
            <span
              key={tag.text}
              className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.6875rem] leading-snug text-foreground/85"
            >
              {tag.text}
              {tag.note === undefined ? null : (
                <span className="text-muted-foreground tabular-nums">
                  {` ${tag.note}`}
                </span>
              )}
            </span>
          );
        })}
      </span>
    </span>
  );
}
