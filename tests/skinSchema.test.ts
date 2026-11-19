import { describe, expect, it } from "vitest";
import { MAX_BG_IMAGE_LENGTH, sanitizeSkin } from "../src/lib/skinSchema";
import { cleanLight } from "../src/skins/presets";

const valid = { id: "mine", name: "Mine", version: 1, tokens: { ...cleanLight.tokens, accent: "#FF00AA" } };

describe("sanitizeSkin", () => {
  it("accepts a complete skin", () => {
    expect(sanitizeSkin(valid)).toEqual(valid);
  });

  it("fills missing tokens from Clean Light", () => {
    const skin = sanitizeSkin({ id: "tiny", name: "Tiny", version: 1, tokens: { accent: "#FF00AA" } });
    expect(skin?.tokens).toEqual({ ...cleanLight.tokens, accent: "#FF00AA" });
  });

  it("replaces wrong-typed, blank or oversized tokens with the default", () => {
    const skin = sanitizeSkin({
      ...valid,
      tokens: { ...valid.tokens, bg: 123, text: "   ", surface: "x".repeat(401), radius: null },
    });
    expect(skin?.tokens.bg).toBe(cleanLight.tokens.bg);
    expect(skin?.tokens.text).toBe(cleanLight.tokens.text);
    expect(skin?.tokens.surface).toBe(cleanLight.tokens.surface);
    expect(skin?.tokens.radius).toBe(cleanLight.tokens.radius);
  });

  it("only allows the known border styles, patterns and densities", () => {
    const skin = sanitizeSkin({
      ...valid,
      tokens: { ...valid.tokens, borderStyle: "wavy", bgPattern: "stripes", density: "huge" },
    });
    expect(skin?.tokens.borderStyle).toBe("solid");
    expect(skin?.tokens.bgPattern).toBe("none");
    expect(skin?.tokens.density).toBe("comfortable");

    const retro = sanitizeSkin({ ...valid, tokens: { ...valid.tokens, borderStyle: "outset", bgPattern: "scanlines", density: "compact" } });
    expect(retro?.tokens).toMatchObject({ borderStyle: "outset", bgPattern: "scanlines", density: "compact" });
  });

  it("keeps a reasonably sized background image and drops an oversized one", () => {
    const small = sanitizeSkin({ ...valid, tokens: { ...valid.tokens, bgImage: "data:image/png;base64,AAAA" } });
    expect(small?.tokens.bgImage).toBe("data:image/png;base64,AAAA");

    const huge = sanitizeSkin({ ...valid, tokens: { ...valid.tokens, bgImage: "x".repeat(MAX_BG_IMAGE_LENGTH + 1) } });
    expect(huge?.tokens.bgImage).toBeUndefined();
  });

  it("ignores extra fields (skins are data only)", () => {
    const skin = sanitizeSkin({ ...valid, css: "body{display:none}", tokens: { ...valid.tokens, extra: "x" } });
    expect(skin).toEqual(valid);
  });

  it("rejects things that aren't skins", () => {
    for (const bad of [
      null, undefined, 42, "skin", [], {},
      { ...valid, id: "" },
      { ...valid, id: 5 },
      { ...valid, name: "  " },
      { ...valid, version: 2 },
      { ...valid, version: undefined },
      { ...valid, tokens: undefined },
      { ...valid, tokens: [] },
    ]) {
      expect(sanitizeSkin(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it("keeps an author only when it's a real string", () => {
    expect(sanitizeSkin({ ...valid, author: "  Sam " })?.author).toBe("Sam");
    expect(sanitizeSkin({ ...valid, author: 5 })).not.toHaveProperty("author");
    expect(sanitizeSkin({ ...valid, author: "" })).not.toHaveProperty("author");
  });
});
