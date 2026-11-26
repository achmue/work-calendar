import { describe, expect, it } from "vitest";
import { skinContrastChecks } from "../src/lib/color";
import { MAX_IMAGE_BYTES, checkImageFile } from "../src/lib/files";
import { SHADOW_PRESET_ORDER, detectShadowPreset, shadowFor } from "../src/lib/shadows";
import { isSafeImageDataUrl } from "../src/lib/skinSchema";
import { boombox, cleanLight, portableSilver } from "../src/skins/presets";
import { choiceWithoutSkin } from "../src/state/useSkin";

describe("skinContrastChecks", () => {
  it("passes a good skin on all three pairs (a cork skin has no LCD to check)", () => {
    const checks = skinContrastChecks({ ...cleanLight.tokens, layout: "cork" });
    expect(checks.map((c) => c.label)).toEqual([
      "Text on the page background", "Text on panels", "Text on accent buttons",
    ]);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("flags pairs below 4.5:1 and reports the ratio", () => {
    const checks = skinContrastChecks({ ...cleanLight.tokens, layout: "cork", text: "#999999", accentText: "#2F8F66" });
    expect(checks.map((c) => c.ok)).toEqual([false, false, false]);
    expect(checks[0]?.ratio).toBeGreaterThan(1);
    expect(checks[0]?.ratio).toBeLessThan(4.5);
  });

  it("treats a colour it can't read as a failure, not a crash", () => {
    const checks = skinContrastChecks({ ...cleanLight.tokens, bg: "banana" });
    expect(checks[0]).toMatchObject({ ratio: null, ok: false });
  });

  it("adds an LCD check for tape skins only", () => {
    expect(skinContrastChecks({ ...cleanLight.tokens, layout: "cork" })).toHaveLength(3);
    for (const skin of [portableSilver, boombox]) {
      const checks = skinContrastChecks(skin.tokens);
      expect(checks).toHaveLength(4);
      expect(checks[3]?.label).toBe("Text on the LCD display");
      expect(checks.every((c) => c.ok), skin.name).toBe(true);
    }
    const bad = skinContrastChecks({ ...portableSilver.tokens, lcdText: "#B5C79A" });
    expect(bad[3]).toMatchObject({ ok: false });
  });

  it("falls back to the panel colours when a tape skin leaves the LCD colours out", () => {
    const { lcdBg: _a, lcdText: _b, ...rest } = portableSilver.tokens;
    expect(skinContrastChecks(rest)[3]?.label).toBe("Text on the LCD display");
  });

  it("works for dark skins too", () => {
    expect(skinContrastChecks(boombox.tokens).every((c) => c.ok)).toBe(true);
  });
});

describe("shadow presets", () => {
  it("makes a glow from the accent colour", () => {
    expect(shadowFor("glow", "#FF3DDB")).toBe("0 0 14px rgba(255, 61, 219, 0.45)");
    expect(shadowFor("glow", "rgb(10, 20, 30)")).toBe("0 0 14px rgba(10, 20, 30, 0.45)");
    expect(shadowFor("glow", "garbage")).toMatch(/^0 0 14px rgba\(128, 128, 128/);
    expect(shadowFor("none", "#fff")).toBe("none");
  });

  it("recognises each preset again and calls anything else custom", () => {
    for (const preset of SHADOW_PRESET_ORDER) {
      expect(detectShadowPreset(shadowFor(preset, "#123456"), "#123456")).toBe(preset);
    }
    expect(detectShadowPreset("0 0 99px red", "#123456")).toBeNull();
    // A glow made for another accent isn't this accent's glow
    expect(detectShadowPreset(shadowFor("glow", "#FF0000"), "#00FF00")).toBeNull();
  });
});

describe("background image upload rules", () => {
  it("accepts small PNG, JPEG, WebP and GIF files", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
      expect(checkImageFile({ type, size: 1000 })).toBeNull();
    }
    expect(checkImageFile({ type: "image/png", size: MAX_IMAGE_BYTES })).toBeNull();
  });

  it("rejects other types, including SVG, which can carry script", () => {
    for (const type of ["image/svg+xml", "text/html", "application/pdf", ""]) {
      expect(checkImageFile({ type, size: 1000 }), type).toMatch(/PNG, JPEG, WebP or GIF/);
    }
  });

  it("rejects files over 500 KB with a clear message", () => {
    expect(checkImageFile({ type: "image/png", size: MAX_IMAGE_BYTES + 1 })).toMatch(/under 500 KB/);
  });

  it("only treats inline raster data URLs as safe", () => {
    expect(isSafeImageDataUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    expect(isSafeImageDataUrl("data:image/jpeg;base64,/9j/4AAQ+Zz==")).toBe(true);
    for (const bad of [
      "https://example.com/a.png",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "data:text/html;base64,PHNjcmlwdD4=",
      "data:image/png;charset=utf-8,<script>",
      'data:image/png;base64,AAAA")',
      "data:image/png;base64,AAAA\nbackground:red",
      "javascript:alert(1)",
      "",
    ]) {
      expect(isSafeImageDataUrl(bad), bad).toBe(false);
    }
    expect(isSafeImageDataUrl("data:image/png;base64," + "A".repeat(700_001))).toBe(false);
  });
});

describe("choiceWithoutSkin", () => {
  it("sends a fixed choice back to Portable Silver when its skin is deleted", () => {
    expect(choiceWithoutSkin({ mode: "fixed", id: "mine" }, "mine")).toEqual({ mode: "fixed", id: "portable-silver" });
    const other = { mode: "fixed", id: "keep" } as const;
    expect(choiceWithoutSkin(other, "mine")).toBe(other);
  });

  it("repairs only the light or dark slot that used the deleted skin", () => {
    expect(choiceWithoutSkin({ mode: "system", lightId: "mine", darkId: "neon-night" }, "mine")).toEqual({
      mode: "system", lightId: "portable-silver", darkId: "neon-night",
    });
    expect(choiceWithoutSkin({ mode: "system", lightId: "paper-notebook", darkId: "mine" }, "mine")).toEqual({
      mode: "system", lightId: "paper-notebook", darkId: "boombox",
    });
  });
});
