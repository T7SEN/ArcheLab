"use client";

import { cn } from "cn";
import {
  Check,
  ChevronDown,
  Code,
  Copy,
  Eraser,
  Link2,
  MessageSquareText,
  TriangleAlert,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Counter } from "@/components/react-bits/counter";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { StarBorder } from "@/components/react-bits/star-border";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
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
import { chatRegistry } from "./chat-registry";
import { cleanMarkup, refusedNotice } from "./clean-markup";
import { contrastRatio, minimumTextContrast } from "./contrast";
import { commonGlyphPrefix } from "./editor-model";
import { isUntested } from "./icon-options";
import { MarkupPanel } from "./markup-panel";
import { readShareHash, shareHash } from "./share-link";
import { lookOf } from "./style-look";
import { usePaletteSource } from "@/features/command-palette/palette-provider";
import {
  chatActionCommands,
  iconCommands,
  styleCommands,
} from "./palette-commands";
import { styleGroups } from "./style-options";
import { StylePicker } from "./style-picker";
import type { SavedTemplate } from "./personal-templates";
import { TemplatesSheet } from "./templates-sheet";

interface Message {
  /** The markup panel's text, as written. */
  readonly markup: string;
  readonly pieces: readonly Piece[];
}

const emptyMessage: Message = { markup: "", pieces: [] };
/** The palette's styles: the picker's groups, built once. */
const paletteStyleGroups = styleGroups(chatRegistry);
const { channels, chatBackground } = chatRegistry.data;
const channelNames = channels.map((channel) => channel.name);

function styleName(style: Style): string {
  return style.type === "tag" ? style.name : style.id;
}

const listFormat = new Intl.ListFormat("en", { type: "conjunction" });

