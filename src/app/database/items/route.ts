import type { DatabaseItemList } from "@/features/database/database-items";
import { fetchDatabaseItems } from "@/lib/nexon/database-items";

// Every database item for the database page's search, as a static JSON file built with
// the pages and refreshed by the weekly deploy (ADR 0008, ADR 0034). The page loads it
// once someone searches, so it doesn't carry hundreds of items in its HTML.
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const list: DatabaseItemList = { items: await fetchDatabaseItems() };
  return Response.json(list);
}
