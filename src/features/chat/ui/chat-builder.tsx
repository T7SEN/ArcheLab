"use client";

import { BadgeCheck, Check, Copy, Gamepad2, TriangleAlert } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

const cardTitle = "font-display text-lg font-semibold tracking-wide";

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
  const previewLabel = `${ids}-preview`;

  return (
    // Two columns on wide screens: the message (editor right above its preview) and
    // the markup on the left, the style picker beside them. On narrow screens the
    // picker follows the message, so it stays next to the text it styles.
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[auto_auto_1fr] lg:items-start">
      <Card className="lg:col-start-1 lg:row-start-1">
        <CardHeader>
          <CardTitle className={cardTitle}>Message</CardTitle>
          <CardDescription>
            Type your message, select text, then pick a style.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p id={editorLabel} className="sr-only">
              Message
            </p>
            <div
              className="overflow-hidden rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
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
            <p
              aria-live="polite"
              className="mt-2 text-sm text-warning empty:mt-0"
            >
              {notice}
            </p>
          </div>
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <p
                id={previewLabel}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <Gamepad2 aria-hidden="true" className="size-3.5" />
                In game
              </p>
              <ToggleGroup
                aria-label="Channel"
                variant="outline"
                size="sm"
                spacing={0}
                value={[channelName]}
                onValueChange={(value) => {
                  const next = value.at(0);
                  // Clicking the pressed channel would clear the group; keep it.
                  if (next !== undefined) {
                    setChannelName(next);
                  }
                }}
              >
                {channels.map((channel) => (
                  <ToggleGroupItem
                    key={channel.name}
                    value={channel.name}
                    aria-label={`${channel.label} chat`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: channel.hex }}
                    />
                    {channel.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div
              role="group"
              aria-labelledby={previewLabel}
              className="overflow-hidden rounded-lg border"
            >
              <ChatPreview
                pieces={shown}
                channelHex={channelHex}
                portraits={portraits}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Untagged text takes the channel&apos;s color. The font and icon
              size are approximate.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
        <CardHeader>
          <CardTitle className={cardTitle}>Style</CardTitle>
          <CardDescription>
            A run of text holds one style, so a new pick replaces the old one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <StylePicker
            active={active}
            onPick={(style) => editorRef.current?.applyStyle(style)}
          />
          <Separator />
          <ImagePicker
            portraits={portraits}
            onPick={(id) => editorRef.current?.insertImage(id)}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-start-1 lg:row-start-2">
        <CardHeader>
          <CardTitle className={cardTitle}>Markup</CardTitle>
          <CardDescription>
            Edit it here, or copy it and paste it into the game.
          </CardDescription>
          <CardAction>
            <Badge
              variant={over ? "destructive" : "secondary"}
              className="font-mono"
            >
              {counted.used} / {counted.limit}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-2">
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
            className={`text-sm ${over ? "text-warning" : "text-muted-foreground"}`}
          >
            {counted.used} of {counted.limit} characters.{" "}
            {over
              ? `${String(counted.used - counted.limit)} over the limit: the game cuts the highlighted part.`
              : `${String(counted.remaining)} left.`}
            {saved > 0
              ? ` Copying the optimized markup saves ${String(saved)} characters.`
              : ""}
          </p>
        </CardContent>
        <CardFooter className="flex-wrap gap-3">
          <Button
            type="button"
            disabled={best === ""}
            onClick={() => void copy(best, "Markup")}
          >
            {copyStatus.kind === "done" ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            Copy markup
          </Button>
          {saved > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void copy(message.markup, "Markup as written")}
            >
              Copy as written
            </Button>
          ) : null}
          <p
            aria-live="polite"
            className={`text-sm ${copyStatus.kind === "failed" ? "text-warning" : "text-muted-foreground"}`}
          >
            {copyStatus.kind === "idle" ? "" : copyStatus.text}
          </p>
        </CardFooter>
      </Card>

      <div className="grid gap-3 lg:col-start-1 lg:row-start-3">
        {hints.map((hint) => (
          <Alert key={hint} role="status">
            <TriangleAlert aria-hidden="true" className="text-warning" />
            <AlertDescription>{hint}</AlertDescription>
          </Alert>
        ))}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {status === "verified" ? (
            <BadgeCheck aria-hidden="true" className="size-4 text-primary" />
          ) : (
            <Badge variant="destructive">Provisional</Badge>
          )}
          {verifiedDate === null
            ? "Tags, colors and the chat limit are not verified in game yet."
            : `Tags, colors and the ${String(chatRegistry.charLimit)}-character limit were verified in game on ${verifiedDate}.`}
        </p>
      </div>
    </div>
  );
}
