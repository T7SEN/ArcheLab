import { cn } from "cn";
import { ArrowRight, Check, FlaskConical } from "lucide-react";
import type { ReactNode } from "react";
import { PixelCard } from "@/components/react-bits/pixel-card";
import { SpecularButton } from "@/components/react-bits/specular-button";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import type { Tool } from "@/data/tools";

type LiveTool = Extract<Tool, { status: "live" }>;
type ComingSoonTool = Extract<Tool, { status: "coming-soon" }>;

/** Widths of a coming-soon card's placeholder feature lines. */
const placeholderRows = ["w-4/5", "w-3/5", "w-2/3"];

interface FeaturedToolProps {
  tool: LiveTool;
  /** A live sample of the tool, beside its features. */
  sample: ReactNode;
}

/** A live tool's own section: what it does, a sample of it, and a link in (ADR 0018). */
export function FeaturedTool({ tool, sample }: FeaturedToolProps) {
  const Icon = tool.icon;
  const titleId = `tool-${tool.slug}`;
  return (
    <section aria-labelledby={titleId} className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader
        id={titleId}
        icon={<Icon />}
        title={tool.name}
        description={tool.description}
        action={
          <SpecularButton href={tool.href} size="sm" radius={10}>
            {tool.cta}
            <ArrowRight aria-hidden="true" className="size-4" />
          </SpecularButton>
        }
      />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <SpotlightCard className="grid h-full content-center gap-4 p-6">
          <p className="font-display text-xl font-semibold tracking-wide">
            What it does
          </p>
          <ul className="grid gap-3 text-muted-foreground">
            {tool.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-primary"
                />
                {feature}
              </li>
            ))}
          </ul>
        </SpotlightCard>
        {sample}
      </div>
    </section>
  );
}

/** The tools still being drawn, under one header (ADR 0018). */
export function ComingSoonTools({
  tools,
}: {
  tools: readonly ComingSoonTool[];
}) {
  if (tools.length === 0) {
    return null;
  }
  return (
    <section
      id="coming-soon"
      aria-labelledby="coming-soon-title"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12"
    >
      <SectionHeader
        id="coming-soon-title"
        icon={<FlaskConical />}
        title="Coming soon"
        description="ArcheLab is growing past chat: build tools are next."
      />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ComingSoonCard tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A tool still being drawn: its feature lines are placeholders. */
function ComingSoonCard({ tool }: { tool: ComingSoonTool }) {
  const Icon = tool.icon;
  return (
    <PixelCard
      noFocus
      radius={14}
      origin="pointer"
      gap={6}
      opacity={0.7}
      fade={0.85}
      className="h-full"
    >
      <div className="flex h-full w-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground outline-1 -outline-offset-1 outline-muted-foreground/40 outline-dashed">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <Badge variant="outline" className="bg-card text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse"
            />
            Coming soon
          </Badge>
        </div>
        <div className="grid gap-1">
          <h3 className="font-display text-xl font-semibold tracking-wide">
            {tool.name}
          </h3>
          <p className="text-sm text-muted-foreground">{tool.description}</p>
        </div>
        <ul aria-hidden="true" className="grid gap-2">
          {placeholderRows.map((width) => (
            <li key={width} className="flex items-center gap-2 py-0.5">
              <span className="size-4 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
              <span className={cn("h-2 rounded-full bg-border", width)} />
            </li>
          ))}
        </ul>
      </div>
    </PixelCard>
  );
}
