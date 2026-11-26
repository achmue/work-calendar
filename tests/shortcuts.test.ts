import { describe, expect, it } from "vitest";
import { SHORTCUT_LIST, shortcutFor } from "../src/lib/shortcuts";

describe("shortcutFor", () => {
  it("maps the keys to actions", () => {
    const action = (key: string) => shortcutFor({ key }, false);
    expect(action("ArrowLeft")).toBe("prev-month");
    expect(action("ArrowRight")).toBe("next-month");
    expect(action("t")).toBe("today");
    expect(action("T")).toBe("today");
    expect(action("1")).toBe("calendar");
    expect(action("2")).toBe("timeline");
    expect(action("3")).toBe("projects");
    expect(action("n")).toBe("new-project");
    expect(action("N")).toBe("new-project");
    expect(action("?")).toBe("help");
  });

  it("ignores every other key", () => {
    for (const key of ["a", "Enter", "Escape", " ", "Tab", "ArrowUp", "ArrowDown", "4", "0", "x", "F5"]) {
      expect(shortcutFor({ key }, false), key).toBeNull();
    }
  });

  it("does nothing while you're typing, so letters and digits reach the field", () => {
    for (const key of ["t", "n", "1", "2", "3", "?", "ArrowLeft", "ArrowRight"]) {
      expect(shortcutFor({ key }, true), key).toBeNull();
    }
  });

  it("leaves browser shortcuts alone when a modifier is held", () => {
    expect(shortcutFor({ key: "t", ctrlKey: true }, false)).toBeNull(); // new tab
    expect(shortcutFor({ key: "n", ctrlKey: true }, false)).toBeNull(); // new window
    expect(shortcutFor({ key: "ArrowLeft", altKey: true }, false)).toBeNull(); // browser back
    expect(shortcutFor({ key: "1", metaKey: true }, false)).toBeNull();
  });

  it("lists a help line for every shortcut", () => {
    expect(SHORTCUT_LIST.length).toBe(5);
    expect(SHORTCUT_LIST.every((s) => s.keys !== "" && s.label !== "")).toBe(true);
  });
});
