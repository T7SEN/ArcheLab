import { describe, expect, it } from "vitest";
import { mutantCellNotes, type MutantCell } from "@/data/mutant-cells";
import { imageHost } from "./metadata";
import {
  crossCheckMutantCells,
  effectSections,
  mutantCellsFrom,
  type MutantCellRecord,
} from "./mutant-cell-index";

/** NEXON's socket names (node-socket-type.json, read 2026-10-17). */
const sockets = [
  { node_item_socket_type: "All", node_item_socket_name: "Free" },
  { node_item_socket_type: "SocketType_A", node_item_socket_name: "Cerulean" },
  { node_item_socket_type: "SocketType_B", node_item_socket_name: "Almandine" },
  { node_item_socket_type: "SocketType_C", node_item_socket_name: "Malachite" },
  { node_item_socket_type: "SocketType_D", node_item_socket_name: "Xantic" },
  { node_item_socket_type: "SocketType_E", node_item_socket_name: "Rutile" },
];

/** A cell shaped like NEXON's (read 2026-10-17). */
const record = (
  id: string,
  name: string,
  socket: string,
  effect: string,
  description = `When something happens, grants ${name} to self.`,
): MutantCellRecord => ({
  node_item_id: id,
  node_item_name: name,
  node_item_image_url: `${imageHost}${id}`,
  node_item_description: description,
  node_item_socket_type: socket,
  node_item_effect: [
    { node_item_effect_name: name, node_item_effect_description: effect },
  ],
});

const tuning = record(
  "231003006",
  "Singular Fusion Tuning",
  "SocketType_A",
  "Singular Tuning\nDuration\t10s\nSkill Effect Range\t34.2%[+]\n\nFusion Tuning\nDuration\t10s\nSkill Duration UP\t13.5%[+]",
  "When using a Singular Skill, grants Singular Tuning to self.\nWhen using a Fusion Skill, grants Fusion Tuning to self.\nThese effects can be activated multiple times.",
);
const shield = record(
  "231003012",
  "Shield Enhanced Arche",
  "SocketType_D",
  "Basic Info\nTrigger Condition\tMax Shield x 50% or higher\nBase Skill Power boost ratio\t9.5%[+]",
);
const conversion = record(
  "231003044",
  "Singular Damage Conversion",
  "SocketType_A",
  "Basic Info\nSingular Skill Power Boost Ratio\tMissing HP Ratio x 32.5%\nMax Increase\t17.1%",
);

describe("NEXON's Mutant Cells", () => {
  it("read an effect's text as headed sections of rows", () => {
    expect(
      effectSections(tuning.node_item_effect[0].node_item_effect_description),
    ).toEqual([
      {
        title: "Singular Tuning",
        stats: [
          { name: "Duration", value: "10s" },
          { name: "Skill Effect Range", value: "34.2%[+]" },
        ],
      },
      {
        title: "Fusion Tuning",
        stats: [
          { name: "Duration", value: "10s" },
          { name: "Skill Duration UP", value: "13.5%[+]" },
        ],
      },
    ]);
  });

  it("keep a row without a tab as its text, and a section without a heading", () => {
    expect(effectSections("Duration\t5s\n\nGrants a shield\n \n")).toEqual([
      { title: null, stats: [{ name: "Duration", value: "5s" }] },
      { title: "Grants a shield", stats: [] },
    ]);
  });

  it("are in id order, with their sockets named and their icons", () => {
    const { cells, dropped } = mutantCellsFrom([shield, tuning], sockets);
    expect(dropped).toEqual([]);
    expect(cells.map((cell) => [cell.name, cell.socket])).toEqual([
      ["Singular Fusion Tuning", "Cerulean"],
      ["Shield Enhanced Arche", "Xantic"],
    ]);
    expect(cells[0]?.imageUrl).toBe(`${imageHost}231003006`);
    // NEXON's line breaks stay in the description.
    expect(cells[0]?.description).toMatch(/self\.\nWhen using a Fusion/);
  });

  it("leave out a cell whose socket isn't one of the five", () => {
    const { cells, dropped } = mutantCellsFrom(
      [
        tuning,
        record("231003099", "Free Cell", "All", "Basic Info\nCooldown\t5s"),
      ],
      sockets,
    );
    expect(cells.map((cell) => cell.name)).toEqual(["Singular Fusion Tuning"]);
    expect(dropped).toEqual(["Free Cell"]);
  });
});

describe("the cross-check against the update notes", () => {
  const nexon = (...records: MutantCellRecord[]) =>
    mutantCellsFrom(records, sockets).cells;
  const notes = mutantCellNotes.filter((note) =>
    [
      "Singular Fusion Tuning",
      "Shield Enhanced Arche",
      "Singular Damage Conversion",
    ].includes(note.name),
  );

  it("finds nothing when names, sockets and numbers agree, whatever the wording", () => {
    // NEXON says "Missing HP Ratio" and "Base Skill Power boost ratio", the notes
    // "Consumed HP Ratio" and "Skill Power"; the 50% heads the notes' Shield numbers.
    expect(
      crossCheckMutantCells(nexon(tuning, shield, conversion), notes),
    ).toEqual([]);
  });

  it("names a cell on one side only, a socket or numbers that differ", () => {
    const moved = record(
      "231003012",
      "Shield Enhanced Arche",
      "SocketType_C",
      "Basic Info\nTrigger Condition\tMax Shield x 50% or higher\nBase Skill Power boost ratio\t9.9%[+]",
    );
    const added = record(
      "231003090",
      "New Cell",
      "SocketType_A",
      "New Cell\nDuration\t5s",
    );
    expect(crossCheckMutantCells(nexon(tuning, moved, added), notes)).toEqual([
      "Shield Enhanced Arche fits Malachite in NEXON's set, Xantic in the notes.",
      "Shield Enhanced Arche has the numbers 9.9, 50 in NEXON's set, 9.5, 50 in the notes.",
      "Singular Damage Conversion is in the update notes, not NEXON's set.",
      "New Cell is in NEXON's set, not the update notes.",
    ]);
  });

  it("covers all 64 cells the notes add", () => {
    const named: MutantCell[] = mutantCellNotes.map((note) => ({ ...note }));
    expect(crossCheckMutantCells(named, mutantCellNotes)).toEqual([]);
    expect(crossCheckMutantCells([], mutantCellNotes)).toHaveLength(64);
  });
});
