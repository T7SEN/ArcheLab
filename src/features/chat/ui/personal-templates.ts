import { z } from "zod";

/**
 * Personal templates: messages a player saves and reuses, kept in this browser's
 * localStorage and nowhere else (ADR 0017, SKILL.md section 5.4). Stored data is
 * untrusted: it is validated on every read and rendered as text only.
 */

/** The storage key. A new version gets a new key rather than a migration. */
export const templatesStorageKey = "archelab.chat.templates.v1";
export const maxTemplates = 50;
export const maxTemplateNameLength = 40;
/** Chat messages are a few hundred characters at most, even past the limit. */
export const maxTemplateMarkupLength = 2000;

const savedTemplateSchema = z.strictObject({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(maxTemplateNameLength),
  markup: z.string().min(1).max(maxTemplateMarkupLength),
  channel: z.string().regex(/^[a-z]+$/),
  savedAt: z.iso.datetime(),
});

export type SavedTemplate = z.infer<typeof savedTemplateSchema>;

/**
 * This browser's localStorage, or null when it is blocked (a private window, site
 * settings). Reading `window.localStorage` itself can throw (SKILL.md landmine 9).
 */
export function browserStorage(): Storage | null {
  try {
    const storage = window.localStorage;
    const probe = `${templatesStorageKey}.probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/**
 * The saved templates, newest first. Entries that fail validation are dropped one by
 * one; unreadable data reads as none.
 */
export function loadTemplates(
  storage: Pick<Storage, "getItem">,
): SavedTemplate[] {
  let data: unknown;
  try {
    const raw = storage.getItem(templatesStorageKey);
    if (raw === null) {
      return [];
    }
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .flatMap((entry) => {
      const result = savedTemplateSchema.safeParse(entry);
      return result.success ? [result.data] : [];
    })
    .slice(0, maxTemplates);
}

/** Writes the templates. False when the browser refuses: blocked, or full. */
export function storeTemplates(
  storage: Pick<Storage, "setItem">,
  templates: readonly SavedTemplate[],
): boolean {
  try {
    storage.setItem(templatesStorageKey, JSON.stringify(templates));
    return true;
  } catch {
    return false;
  }
}

/** Names match regardless of case and surrounding spaces. */
function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** The template with this name, if one is saved. */
export function templateNamed(
  templates: readonly SavedTemplate[],
  name: string,
): SavedTemplate | undefined {
  return templates.find((template) => sameName(template.name, name));
}

export type SaveResult =
  | { readonly kind: "saved"; readonly templates: SavedTemplate[] }
  | { readonly kind: "invalid" | "full" };

/**
 * Saves a message under a name, newest first. A template with the same name is
 * replaced; a new name needs room under `maxTemplates`.
 */
export function saveTemplate(
  templates: readonly SavedTemplate[],
  entry: { name: string; markup: string; channel: string },
  savedAt: Date,
  id: string,
): SaveResult {
  const existing = templateNamed(templates, entry.name);
  const result = savedTemplateSchema.safeParse({
    id: existing?.id ?? id,
    name: entry.name.trim(),
    markup: entry.markup,
    channel: entry.channel,
    savedAt: savedAt.toISOString(),
  });
  if (!result.success) {
    return { kind: "invalid" };
  }
  const others = templates.filter((template) => template !== existing);
  if (existing === undefined && others.length >= maxTemplates) {
    return { kind: "full" };
  }
  return { kind: "saved", templates: [result.data, ...others] };
}

export type RenameResult =
  | { readonly kind: "renamed"; readonly templates: SavedTemplate[] }
  | { readonly kind: "invalid" | "taken" };

/** Renames a template in place. Another template may not already have the name. */
export function renameTemplate(
  templates: readonly SavedTemplate[],
  id: string,
  name: string,
): RenameResult {
  const trimmed = name.trim();
  if (trimmed === "" || trimmed.length > maxTemplateNameLength) {
    return { kind: "invalid" };
  }
  const clash = templateNamed(templates, trimmed);
  if (clash !== undefined && clash.id !== id) {
    return { kind: "taken" };
  }
  return {
    kind: "renamed",
    templates: templates.map((template) =>
      template.id === id ? { ...template, name: trimmed } : template,
    ),
  };
}

/** The list without a template, and where it was, so an undo can put it back. */
export function deleteTemplate(
  templates: readonly SavedTemplate[],
  id: string,
): {
  templates: SavedTemplate[];
  removed: SavedTemplate;
  index: number;
} | null {
  const index = templates.findIndex((template) => template.id === id);
  if (index === -1) {
    return null;
  }
  return {
    templates: templates.filter((template) => template.id !== id),
    removed: templates[index],
    index,
  };
}

/** Undoes a delete: the template goes back where it was, unless its name is taken by then. */
export function restoreTemplate(
  templates: readonly SavedTemplate[],
  removed: SavedTemplate,
  index: number,
): SavedTemplate[] | null {
  if (
    templateNamed(templates, removed.name) !== undefined ||
    templates.length >= maxTemplates
  ) {
    return null;
  }
  const restored = [...templates];
  restored.splice(Math.min(index, restored.length), 0, removed);
  return restored;
}
