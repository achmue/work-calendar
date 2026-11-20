import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flashLcd, getLcdMessage, subscribeLcd } from "../src/lib/lcdMessage";
import { isSfxEnabled, setSfxEnabled, sfx } from "../src/lib/sfx";
import { VU_MAX_ANGLE, VU_MIN_ANGLE, polar, vuAngle } from "../src/lib/vu";

describe("vuAngle: the needle", () => {
  it("rests at the left, points straight up halfway, and pegs at the right", () => {
    expect(vuAngle(0)).toBe(VU_MIN_ANGLE);
    expect(vuAngle(5)).toBe(0);
    expect(vuAngle(10)).toBe(VU_MAX_ANGLE);
  });

  it("never swings past either end, and copes with odd input", () => {
    expect(vuAngle(-4)).toBe(VU_MIN_ANGLE);
    expect(vuAngle(99)).toBe(VU_MAX_ANGLE);
    expect(vuAngle(3, 0)).toBe(VU_MIN_ANGLE);
    expect(vuAngle(7, 14)).toBe(0);
  });

  it("moves steadily with the value", () => {
    const angles = [0, 2, 4, 6, 8, 10].map((v) => vuAngle(v));
    for (let i = 1; i < angles.length; i++) expect(angles[i]!).toBeGreaterThan(angles[i - 1]!);
  });
});

describe("polar", () => {
  it("measures angles from straight up, clockwise", () => {
    const up = polar(50, 50, 10, 0);
    expect(up.x).toBeCloseTo(50);
    expect(up.y).toBeCloseTo(40);
    const right = polar(50, 50, 10, 90);
    expect(right.x).toBeCloseTo(60);
    expect(right.y).toBeCloseTo(50);
    expect(polar(50, 50, 10, -90).x).toBeCloseTo(40);
  });
});

describe("LCD messages", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows a message, tells listeners, and clears itself", () => {
    const heard = vi.fn();
    const stop = subscribeLcd(heard);
    flashLcd("TRACK DONE", 1000);
    expect(getLcdMessage()?.text).toBe("TRACK DONE");
    expect(heard).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1001);
    expect(getLcdMessage()).toBeNull();
    expect(heard).toHaveBeenCalledTimes(2);
    stop();
  });

  it("a newer message replaces the old one and restarts the timer", () => {
    flashLcd("ONE", 1000);
    const first = getLcdMessage();
    vi.advanceTimersByTime(800);
    flashLcd("TWO", 1000);
    expect(getLcdMessage()?.text).toBe("TWO");
    expect(getLcdMessage()?.id).not.toBe(first?.id);
    vi.advanceTimersByTime(800); // 1600 since the first message, but only 800 since the second
    expect(getLcdMessage()?.text).toBe("TWO");
    vi.advanceTimersByTime(300);
    expect(getLcdMessage()).toBeNull();
  });

  it("stops telling listeners after they unsubscribe", () => {
    const heard = vi.fn();
    subscribeLcd(heard)();
    flashLcd("QUIET", 100);
    expect(heard).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
  });
});

describe("sound effects", () => {
  it("are off by default and can be switched", () => {
    expect(isSfxEnabled()).toBe(false);
    setSfxEnabled(true);
    expect(isSfxEnabled()).toBe(true);
    setSfxEnabled(false);
  });

  it("never throw, even where there's no audio (like this test environment)", () => {
    setSfxEnabled(true);
    expect(() => Object.values(sfx).forEach((play) => play())).not.toThrow();
    setSfxEnabled(false);
  });
});
