/** Legal text from SKILL.md section 7, required on every page. */
export const legalText =
  "ArcheLab is an unofficial fan site. It is not affiliated with or endorsed by NEXON. The First Descendant is a trademark of NEXON. Data based on NEXON Open API.";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-sm text-muted-foreground">{legalText}</p>
      </div>
    </footer>
  );
}
