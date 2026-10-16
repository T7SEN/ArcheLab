import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { logoPath, logoStrokeWidth } from "@/components/logo-mark";
import { siteImage, siteUrl } from "@/lib/site-metadata";
import { palette } from "@/styles/tokens";

/** The size every link preview uses: Open Graph's recommended 1.91:1. */
export const ogSize = { width: siteImage.width, height: siteImage.height };

export const ogContentType = "image/png";

// Rajdhani, the display face, from the repository (SIL OFL 1.1, see OFL.txt beside it):
// next/font's copy is not readable here. Read once per build.
const rajdhani = readFile(
  join(process.cwd(), "src/assets/fonts/Rajdhani-SemiBold.ttf"),
);

/**
 * A link preview in ArcheLab's look (ADR 0020): the mark and name, the page's title and
 * a line about it, and the unofficial label with the address. Rendered once at build
 * time by each `opengraph-image.tsx`.
 */
export async function ogImage({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}): Promise<ImageResponse> {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: palette.background,
        // The violet glow of the site's heroes, in the primary token at 25%.
        backgroundImage: `radial-gradient(circle at 88% 12%, ${palette.primary}40, ${palette.background}00 60%)`,
        color: palette.foreground,
        fontFamily: "Rajdhani",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg viewBox="16 21 96 86" width={84} height={75} fill="none">
          <path
            d={logoPath}
            stroke={palette.primary}
            strokeWidth={logoStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ fontSize: 64, letterSpacing: 1 }}>ArcheLab</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 92, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontSize: 40, color: palette.mutedForeground }}>
          {subtitle}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 28,
          borderTop: `2px solid ${palette.border}`,
          fontSize: 30,
          color: palette.mutedForeground,
        }}
      >
        <div>Unofficial fan site</div>
        <div>{new URL(siteUrl).host}</div>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        {
          name: "Rajdhani",
          data: await rajdhani,
          weight: 600,
          style: "normal",
        },
      ],
    },
  );
}
