import { describe, expect, it } from "vitest";
import { yarnPath, yarnTarget } from "../src/lib/yarn";

const projects = [
  { id: "late", deadline: "2026-11-12" },
  { id: "next", deadline: "2026-11-25" },
  { id: "later", deadline: "2026-12-04" },
];
const all = new Set(["late", "next", "later"]);

describe("yarnTarget", () => {
  it("ties the next deadline coming up", () => {
    expect(yarnTarget(projects, all, "2026-11-20", null)).toBe("next");
  });

  it("follows the card being pointed at, if its pin is on the wall", () => {
    expect(yarnTarget(projects, all, "2026-11-20", "late")).toBe("late");
    expect(yarnTarget(projects, new Set(["next"]), "2026-11-20", "later")).toBe("next");
  });

  it("falls back to the most recently missed one, and to nothing without pins", () => {
    expect(yarnTarget(projects, new Set(["late"]), "2026-11-20", null)).toBe("late");
    expect(yarnTarget(projects, new Set(), "2026-11-20", "next")).toBeNull();
  });
});

describe("yarnPath", () => {
  it("starts and ends on the pins and sags below the lower one", () => {
    const path = yarnPath({ x: 900, y: 120 }, { x: 360, y: 620 });
    expect(path.startsWith("M900,120 Q630,")).toBe(true);
    expect(path.endsWith(" 360,620")).toBe(true);
    expect(Number(path.split("Q630,")[1]?.split(" ")[0])).toBeGreaterThan(620);
  });
});
