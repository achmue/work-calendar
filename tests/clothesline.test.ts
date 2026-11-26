import { describe, expect, it } from "vitest";
import { linePage, sagAt, tagSlots } from "../src/lib/clothesline";

describe("tagSlots", () => {
  it("counts whole tags that fit, allowing for the gaps between them", () => {
    expect(tagSlots(560, 84, 6)).toBe(6);
    expect(tagSlots(84 * 3 + 12, 84, 6)).toBe(3);
    expect(tagSlots(84 * 3 + 11, 84, 6)).toBe(2);
  });

  it("never drops below two, even before the width is known", () => {
    expect(tagSlots(0, 84, 6)).toBe(2);
    expect(tagSlots(50, 84, 6)).toBe(2);
    expect(tagSlots(500, 0, 6)).toBe(2);
  });
});

describe("linePage", () => {
  it("shows everything when it fits", () => {
    expect(linePage(4, 6, 0)).toEqual({ start: 0, end: 4, rest: 0, page: 0, pages: 1 });
    expect(linePage(6, 6, 3)).toEqual({ start: 0, end: 6, rest: 0, page: 0, pages: 1 });
  });

  it("keeps a slot for 'more' and moves on a page at a time", () => {
    expect(linePage(9, 6, 0)).toEqual({ start: 0, end: 5, rest: 4, page: 0, pages: 2 });
    expect(linePage(9, 6, 1)).toEqual({ start: 5, end: 9, rest: 0, page: 1, pages: 2 });
  });

  it("goes back to the start after the last page, and copes when the list gets shorter", () => {
    expect(linePage(9, 6, 2).start).toBe(0);
    expect(linePage(7, 4, 5)).toEqual({ start: 6, end: 7, rest: 0, page: 2, pages: 3 });
  });
});

describe("sagAt", () => {
  it("hangs lowest in the middle and evenly on both sides", () => {
    expect(sagAt(2, 5)).toBe(1);
    expect(sagAt(0, 5)).toBeCloseTo(sagAt(4, 5));
    expect(sagAt(0, 5)).toBeLessThan(sagAt(1, 5));
    expect(sagAt(0, 1)).toBe(1);
  });
});
