"use client";

import { useId, useMemo, useRef, useState } from "react";
import { HudPanel } from "@/components/hud-panel";
import {
  count,
  optimize,
  parse,
  render,
  sameStyle,
  truncateToLimit,
  type Piece,
  type Style,
} from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { ChatEditor, type ChatEditorHandle } from "./chat-editor";
import { ChatPreview } from "./chat-preview";
import { chatRegistry } from "./chat-registry";
import { cleanMarkup, refusedNotice } from "./clean-markup";
import { contrastRatio, minimumTextContrast } from "./contrast";
import { commonGlyphPrefix } from "./editor-model";
import { ImagePicker } from "./image-picker";
import { MarkupPanel } from "./markup-panel";
import { lookOf } from "./style-look";
import { StylePicker } from "./style-picker";

interface Message {
  /** The markup panel's text, as written. */
  readonly markup: string;
  readonly pieces: readonly Piece[];
}

const emptyMessage: Message = { markup: "", pieces: [] };
const { channels, chatBackground, verifiedOn, status } = chatRegistry.data;

const verifiedDate =
  verifiedOn === null
    ? null
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(verifiedOn));

function styleName(style: Style): string {
  return style.type === "tag" ? style.name : style.id;
}

/** Styles in the message that are hard to read on the chat background. */
function lowContrastStyles(pieces: readonly Piece[]): string[] {
  const seen: Style[] = [];
  const hints: string[] = [];
  for (const piece of pieces) {
    if (
      piece.kind !== "text" ||
      piece.style === null ||
      seen.some((style) => sameStyle(style, piece.style))
    ) {
      continue;
    }
    seen.push(piece.style);
    const { color } = lookOf(piece.style, chatRegistry);
    if (color === null) {
      continue;
    }
    const ratio = contrastRatio(color, chatBackground.hex);
    if (ratio < minimumTextContrast) {
      hints.push(
        `<${styleName(piece.style)}> is hard to read on the chat background (contrast ${ratio.toFixed(1)}:1).`,
      );
    }
  }
  return hints;
}

type CopyStatus = { kind: "idle" } | { kind: "done" | "failed"; text: string };

interface ChatBuilderProps {
  portraits: PortraitUrls;
}

/**
 * The chat-message builder (SPEC.md section 4.3). The engine's pieces are the single
 * source of truth: the editor and the markup panel each write them, and everything
 * else (counter, preview, hints, copy) reads them.
 */
