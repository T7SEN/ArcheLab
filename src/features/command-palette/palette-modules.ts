/**
 * The command palette's Modules group (ADR 0022, ADR 0025). 573 modules would weigh on
 * every page if the layout passed them in like the Descendants and weapons, so they
 * come from a static file, `/modules/list`, loaded the first time the palette opens.
 */

/** A module as the palette lists it. */
export interface PaletteModule {
  readonly slug: string;
  readonly name: string;
  /** The highest tier among its versions, such as "Ancestors" or "Rare". */
  readonly tier: string;
  /** Its types and classes, for search. */
  readonly keywords: readonly string[];
}

/** The file's shape. */
export interface PaletteModuleList {
  readonly modules: readonly PaletteModule[];
}

export const paletteModulesUrl = "/modules/list";

function isModule(value: unknown): value is PaletteModule {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.slug === "string" &&
    typeof entry.name === "string" &&
    typeof entry.tier === "string" &&
    Array.isArray(entry.keywords) &&
    entry.keywords.every((keyword) => typeof keyword === "string")
  );
}

/** The list as the browser received it, or null if it isn't one. */
export function readModuleList(data: unknown): readonly PaletteModule[] | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const modules = (data as Record<string, unknown>).modules;
  return Array.isArray(modules) && modules.every(isModule) ? modules : null;
}

let loading: Promise<readonly PaletteModule[] | null> | null = null;

/** The list, fetched once per visit; a failure is asked for again next time. */
export function loadPaletteModules(): Promise<readonly PaletteModule[] | null> {
  loading ??= fetch(paletteModulesUrl)
    .then((response) => (response.ok ? response.json() : null))
    .then(readModuleList)
    .catch(() => null)
    .then((modules) => {
      if (modules === null) {
        loading = null;
      }
      return modules;
    });
  return loading;
}
