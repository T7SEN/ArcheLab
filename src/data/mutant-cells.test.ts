import { describe, expect, it } from "vitest";
import {
  mutantCellNotes,
  mutantCellSlug,
  mutantCellSockets,
  type MutantCellNote,
} from "./mutant-cells";

const byName = (name: string): MutantCellNote | undefined =>
  mutantCellNotes.find((cell) => cell.name === name);

const countBy = (key: (cell: MutantCellNote) => string) => {
  const counts: Record<string, number> = {};
  for (const cell of mutantCellNotes) {
    counts[key(cell)] = (counts[key(cell)] ?? 0) + 1;
  }
  return counts;
};

describe("the Mutant Cells in the update notes, the cross-check", () => {
  it("are the 64 the update notes add, as tfdhub.gg counts them", () => {
    expect(mutantCellNotes).toHaveLength(64);
    expect(countBy((cell) => cell.added)).toEqual({
      "1.2.18": 27,
      "1.3.3": 8,
      "1.3.6": 9,
      "1.3.9": 19,
      "1.3.12": 1,
    });
  });

  it("fit the five sockets, as many in each as the notes give", () => {
    expect(countBy((cell) => cell.socket)).toEqual({
      Almandine: 12,
      Cerulean: 10,
      Malachite: 17,
      Rutile: 11,
      Xantic: 14,
    });
    for (const cell of mutantCellNotes) {
      expect(mutantCellSockets).toContain(cell.socket);
    }
  });

  it("each have a name and address of their own and numbers for every effect", () => {
    const names = mutantCellNotes.map((cell) => cell.name);
    expect(new Set(names).size).toBe(names.length);
    const slugs = names.map(mutantCellSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const cell of mutantCellNotes) {
      expect(cell.description).toMatch(/\.$/);
      expect(cell.effects.length).toBeGreaterThan(0);
      for (const effect of cell.effects) {
        expect(effect.stats.length).toBeGreaterThan(0);
      }
    }
  });

  it("keep the notes' numbers and words", () => {
    // Update 1.2.18: two Tuning effects, each with its own numbers.
    expect(byName("Singular Fusion Tuning")).toMatchObject({
      socket: "Cerulean",
      effects: [
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
            { name: "Skill Duration", value: "13.5%[+]" },
          ],
        },
      ],
    });
    // The Toxin cell's stat is "Toxic Skill Power", as the notes write it.
    expect(byName("Toxin Cohesion")?.effects.at(0)?.stats.at(3)).toEqual({
      name: "Toxic Skill Power",
      value: "6.4%[+]",
    });
    // Update 1.3.3, 1.3.9 and 1.3.12.
    expect(byName("Toxin Chain Catalyst")).toMatchObject({
      socket: "Xantic",
      description:
        "On Skill hit, inflicts Toxin Chain Catalyst on the target hit.",
    });
    expect(byName("Fiery Forced Rally")?.effects.at(0)?.stats).toEqual([
      { name: "Additional Fire Damage after 1s", value: "Skill Power x 550%" },
      { name: "Cooldown", value: "10s" },
    ]);
    expect(byName("Corrosive Overshield")).toMatchObject({
      socket: "Xantic",
      added: "1.3.12",
      effects: [{ title: "Corrosion Barrier" }],
    });
  });

  it("are addressed by their name", () => {
    expect(mutantCellSlug("Non-Attribute Cohesion")).toBe(
      "non-attribute-cohesion",
    );
    expect(mutantCellSlug("Recover MP")).toBe("recover-mp");
  });
});
