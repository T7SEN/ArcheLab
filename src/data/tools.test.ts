import { describe, expect, it } from "vitest";
import { sitePages } from "./site-pages";
import { tools } from "./tools";

describe("tool registry", () => {
  it("has unique slugs and names", () => {
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(tools.length);
  });

  it("links every live tool to a page the navbar lists", () => {
    const pages = sitePages.map((page) => page.href);
    for (const tool of tools) {
      if (tool.status === "live") {
        expect(pages, tool.slug).toContain(tool.href);
        expect(tool.features.length, tool.slug).toBeGreaterThan(0);
      }
    }
  });

  it("gives every tool page a live tool card", () => {
    const toolHrefs = tools.flatMap((tool) =>
      tool.status === "live" ? [tool.href] : [],
    );
    for (const page of sitePages) {
      if (page.href.startsWith("/tools/")) {
        expect(toolHrefs, page.href).toContain(page.href);
      }
    }
  });
});
