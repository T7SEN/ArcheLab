/** The footer line, in T7SEN's words (2026-10-15). It carries the fan-site disclaimer. */
export const footerText =
  "Made with ❤️ by T7SEN. © 2026 ArcheLab - ArcheLab is a community fan site and is not affiliated with Nexon.";

/**
 * Required on every page: NEXON's API terms ask sites to name Nexon as the data source
 * (§8.4), and the builder shows NEXON portraits (AGENTS.md critical rule 3).
 */
export const attributionText = "Data based on NEXON Open API.";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p>{footerText}</p>
        <p className="text-xs">{attributionText}</p>
      </div>
    </footer>
  );
}
