import { ArrowRight, MessageSquareText } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        ArcheLab is in progress
      </h1>
      <p className="mt-4 text-muted-foreground">
        Unofficial tools for The First Descendant. More are on the way.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <Link
            href="/tools/chat"
            className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Card className="transition-colors group-hover:bg-accent">
              <CardHeader>
                <MessageSquareText
                  aria-hidden="true"
                  className="mb-2 size-6 text-primary"
                />
                <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-wide">
                  Chat message builder
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </CardTitle>
                <CardDescription>
                  Color your chat messages, preview them in game colors, and
                  copy markup that fits the chat limit.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
      </ul>
    </section>
  );
}
