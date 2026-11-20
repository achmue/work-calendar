import { describe, expect, it } from "vitest";
import { clockText, dayProgress } from "../src/lib/dayProgress";
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

describe("dayProgress", () => {
  const at = (h: number, m = 0) => new Date(2026, 10, 20, h, m, 0);

  it("is empty before 9:00 and full after 17:00", () => {
    expect(dayProgress(at(6))).toBe(0);
    expect(dayProgress(at(9))).toBe(0);
    expect(dayProgress(at(17))).toBe(1);
    expect(dayProgress(at(22, 30))).toBe(1);
  });

  it("fills steadily through the day", () => {
    expect(dayProgress(at(13))).toBeCloseTo(0.5, 5);
    expect(dayProgress(at(11))).toBeCloseTo(0.25, 5);
    expect(dayProgress(at(15))).toBeCloseTo(0.75, 5);
    expect(dayProgress(at(10, 30))).toBeCloseTo(0.1875, 5);
  });

  it("can use different working hours", () => {
    expect(dayProgress(at(12), 8, 16)).toBeCloseTo(0.5, 5);
    expect(dayProgress(at(7), 8, 16)).toBe(0);
  });
});

describe("clockText", () => {
  it("is a padded 24-hour time", () => {
    expect(clockText(new Date(2026, 10, 20, 9, 5))).toBe("09:05");
    expect(clockText(new Date(2026, 10, 20, 0, 0))).toBe("00:00");
    expect(clockText(new Date(2026, 10, 20, 23, 59))).toBe("23:59");
  });
});
