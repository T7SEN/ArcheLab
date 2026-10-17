# The Mutant Cells page

`/mutant-cells` (ADR 0038): every Mutant Cell from the update notes, as an index built like the modules index (`docs/walkthroughs/modules.md`); this covers what differs.

## The code path

1. **The data.** `src/data/mutant-cells.ts` holds all 64 cells as the update notes give them: name, socket, description, effects and the update that added each. Families the notes repeat for each attribute or skill type (Tunings, Vulnerabilities, Cohesions, Element Adaptations, Chain Catalysts, Impairments, Damage Conversions) come from one helper each, so a family's wording is written once. An effect has a `title` only when the cell has two (the Tunings), when the notes head the numbers with a condition (the Shield cells), or when the effect has a name of its own (Corrosion Barrier).
2. **The cards.** `mutantCellCards` (`src/features/mutant-cells/mutant-cell-filters.ts`) adds each cell's address (`mutantCellSlug`) and icon (`mutantCellImageUrl`, from `mutantCellArt`) and orders them by socket, then A–Z. The page passes them to `MutantCellIndex`.
3. **The filters.** `parseMutantCellFilters` reads `socket`, `q` and `cell` from the URL, ignoring a socket or cell the index doesn't have; `filterMutantCells` keeps a socket's cells and those holding every search word in the name, socket, description, effect titles or stat names.
4. **The grid.** `MutantCellIndex` draws `mutantCellBatch` (20) cards, then 20 more each time `MoreCards` nears the screen (ADR 0031), with the open cell always drawn (`batchesThrough(openIndex, mutantCellBatch)`). `batchesThrough` and `drawnCount` take the batch size; the other indexes keep the default 60. The open cell's `MutantCellDetails` goes in the row under its card's row (`rowEnd`), as on the other indexes.
5. **Links in.** The database page's items (`src/lib/nexon/database-items.ts`) and the palette's rows (`palette-mutant-cells.ts`, from the layout) are built from the same data, each opening `/mutant-cells?cell=<slug>`.

## Why it's shaped this way

- **The site's own data, not NEXON's.** NEXON's metadata has no Mutant Cell set (ADR 0038). The data test pins 64 cells, the count each update added and the count per socket, so a cell lost or doubled while editing fails it.
- **The notes' wording, kept.** tfdhub words some lines differently ("full HP", "Missing HP Ratio"), with the same numbers. The official wording wins until an in-game check says otherwise.
- **20 a batch, not 60.** With 60, all but 4 of the 64 cells were drawn at load, so nothing seemed to load as the page scrolled.
- **Each cell's own icon.** The icons are on NEXON's image host, but no keyless set lists them; `mutantCellArt` holds tfdhub's match, which T7SEN asked for. A cell missing from it shows its socket's icon instead (`CellTile`).

## What would break it

- A new update adding cells: they reach the site only when added to `mutant-cells.ts` (and the data test's counts).
- NEXON replacing a cell's icon on its image host: that card shows a broken image until `mutantCellArt` is updated.
- NEXON moving the Library's socket icons: the socket labels and filter chips lose their glyphs (the modules index too).
- A cell renamed in game: its address changes, and old shared links open the index with nothing open.
