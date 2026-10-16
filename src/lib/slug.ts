/**
 * A page address from a name: "Ultimate Bunny" is `ultimate-bunny`, and "Emperor's Guard
 * Lance" is `emperors-guard-lance`, with the apostrophe dropped rather than split on.
 */
export function slugOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
