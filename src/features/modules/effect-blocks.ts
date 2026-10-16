/**
 * A module's effect text, split into what the details show (ADR 0025). Most effects are
 * lines of text. Trigger modules' effects are tables: sections apart by a blank line,
 * each a title line, then rows of a name and a value split by a tab, as in
 * "Basic Info\nCooldown\t15s\n\nArche Leak\nTime to Trigger\t30s".
 */

export interface EffectRow {
  readonly name: string;
  readonly value: string;
}

export type EffectBlock =
  | { readonly kind: "text"; readonly text: string }
  | {
      readonly kind: "table";
      readonly title: string | null;
      readonly rows: readonly EffectRow[];
    };

/** The blocks of an effect, in order; blank lines between sections are dropped. */
export function effectBlocks(effect: string): EffectBlock[] {
  return effect
    .split(/\n\s*\n/)
    .map((section) => section.split("\n").filter((line) => line.trim() !== ""))
    .filter((lines) => lines.length > 0)
    .map((lines): EffectBlock => {
      if (!lines.some((line) => line.includes("\t"))) {
        return { kind: "text", text: lines.join("\n") };
      }
      const [first = "", ...rest] = lines;
      const titled = !first.includes("\t");
      return {
        kind: "table",
        title: titled ? first : null,
        rows: (titled ? rest : lines).map((line) => {
          const at = line.indexOf("\t");
          return at === -1
            ? { name: line, value: "" }
            : { name: line.slice(0, at), value: line.slice(at + 1).trim() };
        }),
      };
    });
}
