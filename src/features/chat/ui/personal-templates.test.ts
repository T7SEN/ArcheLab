import { describe, expect, it } from "vitest";
import {
  deleteTemplate,
  loadTemplates,
  maxTemplateMarkupLength,
  maxTemplateNameLength,
  maxTemplates,
  renameTemplate,
  restoreTemplate,
  saveTemplate,
  storeTemplates,
  templatesStorageKey,
  type SavedTemplate,
} from "./personal-templates";

const now = new Date("2026-10-16T12:00:00.000Z");

/** A Storage stand-in backed by a Map. */
function memoryStorage(initial?: string) {
  const items = new Map<string, string>();
  if (initial !== undefined) {
    items.set(templatesStorageKey, initial);
  }
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
  };
}

const throwing = {
  getItem: (): string | null => {
    throw new DOMException("blocked", "SecurityError");
  },
  setItem: (): void => {
    throw new DOMException("full", "QuotaExceededError");
  },
};

function saved(name: string, index = 0): SavedTemplate {
  return {
    id: `id-${name}`,
    name,
    markup: `<red>${name}</>`,
    channel: "party",
    savedAt: new Date(now.getTime() - index * 1000).toISOString(),
  };
}

describe("personal templates", () => {
  it("round-trip through storage", () => {
    const storage = memoryStorage();
    const templates = [saved("Ready"), saved("BRB", 1)];
    expect(storeTemplates(storage, templates)).toBe(true);
    expect(loadTemplates(storage)).toEqual(templates);
  });

  it("read as none when storage is empty, unreadable or blocked", () => {
    expect(loadTemplates(memoryStorage())).toEqual([]);
    expect(loadTemplates(memoryStorage("not json"))).toEqual([]);
    expect(loadTemplates(memoryStorage('{"name":"x"}'))).toEqual([]);
    expect(loadTemplates(throwing)).toEqual([]);
  });

  it("drop invalid entries one by one", () => {
    const good = saved("Ready");
    const stored = JSON.stringify([
      good,
      { ...good, id: "2", markup: "" },
      { ...good, id: "3", channel: "<script>" },
      { ...good, id: "4", name: "x".repeat(maxTemplateNameLength + 1) },
      { ...good, id: "5", extra: true },
      "text",
      null,
    ]);
    expect(loadTemplates(memoryStorage(stored))).toEqual([good]);
  });

  it("report a refused write", () => {
    expect(storeTemplates(throwing, [saved("Ready")])).toBe(false);
  });

  it("save newest first, replacing a template with the same name", () => {
    const first = saveTemplate(
      [saved("BRB")],
      { name: "  Ready ", markup: "<blue>Ready?</>", channel: "party" },
      now,
      "new",
    );
    expect(first.kind).toBe("saved");
    const list = first.kind === "saved" ? first.templates : [];
    expect(list.map((template) => template.name)).toEqual(["Ready", "BRB"]);
    expect(list[0]).toEqual({
      id: "new",
      name: "Ready",
      markup: "<blue>Ready?</>",
      channel: "party",
      savedAt: now.toISOString(),
    });

    const again = saveTemplate(
      list,
      { name: "ready", markup: "<red>Go</>", channel: "world" },
      now,
      "other",
    );
    expect(again.kind === "saved" ? again.templates : []).toEqual([
      { ...list[0], name: "ready", markup: "<red>Go</>", channel: "world" },
      list[1],
    ]);
  });

  it("refuse an empty name or message, a long one, or a new name past the cap", () => {
    const entry = { name: "Ready", markup: "Hi", channel: "party" };
    expect(saveTemplate([], { ...entry, name: "  " }, now, "x").kind).toBe(
      "invalid",
    );
    expect(saveTemplate([], { ...entry, markup: "" }, now, "x").kind).toBe(
      "invalid",
    );
    expect(
      saveTemplate(
        [],
        { ...entry, markup: "x".repeat(maxTemplateMarkupLength + 1) },
        now,
        "x",
      ).kind,
    ).toBe("invalid");

    const full = Array.from({ length: maxTemplates }, (_, index) =>
      saved(`T${String(index)}`, index),
    );
    expect(saveTemplate(full, entry, now, "x").kind).toBe("full");
    // Replacing an existing name still works when the list is full.
    expect(saveTemplate(full, { ...entry, name: "t3" }, now, "x").kind).toBe(
      "saved",
    );
  });

  it("rename unless another template has the name", () => {
    const list = [saved("Ready"), saved("BRB", 1)];
    const renamed = renameTemplate(list, "id-BRB", " Back soon ");
    expect(
      renamed.kind === "renamed" ? renamed.templates.map((t) => t.name) : [],
    ).toEqual(["Ready", "Back soon"]);
    expect(renameTemplate(list, "id-BRB", "ready").kind).toBe("taken");
    expect(renameTemplate(list, "id-Ready", "READY").kind).toBe("renamed");
    expect(renameTemplate(list, "id-BRB", " ").kind).toBe("invalid");
  });

  it("delete, and undo the delete in place", () => {
    const list = [saved("A"), saved("B", 1), saved("C", 2)];
    const deleted = deleteTemplate(list, "id-B");
    expect(deleted?.templates.map((t) => t.name)).toEqual(["A", "C"]);
    expect(deleted?.index).toBe(1);
    expect(deleteTemplate(list, "missing")).toBeNull();

    const restored =
      deleted === null
        ? null
        : restoreTemplate(deleted.templates, deleted.removed, deleted.index);
    expect(restored).toEqual(list);
    // Not when the name was saved again meanwhile.
    expect(
      deleted === null
        ? undefined
        : restoreTemplate(
            [saved("B"), ...deleted.templates],
            deleted.removed,
            1,
          ),
    ).toBeNull();
  });
});
