import { describe, expect, it } from "vitest";
import { isSfxEnabled, setSfxEnabled, sfx } from "../src/lib/sfx";

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
