import type { Metadata } from "next";
import {
  Barlow,
  Chakra_Petch,
  IBM_Plex_Sans,
  Inter,
  Oxanium,
  Rajdhani,
} from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import {
  type Direction,
  type DirectionId,
  directions,
  fontLicense,
} from "./directions";
import { chatBackground, sampledOn, tierColors } from "./sampled-chat-colors";
import "./design-lab.css";

// Temporary page (Phase 0). Deleted once T7SEN picks a direction.
export const metadata: Metadata = {
  title: "Design lab",
  robots: { index: false, follow: false },
};

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--dl-font-signal-display",
});
const inter = Inter({ subsets: ["latin"], variable: "--dl-font-signal-body" });
const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--dl-font-rift-display",
});
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--dl-font-rift-body",
});
const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--dl-font-forge-display",
});
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--dl-font-forge-body",
});

const fontVariables: Record<DirectionId, string> = {
  signal: `${rajdhani.variable} ${inter.variable}`,
  rift: `${chakraPetch.variable} ${ibmPlexSans.variable}`,
  forge: `${oxanium.variable} ${barlow.variable}`,
};

/** One Descendant portrait, loaded directly from NEXON's image host (SKILL.md 5.5). */
const portrait = {
  src: "https://open.api.nexon.com/static/tfd/img/eaffb014c98c36d8b30d90d7778bb840",
  name: "Bunny",
  size: 256,
};

function paletteStyle(direction: Direction): CSSProperties {
  const variables = Object.fromEntries(
    direction.palette.map((token) => [token.variable, token.hex]),
  );
  // React accepts custom properties in `style`; CSSProperties does not list them.
  return { ...variables, "--dl-chat-bg": chatBackground } as CSSProperties;
}

export default function DesignLabPage() {
  return (
    <div className="dl-page">
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Design lab</h1>
        <p className="mt-4 max-w-3xl text-ink-muted">
          Three directions for ArcheLab&apos;s look. This page is temporary and
          hidden from search engines. Once a direction is picked, its tokens
          move into the site and this page is deleted.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-ink-muted">
          The Descendant portrait loads directly from NEXON&apos;s image host.
          Tier colors were sampled from one in-game screenshot on {sampledOn}{" "}
          and stay provisional until the in-game tests are complete.
        </p>
      </section>

      {directions.map((direction) => (
        <DirectionSection key={direction.id} direction={direction} />
      ))}
    </div>
  );
}

function DirectionSection({ direction }: Readonly<{ direction: Direction }>) {
  return (
    <section
      aria-labelledby={`dl-${direction.id}-title`}
      className={`dl-direction dl-${direction.id} ${fontVariables[direction.id]}`}
      style={paletteStyle(direction)}
    >
      <div className="mx-auto max-w-5xl px-4 py-14">
        <p className="dl-kicker">Direction {direction.letter}</p>
        <h2 id={`dl-${direction.id}-title`} className="dl-display dl-title">
          {direction.name}
        </h2>
        <p className="dl-muted mt-2 max-w-2xl">{direction.mood}</p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="grid content-start gap-8">
            <Panel title="Palette">
              <ul className="grid grid-cols-3 gap-3">
                {direction.palette.map((token) => (
                  <li key={token.variable}>
                    <span
                      className="dl-swatch"
                      style={{ backgroundColor: token.hex }}
                    />
                    <span className="mt-1 block text-sm">{token.label}</span>
                    <span className="dl-muted block font-mono text-xs">
                      {token.hex}
                    </span>
                  </li>
                ))}
              </ul>
              <RarityChips />
            </Panel>

            <Panel title="Type">
              <p className="dl-display dl-type-display">
                Build a message in game colors
              </p>
              <p className="mt-3">
                Compose a colored chat message, check it against the limit, and
                copy markup that pastes cleanly.
              </p>
              <ul className="dl-muted mt-4 grid gap-1 text-sm">
                {direction.fonts.map((font) => (
                  <li key={font.family}>
                    {font.role}:{" "}
                    <a className="dl-link" href={font.specimen}>
                      {font.family}
                    </a>
                  </li>
                ))}
                <li>License: {fontLicense}.</li>
              </ul>
            </Panel>
          </div>

          <div className="grid content-start gap-8">
            <Panel title="Frame and Arche effect">
              <div className="dl-portrait-wrap" data-arche-effect>
                <div className="dl-portrait">
                  {/* eslint-disable-next-line @next/next/no-img-element -- NEXON art loads directly from NEXON's host, never through image optimization (SKILL.md landmine 2). */}
                  <img
                    src={portrait.src}
                    alt={`${portrait.name}, a Descendant (image from the NEXON Open API)`}
                    width={portrait.size}
                    height={portrait.size}
                    loading="lazy"
                    decoding="async"
                  />
                  {direction.id === "forge" ? (
                    <svg
                      className="dl-trace"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="0.5"
                        y="0.5"
                        width="99"
                        height="99"
                        pathLength="100"
                      />
                    </svg>
                  ) : null}
                </div>
              </div>
              <ul className="dl-muted mt-4 grid gap-1 text-sm">
                <li>Frame: {direction.frame}</li>
                <li>
                  Effect: {direction.effect} It stops under reduced motion.
                </li>
              </ul>
            </Panel>

            <Panel title="Chat preview">
              <ChatPreview />
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="dl-frame">
      <h3 className="dl-display dl-panel-title">{title}</h3>
      <div className="dl-panel-body">{children}</div>
    </div>
  );
}

function RarityChips() {
  return (
    <div className="mt-5">
      <p className="dl-muted text-sm">Rarity accents (provisional)</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {tierColors.map((tier) => (
          <li
            key={tier.tag}
            className="dl-chip"
            style={{ borderColor: tier.hex, color: tier.hex }}
          >
            {tier.rarity}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatPreview() {
  return (
    <figure>
      <div className="dl-chat">
        <p>
          <span className="dl-chat-channel">[World]</span>{" "}
          <span className="dl-chat-name">Player:</span>{" "}
          {tierColors.map((tier, index) => (
            <span key={tier.tag} style={{ color: tier.hex }}>
              {tier.rarity}
              {index < tierColors.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
        <p className="mt-1">
          <span className="dl-chat-channel">[World]</span>{" "}
          <span className="dl-chat-name">Player:</span> LF Void Intercept, need
          two
        </p>
      </div>
      <figcaption className="dl-muted mt-2 text-xs">
        Tier colors and the chat background (#212321) were sampled from an
        in-game screenshot on {sampledOn}. Provisional. Untagged text is shown
        in a neutral gray because its in-game color depends on the channel and
        is not verified yet.
      </figcaption>
    </figure>
  );
}
