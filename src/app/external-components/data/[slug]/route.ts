import type { ComponentLevelsFile } from "@/features/external-components/component-levels";
import { fetchComponentGroups } from "@/lib/nexon/component-index";

// An external component card's levels, piece by piece, as a static JSON file, built
// with the pages and refreshed by the weekly deploy (ADR 0008, ADR 0027). The external
// components index loads it when its details open; no request runs server code.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await fetchComponentGroups()).map((group) => ({ slug: group.slug }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/external-components/data/[slug]">,
): Promise<Response> {
  const { slug } = await params;
  const group = (await fetchComponentGroups()).find(
    (entry) => entry.slug === slug,
  );
  if (group === undefined) {
    return Response.json(null, { status: 404 });
  }
  const file: ComponentLevelsFile = {
    levels: Object.fromEntries(
      group.pieces.map((piece) => [piece.id, piece.levels]),
    ),
  };
  return Response.json(file);
}
