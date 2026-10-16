import { describe, expect, it, vi } from "vitest";
import { matchesCommand } from "@/features/command-palette/commands";
import { chatRegistry } from "./chat-registry";
import {
  chatActionCommands,
  iconCommands,
  styleCommands,
  type ChatActionState,
  type ChatActions,
} from "./palette-commands";
import { styleGroups } from "./style-options";

const state: ChatActionState = {
  canCopy: true,
  canCopyWritten: false,
  canShare: true,
  canClear: true,
  channel: "normal",
  channels: chatRegistry.data.channels,
  gameBackground: false,
};

function actions(): ChatActions {
  return {
    copyMarkup: vi.fn(),
    copyWritten: vi.fn(),
    copyLink: vi.fn(),
    clear: vi.fn(),
    openTemplates: vi.fn(),
    setChannel: vi.fn(),
    toggleGameBackground: vi.fn(),
  };
}

function run(commandAction: unknown): void {
  const action = commandAction as { kind: string; run?: () => void };
  expect(action.kind).toBe("run");
  action.run?.();
}

describe("the builder's actions", () => {
  it("disable what the message can't do yet", () => {
    const empty = chatActionCommands(
      { ...state, canCopy: false, canShare: false, canClear: false },
      actions(),
    );
    const byLabel = new Map(empty.map((entry) => [entry.label, entry]));
    expect(byLabel.get("Copy markup")?.disabled).toBe(true);
    expect(byLabel.get("Copy share link")?.disabled).toBe(true);
    expect(byLabel.get("Clear message")?.disabled).toBe(true);
    expect(byLabel.get("Open templates")?.disabled).toBeUndefined();
    expect(byLabel.has("Copy markup as written")).toBe(false);
  });

  it("offer every channel, marking the current one, and switch to it", () => {
    const calls = actions();
    const commands = chatActionCommands(state, calls);
    const channels = commands.filter((entry) =>
      entry.id.startsWith("chat:channel:"),
    );
    expect(channels).toHaveLength(chatRegistry.data.channels.length);
    expect(
      channels.filter((entry) => entry.hint === "Current").map((e) => e.id),
    ).toEqual(["chat:channel:normal"]);
    const party = channels.find((entry) => entry.label === "Party chat");
    run(party?.action);
    expect(calls.setChannel).toHaveBeenCalledWith("party");
  });

  it("run the builder's own handlers", () => {
    const calls = actions();
    const commands = chatActionCommands(
      { ...state, canCopyWritten: true, gameBackground: true },
      calls,
    );
    const byLabel = new Map(commands.map((entry) => [entry.label, entry]));
    run(byLabel.get("Copy markup")?.action);
    run(byLabel.get("Copy markup as written")?.action);
    run(byLabel.get("Copy share link")?.action);
    run(byLabel.get("Clear message")?.action);
    run(byLabel.get("Open templates")?.action);
    run(byLabel.get("Hide game background")?.action);
    expect(calls.copyMarkup).toHaveBeenCalledOnce();
    expect(calls.copyWritten).toHaveBeenCalledOnce();
    expect(calls.copyLink).toHaveBeenCalledOnce();
    expect(calls.clear).toHaveBeenCalledOnce();
    expect(calls.openTemplates).toHaveBeenCalledOnce();
    expect(calls.toggleGameBackground).toHaveBeenCalledOnce();
  });
});

describe("styles and icons", () => {
  it("offer every style in the picker, applying it when picked", () => {
    const groups = styleGroups(chatRegistry);
    const apply = vi.fn();
    const commands = styleCommands(groups, apply);
    expect(commands).toHaveLength(
      groups.reduce((total, group) => total + group.options.length, 0),
    );
    const red = commands.find((entry) => entry.id === "style:tag:red");
    expect(red?.swatch).toBe(chatRegistry.tagsByName.get("red")?.hex);
    run(red?.action);
    expect(apply).toHaveBeenCalledWith({ type: "tag", name: "red" });
  });

  it("offer every icon with its cost, inserting it when picked", () => {
    const insert = vi.fn();
    const commands = iconCommands(chatRegistry.data.images, insert);
    expect(commands).toHaveLength(chatRegistry.data.images.length);
    const bunny = commands.find((entry) => entry.id === "icon:IconBunny1");
    expect(bunny).toMatchObject({ label: "Bunny", hint: "+22" });
    run(bunny?.action);
    expect(insert).toHaveBeenCalledWith("IconBunny1");
  });

  it("list Descendant portraits first, so a name finds the portrait before a ticket", () => {
    const commands = iconCommands(chatRegistry.data.images, vi.fn());
    const portraits = chatRegistry.data.images.filter(
      (image) => image.art.kind === "descendant",
    );
    expect(portraits.length).toBeGreaterThan(0);
    expect(
      commands.slice(0, portraits.length).map((entry) => entry.id),
    ).toEqual(portraits.map((image) => `icon:${image.id}`));
    // The palette highlights the first match: for every Descendant, their portrait.
    for (const portrait of portraits) {
      const first = commands.find((entry) =>
        matchesCommand(entry, portrait.label.toLowerCase()),
      );
      expect(first?.id, portrait.label).toBe(`icon:${portrait.id}`);
    }
    // Everything else keeps the registry's order.
    expect(commands.slice(portraits.length).map((entry) => entry.id)).toEqual(
      chatRegistry.data.images
        .filter((image) => image.art.kind !== "descendant")
        .map((image) => `icon:${image.id}`),
    );
  });
});
