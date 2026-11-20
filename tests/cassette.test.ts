import { describe, expect, it } from "vitest";
import { contrastRatio } from "../src/lib/color";
import { PROJECT_COLORS } from "../src/lib/projectColors";
import { TAPE_ART, counterText, ledFor, reelRadii, stripeFill } from "../src/lib/cassetteArt";

describe("reelRadii: tape winds from the left reel to the right as work gets done", () => {
  it("starts all on the left and ends all on the right", () => {
    const start = reelRadii(0);
    const end = reelRadii(1);
    expect(start.left).toBeGreaterThan(start.right);
    expect(end.right).toBeGreaterThan(end.left);
    expect(start.right).toBe(end.left); // the empty reel is the same size either way
  });

  it("is balanced halfway and always stays within the window", () => {
    const half = reelRadii(0.5);
    expect(half.left).toBeCloseTo(half.right, 5);
    for (const p of [0, 0.1, 0.5, 0.9, 1]) {
      const r = reelRadii(p);
      expect(r.left).toBeGreaterThanOrEqual(15);
      expect(r.left).toBeLessThanOrEqual(27);
      expect(r.right).toBeGreaterThanOrEqual(15);
      expect(r.right).toBeLessThanOrEqual(27);
    }
  });

  it("clamps silly progress values", () => {
    expect(reelRadii(-3)).toEqual(reelRadii(0));
    expect(reelRadii(7)).toEqual(reelRadii(1));
  });
});

describe("counterText", () => {
  it("is a three digit percentage", () => {
    expect(counterText(0)).toBe("000");
    expect(counterText(40)).toBe("040");
    expect(counterText(100)).toBe("100");
    expect(counterText(39.6)).toBe("040");
    expect(counterText(250)).toBe("100");
  });
});

describe("ledFor", () => {
  it("uses the skin's own status colours", () => {
    expect(ledFor("overdue")).toEqual({ color: "var(--danger)", label: "OVERDUE" });
    expect(ledFor("due-today").color).toBe("var(--warning)");
    expect(ledFor("due-soon").label).toBe("SOON");
    expect(ledFor("on-track")).toEqual({ color: "var(--success)", label: "PLAY" });
    expect(ledFor("done").label).toBe("DONE");
  });
});

describe("stripeFill: white text on the label stripe is always readable", () => {
  it("meets 4.5:1 for every palette colour and for the extremes", () => {
    for (const colour of [...PROJECT_COLORS, "#FFFFFF", "#FFFF00", "#FFE066", "#00FFFF", "#000000", "#475569", "#BE185D"]) {
      expect(contrastRatio(TAPE_ART.stripeText, stripeFill(colour)), colour).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the hue (it's the project colour, darkened) and copes with unreadable input", () => {
    expect(stripeFill("#1F8A8A")).toBe("#0e3e3e");
    expect(stripeFill("not a colour")).toBe(TAPE_ART.window);
  });
});

describe("the label paper", () => {
  it("has plenty of contrast between the ink and the paper, whatever the skin", () => {
    expect(contrastRatio(TAPE_ART.paperInk, TAPE_ART.paper)).toBeGreaterThanOrEqual(10);
  });

  it("keeps the status LED label readable on its dark plate", () => {
    expect(contrastRatio(TAPE_ART.stripeText, TAPE_ART.window)).toBeGreaterThanOrEqual(15);
  });
});
