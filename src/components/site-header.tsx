import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center px-4 py-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-wide text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          ArcheLab
        </Link>
      </div>
    </header>
  );
}
