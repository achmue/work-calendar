import { describe, expect, it } from "vitest";
import { contrastRatio, isDarkColor, parseColor, toHex } from "../src/lib/color";

describe("parseColor", () => {
  it("reads hex in all four lengths", () => {
    expect(parseColor("#1F6B4F")).toEqual({ r: 31, g: 107, b: 79, a: 1 });
    expect(parseColor("#fa0")).toEqual({ r: 255, g: 170, b: 0, a: 1 });
    expect(parseColor("#FFFFFF80")?.a).toBeCloseTo(0.5, 1);
    expect(parseColor("#0f08")?.a).toBeCloseTo(0.533, 2);
  });

  it("reads rgb() with commas, spaces, percentages and alpha", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(parseColor("rgba(10, 20, 30, 0.5)")).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
    expect(parseColor("rgb(10 20 30 / 50%)")).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
    expect(parseColor("rgb(100%, 0%, 50%)")).toEqual({ r: 255, g: 0, b: 127.5, a: 1 });
  });

  it("reads hsl()", () => {
    expect(toHex(parseColor("hsl(120, 100%, 50%)")!)).toBe("#00ff00");
    expect(toHex(parseColor("hsl(0 0% 100%)")!)).toBe("#ffffff");
    expect(toHex(parseColor("hsla(240deg, 100%, 50%, 0.3)")!)).toBe("#0000ff");
    expect(toHex(parseColor("hsl(-120, 100%, 50%)")!)).toBe("#0000ff");
  });

  it("reads transparent and ignores surrounding space and case", () => {
    expect(parseColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor("  #ABCDEF ")).toEqual({ r: 171, g: 205, b: 239, a: 1 });
    expect(parseColor("RGB(1,2,3)")).toEqual({ r: 1, g: 2, b: 3, a: 1 });
  });

  it("rejects anything else, including attempts to sneak in CSS", () => {
    for (const bad of [
      "", "red", "#12", "#12345", "#ggg", "rgb(1,2)", "rgb(1,2,3,4,5)", "rgb(a,b,c)", "hsl(0, 50, 50)",
      "url(http://x)", "var(--bg)", "red; background: blue", "rgb(1,2,3); x", "rgb(rgb(1,2,3),0,0)",
      "#fff url(x)", "calc(1)", "expression(1)",
    ]) {
      expect(parseColor(bad), bad).toBeNull();
    }
  });

  it("clamps out-of-range channels", () => {
    expect(parseColor("rgb(300, -5, 0)")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });
});

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2); // the classic AA-passing grey
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2); // just under 4.5
  });

  it("doesn't depend on argument order and returns null for unreadable colours", () => {
    expect(contrastRatio("#123456", "#fedcba")).toBeCloseTo(contrastRatio("#fedcba", "#123456")!, 10);
    expect(contrastRatio("nope", "#fff")).toBeNull();
    expect(contrastRatio("#fff", "nope")).toBeNull();
  });
});

describe("isDarkColor", () => {
  it("tells dark backgrounds from light ones", () => {
    expect(isDarkColor("#111816")).toBe(true);
    expect(isDarkColor("#0B0716")).toBe(true);
    expect(isDarkColor("#F3F5F4")).toBe(false);
    expect(isDarkColor("#FBF6E9")).toBe(false);
    expect(isDarkColor("not a colour")).toBe(false);
  });
});
