import { MessageSquareText } from "lucide-react";
import { count, parse } from "@/features/chat/engine";
import type { PortraitUrls } from "@/lib/nexon/descendants";
import { ChatLine } from "./chat-line";
import { chatRegistry } from "./chat-registry";

/** Sample messages for the home page, written with verified tags only. */
const samples = [
  {
    channel: "normal",
    markup:
      '<tier4>Transcendent</> mods for trade <img id="IconBunny1"/> <friendly>whisper me</>',
  },
  {
    channel: "world",
    markup: "LF2M <Highlight>Void Intercept</>, mic optional",
  },
  { channel: "trade", markup: "<b>GG</> <yellow>everyone</> ★" },
] as const;

const featured = samples[0];
const featuredCount = count(featured.markup, chatRegistry);

/** The markup with its tags dimmed, so the message text stands out. */
function MarkupText({ markup }: { markup: string }) {
  return markup.split(/(<[^>]*>)/).map((part, index) =>
    part.startsWith("<") ? (
      <span key={index} className="text-muted-foreground/70">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

interface ChatShowcaseProps {
  portraits: PortraitUrls;
}

/**
 * The home page's sample of the builder's output: a floating chat window with one line
 * per channel, untagged text in each channel's color, and the markup behind the first
 * line with its real character count.
 */
export function ChatShowcase({ portraits }: ChatShowcaseProps) {
  return (
    <figure className="relative lg:[transform:perspective(1400px)_rotateY(-7deg)_rotateX(3deg)]">
      <div
        aria-hidden="true"
        className="absolute -inset-px rounded-2xl bg-linear-to-br from-primary/50 via-border to-transparent"
      />
      <div className="relative overflow-hidden rounded-2xl bg-card/80 shadow-2xl shadow-primary/20 backdrop-blur-md">
        <figcaption className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <MessageSquareText
              aria-hidden="true"
              className="size-3.5 text-primary"
            />
            Made with the chat builder
          </span>
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-primary/70" />
          </span>
        </figcaption>
        <ul className="grid gap-1 p-3">
          {samples.map((sample) => {
            const channel = chatRegistry.data.channels.find(
              (entry) => entry.name === sample.channel,
            );
            return (
              <li
                key={sample.markup}
                className="flex items-baseline gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
              >
                <span className="inline-flex w-17 shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: channel?.hex }}
                  />
                  {channel?.label}
                </span>
                <ChatLine
                  className="min-w-0 text-[15px]"
                  pieces={parse(sample.markup, chatRegistry)}
                  channelHex={channel?.hex ?? "#FFFFFF"}
                  portraits={portraits}
                />
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-3 border-t bg-background/40 px-4 py-3">
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
            <MarkupText markup={featured.markup} />
          </code>
          <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {featuredCount.used} / {featuredCount.limit}
          </span>
        </div>
      </div>
    </figure>
  );
}
