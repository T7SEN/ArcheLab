import { fetchDifficultyRewards } from "@/lib/nexon/difficulty-rewards";

// What drops in one battlefield as a static JSON file, built with the pages and
// refreshed by the weekly deploy (ADR 0008, ADR 0048). The Difficulty Level Rewards
// page loads it when the battlefield's details open; no request runs server code.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams(): Promise<
  { battlefield: string }[]
> {
  return [...(await fetchDifficultyRewards()).drops.keys()].map(
    (battlefield) => ({ battlefield }),
  );
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/difficulty-level-rewards/data/[battlefield]">,
): Promise<Response> {
  const { battlefield } = await params;
  const file = (await fetchDifficultyRewards()).drops.get(battlefield);
  return file === undefined
    ? Response.json(null, { status: 404 })
    : Response.json(file);
}