/** The labels of icons in the message whose ids are not tested in game yet. */
function untestedIcons(pieces: readonly Piece[]): string[] {
  const labels = new Set<string>();
  for (const piece of pieces) {
    if (piece.kind !== "image") {
      continue;
    }
    const image = chatRegistry.imagesById.get(piece.id.toLowerCase());
    if (image !== undefined && isUntested(image)) {
      labels.add(image.label);
    }
  }
  return [...labels];
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

/** The message window's glass and violet edge, matching the home page's sample window. */
const windowSurface = {
  "--spotlight-card-surface":
    "color-mix(in srgb, var(--card) 80%, transparent)",
  "--spotlight-card-border":
    "linear-gradient(to bottom right, color-mix(in srgb, var(--primary) 50%, transparent), var(--border), transparent)",
} as CSSProperties;

type CopyTarget = "markup" | "written" | "link";

type CopyStatus =
  | { kind: "idle" }
  | { kind: "done" | "failed"; target: CopyTarget; text: string };

/** A line under the message: removed characters and broken links warn; the rest informs. */
interface Notice {
  readonly text: string;
  readonly tone: "info" | "warning";
}

interface ChatBuilderProps {
  portraits: PortraitUrls;
}

/**
 * The chat-message builder (SPEC.md section 4.3). The engine's pieces are the single
 * source of truth: the editor and the markup panel each write them, and everything
 * else (counter, highlight, hints, copy) reads them. The editor itself is drawn as the
 * in-game chat line, so it doubles as the preview.
 */
export function ChatBuilder({ portraits }: ChatBuilderProps) {
  const ids = useId();
  const editorRef = useRef<ChatEditorHandle>(null);
  const refusedThisChange = useRef(false);
  const [message, setMessage] = useState<Message>(emptyMessage);
  const [channelName, setChannelName] = useState(channels[0]?.name ?? "");
  // The editor sits on the site's surface; this shows the in-game chat panel instead.
  const [gameBackground, setGameBackground] = useState(false);
  const [active, setActive] = useState<Style | null | "mixed">(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>({ kind: "idle" });
  const [templatesOpen, setTemplatesOpen] = useState(false);
  // Set by a pick, so the closing sheet returns focus to the editor, not its button.
  const pickedTemplate = useRef(false);

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
  // What the game shows after its input box cuts the copied markup.
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
  const icons = untestedIcons(message.pieces);
  const hints = [
    ...lowContrastStyles(message.pieces),
    ...(icons.length > 0
      ? [
          `Not tested in game yet: the ${listFormat.format(icons)} ${icons.length === 1 ? "icon" : "icons"}. The game may show ${icons.length === 1 ? "it" : "them"} as text.`,
        ]
      : []),
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
      setNotice({ text: refusedNotice(refused), tone: "warning" });
      refusedThisChange.current = true;
    }
    setMessage({ markup, pieces: parse(markup, chatRegistry) });
    setCopyStatus({ kind: "idle" });
    updateNotice();
  };

  // The editor's edit empties the message and stays undoable (Ctrl+Z); resetting the
  // message too covers markup that renders as nothing, such as "<red></>".
  const pickTemplate = (template: SavedTemplate): void => {
    const hadMessage = message.markup !== "";
    // Stored text is untrusted: it is cleaned like pasted markup (ADR 0017).
    const { markup } = cleanMarkup(template.markup, chatRegistry);
    editorRef.current?.replace(parse(markup, chatRegistry));
    if (channelNames.includes(template.channel)) {
      setChannelName(template.channel);
    }
    setCopyStatus({ kind: "idle" });
    // After the editor's change, which clears notices, so this one stays.
    setNotice({
      text: hadMessage
        ? `Loaded "${template.name}". Ctrl+Z brings back your message.`
        : `Loaded "${template.name}".`,
      tone: "info",
    });
    pickedTemplate.current = true;
    setTemplatesOpen(false);
  };

  const clear = (): void => {
    editorRef.current?.clear();
    setMessage(emptyMessage);
    setCopyStatus({ kind: "idle" });
    setNotice(null);
  };

  const copy = async (text: string, target: CopyTarget): Promise<void> => {
    const what = {
      markup: "Markup",
      written: "Markup as written",
      link: "Link",
    }[target];
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ kind: "done", target, text: `${what} copied.` });
    } catch {
      setCopyStatus({
        kind: "failed",
        target,
        text:
          target === "link"
            ? `Copying failed. Select and copy this link yourself: ${text}`
            : "Copying failed. Open the markup, select it and copy it yourself.",
      });
    }
  };

  // Opens a shared message from the URL hash (ADR 0015): on load, and when a link is
  // pasted into the address bar of an open builder.
  useEffect(() => {
    const open = (): void => {
      const shared = readShareHash(window.location.hash, channelNames);
      if (shared.kind === "none") {
        return;
      }
      // The link has done its job: a reload must not bring the shared version back
      // over later edits.
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      setCopyStatus({ kind: "idle" });
      if (shared.kind === "broken") {
        setNotice({
          text: "This share link is broken or incomplete, so it opened nothing.",
          tone: "warning",
        });
        return;
      }
      const { markup, refused } = cleanMarkup(shared.markup, chatRegistry);
      setMessage({ markup, pieces: parse(markup, chatRegistry) });
      if (shared.channel !== null) {
        setChannelName(shared.channel);
      }
      setNotice(
        refused.length > 0
          ? {
              text: `Opened a shared message. ${refusedNotice(refused)}`,
              tone: "warning",
            }
          : { text: "Opened a shared message.", tone: "info" },
      );
    };
    open();
    window.addEventListener("hashchange", open);
    return () => {
      window.removeEventListener("hashchange", open);
    };
  }, []);

  const over = counted.overflowAt !== null;
  // Null when the message is empty or its code would be too long to open again.
  const linkHash =
    message.markup === "" ? null : shareHash(message.markup, channelName);
  // How full the message is, for the bar under the editor.
  const usage = Math.min(100, (counted.used / counted.limit) * 100);
  const saved = asWritten.used - counted.used;
  // The builder's own commands in the palette while it is open (ADR 0022): its
  // buttons and switches first, its styles and icons after the site's pages and
  // tools but before its Descendants (order 30), so "bunny" then Enter inserts the
  // icon rather than leaving for Bunny's page (ADR 0023).
  usePaletteSource("chat-actions", 0, () =>
    chatActionCommands(
      {
        canCopy: best !== "",
        canCopyWritten: saved > 0,
        canShare: linkHash !== null,
        canClear: !(message.markup === "" && message.pieces.length === 0),
        channel: channelName,
        channels,
        gameBackground,
      },
      {
        copyMarkup: () => void copy(best, "markup"),
        copyWritten: () => void copy(message.markup, "written"),
        copyLink: () => {
          if (linkHash !== null) {
            void copy(
              `${window.location.origin}${window.location.pathname}${linkHash}`,
              "link",
            );
          }
        },
        clear,
        openTemplates: () => {
          setTemplatesOpen(true);
        },
        setChannel: setChannelName,
        toggleGameBackground: () => {
          setGameBackground((current) => !current);
        },
      },
    ),
  );
  usePaletteSource("chat-inserts", 25, () => [
    ...styleCommands(paletteStyleGroups, (style) =>
      editorRef.current?.applyStyle(style),
    ),
    ...iconCommands(chatRegistry.data.images, (id) =>
      editorRef.current?.insertImage(id),
    ),
  ]);
  const editorLabel = `${ids}-editor-label`;
  const counterId = `${ids}-counter`;
  const markupId = `${ids}-markup`;
  const channelLabel = `${ids}-channel`;

  return (
    // Wide screens: the message on the left stays in view while the style panel beside
    // it scrolls. Narrow screens: the style panel follows the message.
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="grid min-w-0 gap-4 lg:sticky lg:top-20">
        {/* A floating chat window, like the home page's sample of the builder. */}
        <SpotlightCard
          className="rounded-2xl text-sm shadow-2xl shadow-primary/15 backdrop-blur-md"
          style={windowSurface}
        >
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <h2 className={cn(cardTitle, "flex items-center gap-2")}>
              <MessageSquareText
                aria-hidden="true"
                className="size-4 text-primary"
              />
              Message
            </h2>
            <div className="flex items-center gap-3">
              <TemplatesSheet
                open={templatesOpen}
                onOpenChange={setTemplatesOpen}
                portraits={portraits}
                markup={message.markup}
                channel={channelName}
                onPick={pickTemplate}
                finalFocus={() => {
                  if (!pickedTemplate.current) {
                    return true;
                  }
                  pickedTemplate.current = false;
                  return editorRef.current?.element() ?? true;
                }}
              />
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="size-2 rounded-full bg-border" />
                <span className="size-2 rounded-full bg-border" />
                <span className="size-2 rounded-full bg-primary/70" />
              </span>
            </div>
          </div>
          {/* minmax(0, 1fr): a long unbroken message must wrap, not widen the window. */}
          <div className="grid grid-cols-1 gap-3 p-4">
            <p className="text-muted-foreground">
              Colors and sizes look the way they do in game. Select text, then
              pick a style.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                id={channelLabel}
                className="text-xs font-medium text-muted-foreground"
              >
                Channel
              </span>
              <ToggleGroup
                aria-labelledby={channelLabel}
                variant="outline"
                size="sm"
                spacing={1}
                // Five channels: on narrow screens the chips wrap instead of clipping.
                className="flex-wrap"
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
                    className="rounded-full px-3 aria-pressed:border-primary/60 aria-pressed:bg-primary/15 aria-pressed:text-foreground"
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
              {/* Base UI's documented pattern: the label wraps the switch. */}
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                <Switch
                  size="sm"
                  checked={gameBackground}
                  onCheckedChange={setGameBackground}
                />
                Game background
              </label>
            </div>
            <div>
              <p id={editorLabel} className="sr-only">
                Message
              </p>
              <div
                data-game-background={gameBackground || undefined}
                className={cn(
                  "flex items-baseline gap-2 rounded-xl border px-4 text-lg transition-[background-color,border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                  gameBackground
                    ? "border-input"
                    : "border-border bg-background/60 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--foreground)_6%,transparent),inset_0_12px_24px_-16px_color-mix(in_srgb,var(--background)_95%,transparent)]",
                )}
                style={{
                  // Contrast hints always measure against the game's panel, shown or not.
                  backgroundColor: gameBackground
                    ? chatBackground.hex
                    : undefined,
                  color: channelHex,
                }}
              >
                {/* A stand-in sender: the game's own sender format is not verified. */}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground select-none"
                >
                  You:
                </span>
                <div className="min-w-0 flex-1">
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
                      setNotice({
                        text: refusedNotice(chars),
                        tone: "warning",
                      });
                    }}
                    onActiveStyle={setActive}
                  />
                </div>
              </div>
              <p
                aria-live="polite"
                className={cn(
                  "mt-2 text-sm empty:mt-0",
                  notice?.tone === "info"
                    ? "text-muted-foreground"
                    : "text-warning",
                )}
              >
                {notice?.text}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Untagged text takes the channel&apos;s color. The font is
                approximate.
              </p>
            </div>
            <Collapsible>
              <CollapsibleTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="group/markup -ml-2 w-fit text-muted-foreground"
                  />
                }
              >
                <Code aria-hidden="true" />
                Markup
                <ChevronDown
                  aria-hidden="true"
                  className="transition-transform group-aria-expanded/markup:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 grid gap-2">
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
                <p className="text-xs text-muted-foreground">
                  Edit the markup directly if you like; the message follows.
                  {saved > 0
                    ? ` Copying the optimized markup saves ${String(saved)} characters.`
                    : ""}
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
          {/* Fills as the message nears the limit; the counter says the same in words. */}
          <div aria-hidden="true" className="h-0.5 bg-border/60">
            <div
              className={cn(
                "h-full transition-[width,background-color] duration-300",
                over ? "bg-warning" : "bg-primary",
              )}
              style={{ width: `${String(usage)}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-background/40 px-4 py-3">
            <StarBorder
              type="button"
              disabled={best === ""}
              onClick={() => void copy(best, "markup")}
              radius={10}
              thickness={1.5}
              glow={0.6}
              backgroundColor="color-mix(in srgb, var(--primary) 22%, var(--card))"
              className="px-4 py-2.5 text-sm font-semibold"
            >
              {copyStatus.kind === "done" && copyStatus.target === "markup" ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <Copy aria-hidden="true" className="size-4" />
              )}
              {copyStatus.kind === "done" && copyStatus.target === "markup"
                ? "Copied"
                : "Copy markup"}
            </StarBorder>
            {saved > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => void copy(message.markup, "written")}
              >
                Copy as written
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={linkHash === null}
              onClick={() => {
                if (linkHash !== null) {
                  void copy(
                    `${window.location.origin}${window.location.pathname}${linkHash}`,
                    "link",
                  );
                }
              }}
            >
              {copyStatus.kind === "done" && copyStatus.target === "link" ? (
                <Check aria-hidden="true" />
              ) : (
                <Link2 aria-hidden="true" />
              )}
              {copyStatus.kind === "done" && copyStatus.target === "link"
                ? "Link copied"
                : "Copy link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={message.markup === "" && message.pieces.length === 0}
              onClick={clear}
              className="text-muted-foreground"
            >
              <Eraser aria-hidden="true" />
              Clear
            </Button>
            <div id={counterId} className="flex items-center gap-2 text-sm">
              <Badge
                variant={over ? "destructive" : "secondary"}
                className="font-mono"
              >
                {/* Screen readers get the plain number; the rolling digits are hidden. */}
                <Counter
                  value={counted.used}
                  fontSize="inherit"
                  intro={false}
                />
                {` / ${String(counted.limit)}`}
              </Badge>
              <span className={over ? "text-warning" : "text-muted-foreground"}>
                {over
                  ? `${String(counted.used - counted.limit)} over the limit: the game cuts the highlighted part.`
                  : `${String(counted.remaining)} characters left.`}
              </span>
            </div>
            <p
              aria-live="polite"
              className={
                copyStatus.kind === "failed"
                  ? "basis-full text-sm text-warning"
                  : "sr-only"
              }
            >
              {copyStatus.kind === "idle" ? "" : copyStatus.text}
            </p>
          </div>
        </SpotlightCard>

        {hints.map((hint) => (
          <Alert key={hint} role="status">
            <TriangleAlert aria-hidden="true" className="text-warning" />
            <AlertDescription>{hint}</AlertDescription>
          </Alert>
        ))}
      </div>

      <SpotlightCard className="grid gap-4 py-4 text-sm">
        <div className="grid gap-1 px-4">
          <h2 className={cardTitle}>Style</h2>
          <p className="text-muted-foreground">
            One style per run of text: a new pick replaces the old one.
          </p>
        </div>
        <div className="px-4">
          <StylePicker
            active={active}
            portraits={portraits}
            onPickStyle={(style) => editorRef.current?.applyStyle(style)}
            onPickImage={(id) => editorRef.current?.insertImage(id)}
          />
        </div>
      </SpotlightCard>
    </div>
  );
}
