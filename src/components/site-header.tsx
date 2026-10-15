import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center px-4 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-ink"
        >
          ArcheLab
        </Link>
      </div>
    </header>
  );
}
