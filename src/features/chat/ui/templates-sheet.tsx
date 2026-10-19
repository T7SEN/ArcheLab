"use client";

import { LayoutTemplate, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { count, parse, type Piece } from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { ChatLine } from "./chat-line";
import { chatRegistry } from "./chat-registry";
import { iconName } from "./chat-icons";
import {
  browserStorage,
  deleteTemplate,
  loadTemplates,
  maxTemplateMarkupLength,
  maxTemplateNameLength,
  maxTemplates,
  renameTemplate,
  restoreTemplate,
  saveTemplate,
  storeTemplates,
  templateNamed,
  templatesStorageKey,
  type SavedTemplate,
} from "./personal-templates";

const { channels } = chatRegistry.data;

/** A random id; `crypto.randomUUID` needs a secure context, which every real visit has. */
function newId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** The message as a screen reader should hear it: text, and icons by name. */
function plainText(pieces: readonly Piece[]): string {
  return pieces
    .map((piece) =>
      piece.kind === "text"
        ? piece.text
        : iconName(
            chatRegistry.imagesById.get(piece.id.toLowerCase())?.label ??
              piece.id,
          ),
    )
    .join("");
}

interface TemplatesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portraits: PortraitUrls;
  /** The current message, as written, and its channel: what Save stores. */
  markup: string;
  channel: string;
  onPick: (template: SavedTemplate) => void;
  /** Where focus goes when the sheet closes: Base UI's `finalFocus`. */
  finalFocus: () => HTMLElement | boolean | null;
}

/**
 * The Templates button and the side sheet of personal templates (ADR 0017): messages
 * saved in this browser's localStorage, loaded, renamed and deleted here.
 */
