import "server-only";
import { z } from "zod";
import {
  mutantCellNotes,
  mutantCellSockets,
  type MutantCell,
  type MutantCellEffect,
  type MutantCellSocket,
  type MutantCellStat,
} from "@/data/mutant-cells";
import type { MutantCellWithIcon } from "@/features/mutant-cells/mutant-cell-filters";
import { fetchMetadataSet, nexonImageUrl } from "./metadata";
import { numericId } from "./shared-sets";

/**
 * The Mutant Cells (T7SEN, 2026-10-17; ADR 0040): every cell in NEXON's `node-item.json`,
 * its socket named from `node-socket-type.json`. NEXON listed 64 on 2026-10-17, each
 * with an icon, a description and one effect whose text holds headed sections of
 * "name<tab>value" rows, split by blank lines. The update notes are the cross-check:
 * each build warns about any difference from `mutantCellNotes`.
 */

const cellSchema = z.object({
  node_item_id: numericId,
  node_item_name: z.string().min(1),
  node_item_image_url: nexonImageUrl.nullable(),
  node_item_description: z.string(),
  node_item_socket_type: z.string().min(1),
  node_item_effect: z.array(
    z.object({
      node_item_effect_name: z.string(),
      node_item_effect_description: z.string(),
    }),
  ),
});

const socketSchema = z.object({
  node_item_socket_type: z.string().min(1),
  node_item_socket_name: z.string().min(1),
});

export type MutantCellRecord = z.infer<typeof cellSchema>;
export type MutantCellSocketRecord = z.infer<typeof socketSchema>;

const isSocket = (name: string): name is MutantCellSocket =>
  (mutantCellSockets as readonly string[]).includes(name);

/**
 * An effect's text as sections: a heading line ("Singular Tuning", "Basic Info"), then
 * its rows. A section with no heading has a null title; a row with no tab keeps its text
 * as the name, with no value.
 */
export function effectSections(text: string): MutantCellEffect[] {
  return text.split(/\n[ \t]*\n/).flatMap((section): MutantCellEffect[] => {
    const lines = section
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.trim() !== "");
    const first = lines.at(0);
    const title =
      first === undefined || first.includes("\t") ? null : first.trim();
    const stats = (title === null ? lines : lines.slice(1)).map(
      (line): MutantCellStat => {
        const tab = line.indexOf("\t");
        return tab === -1
          ? { name: line.trim(), value: "" }
          : {
              name: line.slice(0, tab).trim(),
              value: line.slice(tab + 1).trim(),
            };
      },
    );
    return title === null && stats.length === 0 ? [] : [{ title, stats }];
  });
}

/**
 * NEXON's cells in id order, with their sockets named. A cell whose socket isn't one of
 * the five is left out and named in `dropped`.
 */
export function mutantCellsFrom(
  records: readonly MutantCellRecord[],
  sockets: readonly MutantCellSocketRecord[],
): { cells: MutantCellWithIcon[]; dropped: string[] } {
  const names = new Map(
    sockets.map((socket) => [
      socket.node_item_socket_type,
      socket.node_item_socket_name,
    ]),
  );
  const cells: MutantCellWithIcon[] = [];
  const dropped: string[] = [];
  const sorted = [...records].sort((a, b) =>
    a.node_item_id.localeCompare(b.node_item_id, "en", { numeric: true }),
  );
  for (const record of sorted) {
    const socket = names.get(record.node_item_socket_type) ?? "";
    if (!isSocket(socket)) {
      dropped.push(record.node_item_name);
      continue;
    }
    cells.push({
      name: record.node_item_name,
      socket,
      description: record.node_item_description.trim(),
      effects: record.node_item_effect.flatMap((effect) =>
        effectSections(effect.node_item_effect_description),
      ),
      imageUrl: record.node_item_image_url,
    });
  }
  return { cells, dropped };
}

/** Every number in a cell's effects, headings included, each once, in order. */
function numbersOf(cell: MutantCell): string {
  const text = cell.effects
    .flatMap((effect) => [
      effect.title ?? "",
      ...effect.stats.flatMap((stat) => [stat.name, stat.value]),
    ])
    .join(" ");
  const numbers = new Set(
    (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map((number) =>
      String(Number(number)),
    ),
  );
  return [...numbers].sort((a, b) => Number(a) - Number(b)).join(", ");
}

/**
 * How NEXON's cells differ from the update notes' (ADR 0040): a cell on one side only, a
 * different socket, or different numbers. Wording isn't compared: NEXON's labels are
 * fuller than the notes' ("Base Skill Power boost ratio" for "Skill Power").
 */
export function crossCheckMutantCells(
  cells: readonly MutantCell[],
  notes: readonly MutantCell[],
): string[] {
  const fromNexon = new Map(cells.map((cell) => [cell.name, cell]));
  const fromNotes = new Map(notes.map((note) => [note.name, note]));
  const differences: string[] = [];
  for (const note of notes) {
    const cell = fromNexon.get(note.name);
    if (cell === undefined) {
      differences.push(`${note.name} is in the update notes, not NEXON's set.`);
      continue;
    }
    if (cell.socket !== note.socket) {
      differences.push(
        `${note.name} fits ${cell.socket} in NEXON's set, ${note.socket} in the notes.`,
      );
    }
    const theirs = numbersOf(cell);
    const ours = numbersOf(note);
    if (theirs !== ours) {
      differences.push(
        `${note.name} has the numbers ${theirs} in NEXON's set, ${ours} in the notes.`,
      );
    }
  }
  for (const cell of cells) {
    if (!fromNotes.has(cell.name)) {
      differences.push(`${cell.name} is in NEXON's set, not the update notes.`);
    }
  }
  return differences;
}

let cellsPromise: Promise<MutantCellWithIcon[]> | null = null;

/**
 * Every cell, fetched once per build worker and checked against the update notes; none
 * when NEXON can't be reached.
 */
export function fetchMutantCells(): Promise<MutantCellWithIcon[]> {
  cellsPromise ??= Promise.all([
    fetchMetadataSet("node-item", cellSchema),
    fetchMetadataSet("node-socket-type", socketSchema),
  ]).then(([records, sockets]) => {
    const { cells, dropped } = mutantCellsFrom(records, sockets);
    if (dropped.length > 0) {
      console.warn(
        `NEXON node-item.json: ${dropped.join(", ")} fit no known socket and were left out.`,
      );
    }
    if (cells.length > 0) {
      for (const difference of crossCheckMutantCells(cells, mutantCellNotes)) {
        console.warn(`Mutant Cells cross-check: ${difference}`);
      }
    }
    return cells;
  });
  return cellsPromise;
}
