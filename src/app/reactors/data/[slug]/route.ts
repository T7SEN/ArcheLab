import type { ReactorLevelsFile } from "@/features/reactors/reactor-levels";
import { fetchReactorGroups } from "@/lib/nexon/reactor-index";

// A reactor's levels at each tier as a static JSON file, built with the pages and
// refreshed by the weekly deploy (ADR 0008, ADR 0026). The reactors index loads it when
// the reactor's details open; no request runs server code.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await fetchReactorGroups()).map((group) => ({ slug: group.slug }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/reactors/data/[slug]">,
): Promise<Response> {
  const { slug } = await params;
  const group = (await fetchReactorGroups()).find(
    (entry) => entry.slug === slug,
  );
  if (group === undefined) {
    return Response.json(null, { status: 404 });
  }
  const file: ReactorLevelsFile = {
    levels: Object.fromEntries(
      group.versions.map((version) => [version.id, version.levels]),
    ),
  };
  return Response.json(file);
}
