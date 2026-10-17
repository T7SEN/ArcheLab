# The Mutant Cells page

`/mutant-cells` (ADR 0038, ADR 0040): every Mutant Cell in NEXON's `node-item.json`, checked against the update notes, as an index built like the modules index (`docs/walkthroughs/modules.md`); this covers what differs.

## The code path

1. **The data.** `fetchMutantCells` (`src/lib/nexon/mutant-cell-index.ts`) fetches NEXON's `node-item.json` and `node-socket-type.json` once per build worker (ADR 0040). `mutantCellsFrom` names each cell's socket and splits its effect's text into sections with `effectSections`: a blank line ends a section, its first line is the heading ("Singular Tuning", "Basic Info"), and each row after it is a name, a tab and a value. A cell whose socket isn't one of the five is left out, with a warning.
2. **The cross-check.** `crossCheckMutantCells` compares the cells with `mutantCellNotes` (`src/data/mutant-cells.ts`), the 64 the update notes added: a cell on one side only, a different socket, or a different set of numbers in a cell's effects, headings included. Each difference is a build warning. Wording isn't compared, since NEXON's labels are fuller than the notes'.
3. **The cards.** `mutantCellCards` (`src/features/mutant-cells/mutant-cell-filters.ts`) adds each cell's address (`mutantCellSlug`) and orders them by socket, then A–Z. The page passes them to `MutantCellIndex`.
4. **The filters.** `parseMutantCellFilters` reads `socket`, `q` and `cell` from the URL, ignoring a socket or cell the index doesn't have; `filterMutantCells` keeps a socket's cells and those holding every search word in the name, socket, description, section headings or row names.
5. **The grid.** `MutantCellIndex` draws `mutantCellBatch` (20) cards, then 20 more each time `MoreCards` nears the screen (ADR 0031), with the open cell always drawn (`batchesThrough(openIndex, mutantCellBatch)`). `batchesThrough` and `drawnCount` take the batch size; the other indexes keep the default 60. The open cell's `MutantCellDetails` goes in the row under its card's row (`rowEnd`), as on the other indexes; its description keeps NEXON's line breaks (`whitespace-pre-line`).
6. **Links in.** The database page's items (`src/lib/nexon/database-items.ts`) and the palette's rows (`palette-mutant-cells.ts`, from the layout) are built from the same cells, each opening `/mutant-cells?cell=<slug>`.

## Why it's shaped this way

- **NEXON's set, with the notes as the cross-check (ADR 0040).** The first build used the notes alone, because the set names tried for Mutant Cells answered 403; `node-item.json` was in NEXON's documented list all along. Its numbers match the notes', and its wording is the game's. The notes stay as a check, so a balance change shows up as a build warning rather than silently.
- **Warnings, not failures.** A failed cross-check would stop every deploy until the notes' record caught up with a patch.
- **The text is parsed, not restyled.** Headings, labels, marks and line breaks are NEXON's, so the page reads as the game does.
- **20 a batch, not 60.** With 60, all but 4 of the 64 cells were drawn at load, so nothing seemed to load as the page scrolled.

## What would break it

- NEXON changing the effect text's layout (no blank lines between sections, no tabs): rows would merge or lose their values. `mutant-cell-index.test.ts` pins the layout of 17 October 2026.
- NEXON renaming a socket: its cells are left out with a warning until `mutantCellSockets` follows.
- A cell renamed in game: its address changes, and old shared links open the index with nothing open; the cross-check warns that the old name is gone.
- NEXON moving the Library's socket icons: the socket labels and filter chips lose their glyphs (the modules index too).
