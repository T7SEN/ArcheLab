import { ExternalLink, Mail } from "lucide-react";

const linkClass =
  "inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Where a player sends what they saw in game (ADR 0028): the GitHub form, in a new tab,
 * or an email. `label` names what's reported, for screen readers ("Python's core
 * slots"), since several report links can share a page.
 */
export function ReportLinks({
  github,
  email,
  label,
}: {
  github: string;
  email: string;
  label: string;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
      <a href={github} target="_blank" rel="noreferrer" className={linkClass}>
        Report on GitHub
        <span className="sr-only"> for {label} (opens in a new tab)</span>
        <ExternalLink aria-hidden="true" className="size-3.5" />
      </a>
      <a href={email} className={linkClass}>
        <Mail aria-hidden="true" className="size-3.5" />
        Email it
        <span className="sr-only"> for {label}</span>
      </a>
    </span>
  );
}
