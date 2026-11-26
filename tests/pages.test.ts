import { describe, expect, it } from "vitest";
import { HOME_PAGE, PAGES, isPlainClick, pageFromPath, pagePath } from "../src/lib/pages";
import { SHORTCUT_LIST, shortcutFor } from "../src/lib/shortcuts";

describe("page addresses", () => {
  it("gives every page its own address, and reads it back", () => {
    expect(PAGES.map((p) => pagePath(p.id, "/"))).toEqual(["/calendar", "/timeline", "/projects"]);
    for (const base of ["/", "/work-calendar/", "/work-calendar"]) {
      for (const page of PAGES) expect(pageFromPath(pagePath(page.id, base), base), base + page.id).toBe(page.id);
    }
  });

  it("doesn't mind a trailing slash or capitals", () => {
    expect(pageFromPath("/timeline/", "/")).toBe("timeline");
    expect(pageFromPath("/Projects", "/")).toBe("projects");
  });

  it("knows an address that isn't a page", () => {
    for (const path of ["/", "", "/nothing", "/timeline/extra", "/calendarx"]) expect(pageFromPath(path, "/"), path).toBeNull();
    expect(pageFromPath("/timeline", "/work-calendar/")).toBeNull();
    expect(pageFromPath("/work-calendar", "/work-calendar/")).toBeNull();
  });

  it("has a home page, unique ids that work as addresses, and a number key for each", () => {
    expect(PAGES.map((p) => p.id)).toContain(HOME_PAGE);
    expect(new Set(PAGES.map((p) => p.id)).size).toBe(PAGES.length);
    for (const page of PAGES) expect(page.id).toMatch(/^[a-z0-9-]+$/);
    expect(PAGES.map((_, i) => shortcutFor({ key: String(i + 1) }, false))).toEqual(PAGES.map((p) => p.id));
    expect(SHORTCUT_LIST.find((s) => s.label.includes("Timeline"))?.label).toBe("Calendar / Timeline / Projects");
  });
});

describe("clicking a tab", () => {
  it("is handled by the app for an ordinary click only", () => {
    expect(isPlainClick({ button: 0 })).toBe(true);
    for (const other of [{ button: 1 }, { button: 0, ctrlKey: true }, { button: 0, metaKey: true }, { button: 0, shiftKey: true }, { button: 0, altKey: true }]) {
      expect(isPlainClick(other), JSON.stringify(other)).toBe(false);
    }
  });
});
