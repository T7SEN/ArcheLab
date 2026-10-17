import type { ReactNode } from "react";
import { SectionHeader } from "@/components/section-header";

/**
 * A page's section with the site's shared header, and a scroll margin so a link to it
 * lands it under the floating navbar: the Help fill in data page's sections. Descendant
 * and weapon pages show theirs as tabs instead (ADR 0029).
 */
export function PageSection({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="mx-auto grid max-w-6xl scroll-mt-(--site-header-height) gap-6 px-4 py-10"
    >
      <SectionHeader
        id={`${id}-title`}
        icon={icon}
        title={title}
        description={description}
      />
      {children}
    </section>
  );
}
