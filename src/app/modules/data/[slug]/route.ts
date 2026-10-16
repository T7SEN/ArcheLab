import type { ModuleLevelsFile } from "@/features/modules/module-levels";
import { fetchModuleGroups } from "@/lib/nexon/module-index";

// A module group's levels as a static JSON file, built with the pages and refreshed by
// the weekly deploy (ADR 0008, ADR 0025). The modules index loads it when the group's
// details open; no request runs server code. `site-pages.test.ts` reads page files
// only, so this data route needs no navbar entry.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await fetchModuleGroups()).map((group) => ({ slug: group.slug }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/modules/data/[slug]">,
): Promise<Response> {
  const { slug } = await params;
  const group = (await fetchModuleGroups()).find(
    (entry) => entry.slug === slug,
  );
  if (group === undefined) {
    return Response.json(null, { status: 404 });
  }
  const file: ModuleLevelsFile = {
    levels: Object.fromEntries(
      group.variants.map((variant) => [variant.id, variant.levels]),
    ),
  };
  return Response.json(file);
}