export function ChatBuilder({ portraits }: ChatBuilderProps) {
  const ids = useId();
  const editorRef = useRef<ChatEditorHandle>(null);
  const refusedThisChange = useRef(false);
  const [message, setMessage] = useState<Message>(emptyMessage);
  const [channelName, setChannelName] = useState(channels[0]?.name ?? "");
  const [active, setActive] = useState<Style | null | "mixed">(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>({ kind: "idle" });

  const channelHex =
    channels.find((channel) => channel.name === channelName)?.hex ?? "#FFFFFF";
  // Both render identically to the pieces: the panel's text is either the optimizer's
  // output (editor changes) or what the pieces were parsed from (panel changes). The
  // optimizer escapes conservatively, so what was written can be shorter.
  const best = useMemo(() => {
    const optimized = optimize(message.pieces, chatRegistry);
    return message.markup.length < optimized.length
      ? message.markup
      : optimized;
  }, [message]);
  const counted = count(best, chatRegistry);
  const asWritten = count(message.markup, chatRegistry);
  const shown = useMemo(
    () => parse(truncateToLimit(best, chatRegistry), chatRegistry),
    [best],
  );
  const overflowGlyph =
    counted.overflowAt === null
      ? null
      : commonGlyphPrefix(
          render(message.pieces, chatRegistry),
          render(shown, chatRegistry),
        );
  const untested = [
    ...new Set(
      counted.issues
        .filter((issue) => issue.status === "unverified")
        .map((issue) => issue.char),
    ),
  ];
  const hints = [
    ...lowContrastStyles(message.pieces),
    ...(untested.length > 0
      ? [
          `Not tested in game yet: ${untested.join(" ")}. The game may not show ${untested.length === 1 ? "it" : "them"}.`,
        ]
      : []),
  ];

  const updateNotice = (): void => {
    if (!refusedThisChange.current) {
      setNotice(null);
    }
    refusedThisChange.current = false;
  };

  const onEditorChange = (pieces: Piece[]): void => {
    setMessage({ pieces, markup: optimize(pieces, chatRegistry) });
    setCopyStatus({ kind: "idle" });
    updateNotice();
  };

  const onMarkupChange = (text: string): void => {
    const { markup, refused } = cleanMarkup(text, chatRegistry);
    if (refused.length > 0) {
      setNotice(refusedNotice(refused));
      refusedThisChange.current = true;
    }
    setMessage({ markup, pieces: parse(markup, chatRegistry) });
    setCopyStatus({ kind: "idle" });
    updateNotice();
  };

  const copy = async (text: string, what: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ kind: "done", text: `${what} copied.` });
    } catch {
      setCopyStatus({
        kind: "failed",
        text: "Copying failed. Select the markup and copy it yourself.",
      });
    }
  };

  const over = counted.overflowAt !== null;
  const saved = asWritten.used - counted.used;
  const editorLabel = `${ids}-editor-label`;
  const counterId = `${ids}-counter`;
  const markupId = `${ids}-markup`;

  return (
    <div className="mt-8 grid gap-6">
      <HudPanel title="Message" titleId={`${ids}-message`}>
        <p id={editorLabel} className="sr-only">
          Message
        </p>
        <div
          className="border border-line"
          style={{ backgroundColor: chatBackground.hex, color: channelHex }}
        >
          <ChatEditor
            ref={editorRef}
            pieces={message.pieces}
            overflowGlyph={overflowGlyph}
            portraits={portraits}
            labelledBy={editorLabel}
            describedBy={counterId}
            onChange={onEditorChange}
            onRefused={(chars) => {
              refusedThisChange.current = true;
              setNotice(refusedNotice(chars));
            }}
            onActiveStyle={setActive}
          />
        </div>
        <p aria-live="polite" className="mt-2 min-h-5 text-sm text-warn">
          {notice}
        </p>
        <p className="text-sm text-ink-muted">
          Select text, then pick a style. A run of text holds one style, so a
          new pick replaces the old one.
        </p>
        <div className="mt-4 grid gap-5">
          <StylePicker
            active={active}
            onPick={(style) => editorRef.current?.applyStyle(style)}
          />
          <ImagePicker
            portraits={portraits}
            onPick={(id) => editorRef.current?.insertImage(id)}
          />
        </div>
      </HudPanel>

      <HudPanel title="Preview" titleId={`${ids}-preview`}>
        <fieldset>
          <legend className="text-sm text-ink-muted">Channel</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {channels.map((channel) => (
              <label
                key={channel.name}
                className="flex cursor-pointer items-center gap-2 border border-line px-3 py-1 text-sm has-checked:border-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
              >
                <input
                  type="radio"
                  name={`${ids}-channel`}
                  value={channel.name}
                  checked={channel.name === channelName}
                  onChange={() => {
                    setChannelName(channel.name);
                  }}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="size-3"
                  style={{ backgroundColor: channel.hex }}
                />
                {channel.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-3">
          <ChatPreview
            pieces={shown}
            channelHex={channelHex}
            portraits={portraits}
          />
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Untagged text takes the channel&apos;s color. The font and icon size
          are approximate.
        </p>
      </HudPanel>

      <HudPanel title="Markup" titleId={`${ids}-markup-title`}>
        <label htmlFor={markupId} className="sr-only">
          Markup
        </label>
        <MarkupPanel
          id={markupId}
          value={message.markup}
          overflowAt={asWritten.overflowAt}
          describedBy={counterId}
          onChange={onMarkupChange}
        />
        <p
          id={counterId}
          className={`mt-2 text-sm ${over ? "text-warn" : "text-ink-muted"}`}
        >
          {counted.used} of {counted.limit} characters.{" "}
          {over
            ? `${String(counted.used - counted.limit)} over the limit: the game cuts the highlighted part.`
            : `${String(counted.remaining)} left.`}
          {saved > 0
            ? ` Copying the optimized markup saves ${String(saved)} characters.`
            : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={best === ""}
            onClick={() => void copy(best, "Markup")}
            className="bg-accent px-4 py-2 font-semibold text-shell focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
          >
            Copy markup
          </button>
          {saved > 0 ? (
            <button
              type="button"
              onClick={() => void copy(message.markup, "Markup as written")}
              className="border border-line px-4 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Copy as written
            </button>
          ) : null}
          <p
            aria-live="polite"
            className={`text-sm ${copyStatus.kind === "failed" ? "text-warn" : "text-ink-muted"}`}
          >
            {copyStatus.kind === "idle" ? "" : copyStatus.text}
          </p>
        </div>
      </HudPanel>

      {hints.length > 0 ? (
        <HudPanel title="Hints" titleId={`${ids}-hints`}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </HudPanel>
      ) : null}

      <p className="text-sm text-ink-muted">
        {status === "verified" ? null : (
          <span className="mr-2 border border-warn px-1.5 py-0.5 text-xs text-warn">
            Provisional
          </span>
        )}
        {verifiedDate === null
          ? "Tags, colors and the chat limit are not verified in game yet."
          : `Tags, colors and the ${String(chatRegistry.charLimit)}-character limit were verified in game on ${verifiedDate}.`}
      </p>
    </div>
  );
}
