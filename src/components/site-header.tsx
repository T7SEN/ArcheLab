import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-4">
        <Link
          href="/"
          className="rounded-md font-display text-xl font-semibold tracking-wide text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          ArcheLab
        </Link>
      </div>
    </header>
  );
}
