import { describe, expect, it } from "vitest";
import { iconName } from "./chat-icons";

describe("iconName", () => {
  it("adds 'icon' once, never twice", () => {
    expect(iconName("Bunny")).toBe("Bunny icon");
    expect(iconName("Boss icon")).toBe("Boss icon");
    expect(iconName("Hard boss icon")).toBe("Hard boss icon");
  });
});
