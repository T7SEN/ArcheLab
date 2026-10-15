import { describe, expect, it } from "vitest";
import { chatRegistry } from "./chat-registry";
import { cleanMarkup, refusedNotice } from "./clean-markup";

describe("markup panel input", () => {
  it("turns line breaks into spaces", () => {
    expect(cleanMarkup("a\nb\r\nc\rd", chatRegistry).markup).toBe("a b c d");
  });

  it("removes characters the game refuses and lists them", () => {
    expect(cleanMarkup("<red>hi🙂</>✦", chatRegistry)).toEqual({
      markup: "<red>hi</>",
      refused: ["🙂", "✦"],
    });
  });

  it("keeps untested characters", () => {
    expect(cleanMarkup("é가★", chatRegistry).refused).toEqual([]);
  });

  it("names each refused character once", () => {
    expect(refusedNotice(["🙂", "🙂"])).toBe(
      "Removed 🙂: the game refuses this character.",
    );
    expect(refusedNotice(["🙂", "✦"])).toBe(
      "Removed 🙂 ✦: the game refuses these characters.",
    );
  });
});
