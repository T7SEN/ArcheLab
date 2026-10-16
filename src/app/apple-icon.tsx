import { ImageResponse } from "next/og";
import { logoPath, logoStrokeWidth } from "@/components/logo-mark";
import { palette } from "@/styles/tokens";

// The iOS home-screen icon (ADR 0020): the favicon's mark on a full square, because iOS
// rounds the corners itself. Rendered once at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: palette.background,
      }}
    >
      <svg viewBox="0 0 128 128" width={180} height={180} fill="none">
        <path
          d={logoPath}
          stroke={palette.primary}
          strokeWidth={logoStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    size,
  );
}
