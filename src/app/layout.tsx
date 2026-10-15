import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { shellBackground } from "@/styles/tokens";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "ArcheLab", template: "%s | ArcheLab" },
  description: "Unofficial tools for The First Descendant.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: shellBackground,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    // The inline background paints before the stylesheet loads, so there is no white flash.
    <html
      lang="en"
      style={{ backgroundColor: shellBackground, colorScheme: "dark" }}
    >
      <body className="flex min-h-dvh flex-col bg-shell text-ink antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