export function TemplatesSheet({
  open,
  onOpenChange,
  portraits,
  markup,
  channel,
  onPick,
  finalFocus,
}: TemplatesSheetProps) {
  const ids = useId();
  // Read once, on the client; null when the browser blocks storage. The server render
  // never needs it: the sheet's content mounts only when it opens, after hydration.
  const [storage] = useState<Storage | null>(() =>
    typeof window === "undefined" ? null : browserStorage(),
  );
  const [templates, setTemplates] = useState<readonly SavedTemplate[]>(() =>
    storage === null ? [] : loadTemplates(storage),
  );
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{
    template: SavedTemplate;
    index: number;
  } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // Another tab saved, renamed or deleted a template.
  useEffect(() => {
    if (storage === null) {
      return;
    }
    const sync = (event: StorageEvent): void => {
      if (event.key === templatesStorageKey) {
        setTemplates(loadTemplates(storage));
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
    };
  }, [storage]);

  const write = (next: readonly SavedTemplate[]): boolean => {
    if (storage === null || !storeTemplates(storage, next)) {
      setStatus(
        "This browser refused to store the change, so nothing changed.",
      );
      return false;
    }
    setTemplates(next);
    return true;
  };

  const trimmed = name.trim();
  const existing = templateNamed(templates, trimmed);
  const blocker =
    markup === ""
      ? "Write a message first."
      : markup.length > maxTemplateMarkupLength
        ? "This message is too long to save."
        : existing === undefined && templates.length >= maxTemplates
          ? `You have ${String(maxTemplates)} templates, the most this browser keeps. Delete one to save another.`
          : null;

  const save = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (blocker !== null || trimmed === "") {
      return;
    }
    const result = saveTemplate(
      templates,
      { name: trimmed, markup, channel },
      new Date(),
      newId(),
    );
    if (result.kind !== "saved") {
      setStatus("This message can't be saved as a template.");
      return;
    }
    if (write(result.templates)) {
      setStatus(
        existing === undefined
          ? `Saved "${trimmed}".`
          : `Replaced "${existing.name}" with this message.`,
      );
      setName("");
      setLastDeleted(null);
    }
  };

  const rename = (template: SavedTemplate, newName: string): void => {
    const result = renameTemplate(templates, template.id, newName);
    if (result.kind !== "renamed") {
      setStatus(
        result.kind === "taken"
          ? `You already have a template named "${newName.trim()}".`
          : "A name needs at least one character.",
      );
      return;
    }
    if (write(result.templates)) {
      setStatus(`Renamed to "${newName.trim()}".`);
      setRenamingId(null);
    }
  };

  const remove = (template: SavedTemplate): void => {
    const result = deleteTemplate(templates, template.id);
    if (result !== null && write(result.templates)) {
      setLastDeleted({ template: result.removed, index: result.index });
      setStatus(null);
    }
  };

  const undoDelete = (): void => {
    if (lastDeleted === null) {
      return;
    }
    const restored = restoreTemplate(
      templates,
      lastDeleted.template,
      lastDeleted.index,
    );
    if (restored === null) {
      setStatus(
        `"${lastDeleted.template.name}" can't come back: its name is taken or the list is full.`,
      );
    } else if (write(restored)) {
      setStatus(`Restored "${lastDeleted.template.name}".`);
    }
    setLastDeleted(null);
  };

  const nameId = `${ids}-name`;
  const hintId = `${ids}-hint`;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Each opening starts without the last visit's notes.
        if (next) {
          setStatus(null);
          setLastDeleted(null);
          setRenamingId(null);
        }
        onOpenChange(next);
      }}
    >
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          />
        }
      >
        <LayoutTemplate aria-hidden="true" />
        Templates
      </SheetTrigger>
      <SheetContent
        finalFocus={finalFocus}
        className="w-full gap-0 sm:max-w-md"
      >
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="font-display text-lg font-semibold tracking-wide">
            Templates
          </SheetTitle>
          <SheetDescription>
            Save messages you send often. They stay in this browser only.
          </SheetDescription>
        </SheetHeader>
        {storage === null ? (
          <p className="p-4 text-sm text-muted-foreground">
            This browser blocks storage here, for example in a private window,
            so templates can&apos;t be saved. Everything else works.
          </p>
        ) : (
          <div className="grid min-h-0 content-start gap-4 overflow-y-auto p-4">
            <form onSubmit={save} className="grid gap-2">
              <label htmlFor={nameId} className="text-sm font-medium">
                Save this message as
              </label>
              <div className="flex gap-2">
                <Input
                  id={nameId}
                  value={name}
                  maxLength={maxTemplateNameLength}
                  placeholder="For example: Party invite"
                  aria-describedby={hintId}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                />
                <Button
                  type="submit"
                  disabled={blocker !== null || trimmed === ""}
                >
                  {existing === undefined ? "Save" : "Replace"}
                </Button>
              </div>
              <p id={hintId} className="text-xs text-muted-foreground">
                {blocker ??
                  (existing === undefined
                    ? "Saves the message and its channel."
                    : `Replaces your "${existing.name}" template.`)}
              </p>
            </form>
            <p aria-live="polite" className="text-sm empty:hidden">
              {status}
            </p>
            {lastDeleted !== null ? (
              <p className="flex items-center gap-2 text-sm">
                Deleted &quot;{lastDeleted.template.name}&quot;.
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={undoDelete}
                >
                  Undo
                </Button>
              </p>
            ) : null}
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved templates yet.
              </p>
            ) : (
              <ul aria-label="Saved templates" className="grid gap-2">
                {templates.map((template) =>
                  template.id === renamingId ? (
                    <RenameForm
                      key={template.id}
                      template={template}
                      onRename={(newName) => {
                        rename(template, newName);
                      }}
                      onCancel={() => {
                        setRenamingId(null);
                      }}
                    />
                  ) : (
                    <TemplateRow
                      key={template.id}
                      template={template}
                      portraits={portraits}
                      onLoad={() => {
                        onPick(template);
                      }}
                      onRename={() => {
                        setRenamingId(template.id);
                        setStatus(null);
                      }}
                      onDelete={() => {
                        remove(template);
                      }}
                    />
                  ),
                )}
              </ul>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface TemplateRowProps {
  template: SavedTemplate;
  portraits: PortraitUrls;
  onLoad: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function TemplateRow({
  template,
  portraits,
  onLoad,
  onRename,
  onDelete,
}: TemplateRowProps) {
  const channel = channels.find((entry) => entry.name === template.channel);
  const pieces = parse(template.markup, chatRegistry);
  const { used, limit } = count(template.markup, chatRegistry);
  return (
    <li className="flex items-start gap-1">
      <button
        type="button"
        aria-label={`Load ${template.name}${channel === undefined ? "" : `, ${channel.label} chat`}: ${plainText(pieces)}`}
        onClick={onLoad}
        className="grid min-w-0 flex-1 gap-2 rounded-xl border border-border bg-background/60 p-3 text-left transition-colors outline-none hover:border-ring/60 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span aria-hidden="true" className="flex items-center gap-2 text-sm">
          <span className="truncate font-medium text-foreground">
            {template.name}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            {channel === undefined ? null : (
              <>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: channel.hex }}
                />
                {channel.label}
              </>
            )}
            <span className="font-mono">
              {used} / {limit}
            </span>
          </span>
        </span>
        <ChatLine
          pieces={pieces}
          // The registry has at least one channel (its schema).
          channelHex={channel?.hex ?? channels[0].hex}
          portraits={portraits}
          className="text-[15px]"
        />
      </button>
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Rename ${template.name}`}
          onClick={onRename}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${template.name}`}
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

interface RenameFormProps {
  template: SavedTemplate;
  onRename: (name: string) => void;
  onCancel: () => void;
}

function RenameForm({ template, onRename, onCancel }: RenameFormProps) {
  const [value, setValue] = useState(template.name);
  return (
    <li>
      <form
        className="flex items-center gap-2 rounded-xl border border-ring/60 p-2"
        onSubmit={(event) => {
          event.preventDefault();
          onRename(value);
        }}
      >
        <Input
          aria-label={`New name for ${template.name}`}
          value={value}
          maxLength={maxTemplateNameLength}
          autoFocus
          onChange={(event) => {
            setValue(event.target.value);
          }}
        />
        <Button type="submit" size="sm">
          Rename
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </form>
    </li>
  );
}
