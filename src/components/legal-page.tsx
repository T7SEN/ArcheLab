import Link from "next/link";
import type { ReactNode } from "react";
import { contactEmail, legalUpdated } from "@/data/legal";

/**
 * A legal page (ADR 0021): a title, the date of the current wording, and sections of
 * plain text, sized for reading.
 */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  /** One line under the title that sums the page up. */
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 pb-20">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {legalUpdated}
      </p>
      <p className="mt-6 text-lg leading-relaxed">{intro}</p>
      <div className="mt-10 grid gap-10">{children}</div>
    </article>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 leading-relaxed text-foreground/85 [&_li]:pl-1 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:pl-5">
      <h2 className="font-display text-2xl font-semibold tracking-wide text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

const linkClass =
  "rounded-sm text-primary underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

/** A link inside legal text: site pages navigate in place, other sites open a new tab. */
export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    );
  }
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className={linkClass}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/** The contact address as a mail link. */
export function ContactEmail() {
  return <LegalLink href={`mailto:${contactEmail}`}>{contactEmail}</LegalLink>;
}
