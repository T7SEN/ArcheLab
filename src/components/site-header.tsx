import { MessageSquareText } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="rounded-md font-display text-xl font-semibold tracking-wide text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          ArcheLab
        </Link>
        <nav aria-label="Tools">
          <Link
            href="/tools/chat"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <MessageSquareText aria-hidden="true" />
            Chat builder
          </Link>
        </nav>
      </div>
    </header>
  );
}
