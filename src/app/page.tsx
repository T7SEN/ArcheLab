import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        ArcheLab is in progress
      </h1>
      <p className="mt-4 text-ink-muted">
        Unofficial tools for The First Descendant. More are on the way.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        <li className="bg-line p-px hud-frame">
          <Link
            href="/tools/chat"
            className="block bg-surface p-5 hud-frame focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent"
          >
            <span className="font-display text-xl font-semibold tracking-wide">
              Chat message builder
            </span>
            <span className="mt-2 block text-sm text-ink-muted">
              Color your chat messages, preview them in game colors, and copy
              markup that fits the chat limit.
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
