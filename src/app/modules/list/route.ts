import type { PaletteModuleList } from "@/features/command-palette/palette-modules";
import { versionTier } from "@/features/modules/module-tiers";
import { fetchModuleGroups } from "@/lib/nexon/module-index";

// Every module for the command palette's Modules group, as a static JSON file built
// with the pages and refreshed by the weekly deploy (ADR 0008, ADR 0022, ADR 0025). The
// palette loads it the first time it opens, so no page carries 573 commands.
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const groups = await fetchModuleGroups();
  const list: PaletteModuleList = {
    modules: groups.map((group) => {
      const tiers = group.variants
        .map(versionTier)
        .sort((a, b) => a.rank - b.rank);
      return {
        slug: group.slug,
        name: group.name,
        tier: tiers.at(0)?.name ?? "",
        keywords: [
          ...new Set(
            group.variants.flatMap((variant) => [
              variant.category,
              ...(variant.type === null ? [] : [variant.type]),
            ]),
          ),
        ],
      };
    }),
  };
  return Response.json(list);
}
