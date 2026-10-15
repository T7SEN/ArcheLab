import { MessageSquareText } from "lucide-react";
import Link from "next/link";
import { SpecularButton } from "@/components/react-bits/specular-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 overflow-x-clip border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="rounded-md font-display text-xl font-semibold tracking-wide text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          ArcheLab
        </Link>
        <nav aria-label="Tools">
          <SpecularButton
            href="/tools/chat"
            size="sm"
            radius={10}
            className="px-3.5 py-2"
          >
            <MessageSquareText aria-hidden="true" className="size-4" />
            Chat builder
          </SpecularButton>
        </nav>
      </div>
    </header>
  );
}
