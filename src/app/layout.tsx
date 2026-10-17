import type { Metadata, Viewport } from "next";
import { Inter, Rajdhani } from "next/font/google";
import type { ReactNode } from "react";
import { PageEnter } from "@/components/page-enter";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PaletteProvider } from "@/features/command-palette/palette-provider";
import { paletteDescendants } from "@/features/command-palette/palette-descendants";
import { paletteComponents } from "@/features/command-palette/palette-components";
import { paletteFellows } from "@/features/command-palette/palette-fellows";
import { paletteMutantCells } from "@/features/command-palette/palette-mutant-cells";
import { paletteVehicles } from "@/features/command-palette/palette-vehicles";
import { paletteReactors } from "@/features/command-palette/palette-reactors";
import { paletteWeapons } from "@/features/command-palette/palette-weapons";
import { fetchDescendantSummaries } from "@/lib/nexon/descendant-page";
import { fetchComponentGroups } from "@/lib/nexon/component-index";
import { fetchFellows } from "@/lib/nexon/fellow-index";
import { fetchVehicles } from "@/lib/nexon/vehicle-index";
import { fetchMutantCells } from "@/lib/nexon/mutant-cell-index";
import { fetchReactorGroups } from "@/lib/nexon/reactor-index";
import { fetchWeaponSummaries } from "@/lib/nexon/weapon-page";
import { siteDescription, siteName, siteUrl } from "@/lib/site-metadata";
import { shellBackground } from "@/styles/tokens";
import "@/styles/globals.css";

// Self-hosted at build time; the browser never requests Google Fonts (SIL OFL 1.1).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
});

// Each page adds its canonical address and link preview with `pageMetadata`.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: shellBackground,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // NEXON's Descendants, weapons, reactors, external components, Fellows, vehicles and
  // Mutant Cells for the palette, fetched once while the pages are prerendered (ADR
  // 0023, ADR 0024, ADR 0026, ADR 0027, ADR 0035, ADR 0037, ADR 0040). Empty when NEXON
  // can't be reached.
  const [
    descendantList,
    weaponList,
    reactorList,
    componentList,
    fellowList,
    vehicleList,
    mutantCellList,
  ] = await Promise.all([
    fetchDescendantSummaries(),
    fetchWeaponSummaries(),
    fetchReactorGroups(),
    fetchComponentGroups(),
    fetchFellows(),
    fetchVehicles(),
    fetchMutantCells(),
  ]);
  const descendants = paletteDescendants(descendantList);
  const weapons = paletteWeapons(weaponList);
  const reactors = paletteReactors(reactorList);
  const components = paletteComponents(componentList);
  const fellows = paletteFellows(fellowList);
  const vehicles = paletteVehicles(vehicleList);
  const mutantCells = paletteMutantCells(mutantCellList);
  return (
    // The inline background paints before the stylesheet loads, so there is no white flash.
    // The site is dark only; `dark` turns on shadcn's dark variants (ADR 0009).
    // data-scroll-behavior: Next.js 16 turns off the CSS smooth scrolling while it
    // changes pages, so only in-page jumps glide (ADR 0023).
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`dark ${inter.variable} ${rajdhani.variable}`}
      style={{ backgroundColor: shellBackground, colorScheme: "dark" }}
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        {/* Tooltips wait 700ms of hovering (shadcn's default is 0). Once one is open,
            the next opens at once if it is within 400ms (Base UI's timeout). */}
        <TooltipProvider delay={700}>
          {/* The command palette (ADR 0022): Ctrl+K or the navbar's search button. */}
          <PaletteProvider
            descendants={descendants}
            weapons={weapons}
            reactors={reactors}
            components={components}
            fellows={fellows}
            vehicles={vehicles}
            mutantCells={mutantCells}
          >
            <SiteHeader />
            {/* Clipped sideways, so content sliding in never widens the page
                (ADR 0030); `clip` keeps the tab strip sticky, unlike `hidden`. */}
            <main className="flex-1 overflow-x-clip">
              <PageEnter>{children}</PageEnter>
            </main>
            <SiteFooter />
          </PaletteProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
