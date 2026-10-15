import { ArrowRight, Check, MessageSquareText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parse } from "@/features/chat/engine";
import { ChatLine } from "@/features/chat/ui/chat-line";
import { chatRegistry } from "@/features/chat/ui/chat-registry";
import { fetchPortraitUrls } from "@/lib/nexon/descendants";

/** Sample messages for the hero, written with verified tags only. */
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

const channelHex = (name: string): string =>
  chatRegistry.data.channels.find((channel) => channel.name === name)?.hex ??
  "#FFFFFF";

const builderFeatures = [
  "Every verified color, rarity color and text size",
  "Icons, with NEXON portraits for Descendants",
  "Counts the way the game does, against the chat limit",
];

export default async function HomePage() {
  // Fetched once while the page is prerendered (ADR 0008).
  const portraits = await fetchPortraitUrls(["Bunny"]);
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          <div>
            <Badge variant="secondary">
              <Sparkles aria-hidden="true" />
              Free and unofficial
            </Badge>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] font-bold tracking-wide sm:text-6xl">
              Tools for The First Descendant
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Fan-made tools for Descendants. Start with the chat message
              builder: color your messages, see them in game colors, and paste
              markup that fits the chat limit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tools/chat"
                className={buttonVariants({ size: "lg" })}
              >
                Open the chat builder
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
          <figure className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/10">
            <figcaption className="flex items-center gap-2 border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <MessageSquareText aria-hidden="true" className="size-3.5" />
              Made with the chat builder
            </figcaption>
            <div
              className="divide-white/5 divide-y"
              style={{ backgroundColor: chatRegistry.data.chatBackground.hex }}
            >
              {samples.map((sample) => (
                <ChatLine
                  key={sample.markup}
                  pieces={parse(sample.markup, chatRegistry)}
                  channelHex={channelHex(sample.channel)}
                  portraits={portraits}
                />
              ))}
            </div>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-semibold tracking-wide">
          Tools
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <Card className="h-full">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <MessageSquareText aria-hidden="true" className="size-5" />
                </div>
                <CardTitle className="font-display text-xl font-semibold tracking-wide">
                  Chat message builder
                </CardTitle>
                <CardDescription>
                  Color your chat messages and copy markup that pastes right
                  into the game.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  {builderFeatures.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link
                  href="/tools/chat"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Open the builder
                  <ArrowRight aria-hidden="true" />
                </Link>
              </CardFooter>
            </Card>
          </li>
          <li>
            <Card className="h-full border-dashed bg-transparent ring-0 outline-1 -outline-offset-1 outline-border outline-dashed">
              <CardHeader>
                <CardTitle className="font-display text-xl font-semibold tracking-wide text-muted-foreground">
                  More tools are on the way
                </CardTitle>
                <CardDescription>
                  New tools will build on NEXON&apos;s public game data.
                </CardDescription>
              </CardHeader>
            </Card>
          </li>
        </ul>
      </section>
    </>
  );
}
