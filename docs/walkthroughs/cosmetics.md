# The Cosmetics page

`/cosmetics` (ADR 0039): every cosmetic in NEXON's `customizing-item.json`, as an index built like the modules index (`docs/walkthroughs/modules.md`); this covers what differs.

## The code path

1. **The data.** `fetchCosmetics` (`src/lib/nexon/cosmetic-index.ts`) fetches the set and the Descendants once per build worker. `cosmeticIndex` sorts the entries by id and groups those with the same name, type, tier and description into one card, its entries the card's versions. Each version keeps its art, its evolution stages in stage order, and its Descendants as slugs (ids `descendant.json` doesn't know are dropped). A card is `everyone` when its type is in `everyDescendantTypes` (`src/data/cosmetics.ts`) and no version names anyone. The Descendants any card names come back with it, in `cosmeticDescendantOrder` (by name, each Ultimate after its base), with their portraits.
2. **The page.** `src/app/cosmetics/page.tsx` turns the tiers present into `CosmeticTier`s (`rarityOf`: name and color from the chat tags, highest first) and the types into `cosmeticTypeOptions` (the game's order, then any new type), and passes them with the cards to `CosmeticIndex`.
3. **The filters.** `parseCosmeticFilters` reads `type`, `tier`, `descendant`, `sort`, `q` and `cosmetic` from the URL, ignoring values the index doesn't offer. `filterCosmetics` keeps a type, a tier, what a Descendant can use (`usableBy`: everyone, or a version naming them) and the cards holding every search word in the name, type, tier or a Descendant's name, then orders them by tier (no tier last) or by name, a name's types in the game's order.
4. **The grid.** `CosmeticIndex` draws 60 cards a batch (ADR 0031). Each card shows `shownVersion`: the chosen Descendant's version, or the first, one with art before one without. The open card's `CosmeticDetails` goes in the row under its card's row (`rowEnd`) and opens on the same version; picking another version or a stage only changes the details' own state, not the URL.
5. **Links in.** The database page's items (`src/lib/nexon/database-items.ts`) are built from the same cards, highest tier first, each tagged with its Descendants' names and opening `/cosmetics?cosmetic=<slug>`. The navbar, the footer and the database page don't prefetch the page (`prefetch: false` in `sitePages`), as for the modules.

## Why it's shaped this way

- **A card per cosmetic.** NEXON lists a cosmetic once per Descendant or pair; as cards, Dinosaur Pajamas' Body Skin would be 16 of them. The description joins the key because two cosmetics share the name Passion and the type Makeup.
- **`everyone` from T7SEN's check, not from an empty list.** NEXON lists no Descendants for attachments, paints, hair paints and spawns; T7SEN confirmed in game that every Descendant can use them. A head skin with no Descendants listed would not be everyone's, so the rule is by type.
- **`versions` is a non-empty tuple.** Every card has at least one version, so `card.versions[0]` needs no check.
- **Descriptions are in the page.** About half of its 199 KB gzipped; ADR 0039 has the trade-off.
- **No palette rows.** T7SEN kept the palette to pages and the smaller lists; the database search finds every cosmetic.

## What would break it

- NEXON renaming a type id: the cards keep working, named from the new id, but the type filter's slug, and old links using it, change. A renamed shared type would also stop being `everyone` until `everyDescendantTypes` follows.
- NEXON changing a cosmetic's name or description: its address or its grouping changes, and old shared links open the index with nothing open.
- NEXON listing Descendants for a shared type: those cards name them instead of "Every Descendant", which is NEXON's data and fine.
- NEXON adding a tier the chat tags don't name: those cards show no tier and the filter doesn't offer it.
- The image host moving: the cards show the shirt placeholder only where NEXON lists no art; a moved host fails validation and the page leaves the set out.
