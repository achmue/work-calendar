import { describe, expect, it } from "vitest";
import { contrastRatio, parseColor } from "../src/lib/color";
import { FONT_OPTIONS, fontStack, googleFontsUrl, isAllowedFontStack } from "../src/lib/fonts";
import { sanitizeSkin } from "../src/lib/skinSchema";
import { DEFAULT_SKIN, isBuiltInSkin, presets } from "../src/skins/presets";
import { applySkin, skinCssVars, type SkinTarget } from "../src/state/useSkin";
import type { Skin } from "../src/types";

const COLOR_TOKENS = [
  "bg", "surface", "surfaceAlt", "text", "textMuted", "border",
  "accent", "accentText", "danger", "warning", "success",
] as const;

describe("built-in skins", () => {
  it("has the five required presets with unique ids and names", () => {
    expect(presets.map((p) => p.name)).toEqual([
      "Clean Light", "Clean Dark", "Retro Player", "Paper Notebook", "Neon Night",
    ]);
    expect(new Set(presets.map((p) => p.id)).size).toBe(5);
    expect(DEFAULT_SKIN.id).toBe("clean-light");
    expect(presets.every((p) => isBuiltInSkin(p.id))).toBe(true);
    expect(isBuiltInSkin("someone-elses-skin")).toBe(false);
  });

  for (const skin of presets) {
    describe(skin.name, () => {
      it("is a valid skin, unchanged by validation", () => {
        expect(sanitizeSkin(skin)).toEqual(skin);
      });

      it("uses readable colours and allowed fonts", () => {
        for (const key of COLOR_TOKENS) expect(parseColor(skin.tokens[key]), key).not.toBeNull();
        for (const key of ["fontBody", "fontDisplay", "fontMono"] as const) {
          expect(isAllowedFontStack(skin.tokens[key]), key).toBe(true);
        }
        expect(skin.tokens.fontSize).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
        expect(skin.tokens.radius).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
        expect(skin.tokens.borderWidth).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
      });

      // CLAUDE.md 7.5: WCAG AA is 4.5:1 for these three pairs. Our own skins should pass.
      it("meets WCAG AA for the pairs the skin editor checks", () => {
        const t = skin.tokens;
        expect(contrastRatio(t.text, t.bg), "text on bg").toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(t.text, t.surface), "text on surface").toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(t.accentText, t.accent), "accentText on accent").toBeGreaterThanOrEqual(4.5);
      });

      // The keyboard focus ring and progress/marker shapes use the accent colour. WCAG 2.2 asks 3:1
      // for visual indicators like these, against whatever they sit on.
      it("keeps the accent visible (3:1) against the page and the panels, so focus rings can be seen", () => {
        const t = skin.tokens;
        for (const [name, bg] of [["bg", t.bg], ["surface", t.surface], ["surfaceAlt", t.surfaceAlt]] as const) {
          expect(contrastRatio(t.accent, bg), `accent on ${name}`).toBeGreaterThanOrEqual(3);
        }
      });

      it("keeps the other text colours readable on the panels they sit on", () => {
        const t = skin.tokens;
        for (const [name, colour] of [
          ["textMuted", t.textMuted], ["danger", t.danger], ["warning", t.warning], ["success", t.success], ["accent", t.accent],
        ] as const) {
          for (const [bgName, bg] of [["surface", t.surface], ["surfaceAlt", t.surfaceAlt]] as const) {
            expect(contrastRatio(colour, bg), `${name} on ${bgName}`).toBeGreaterThanOrEqual(4.5);
          }
        }
        expect(contrastRatio(t.textMuted, t.bg), "textMuted on bg").toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(t.surface, t.danger), "button text on danger").toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  it("Retro Player is square and bevelled with scanlines; Paper Notebook has ruled lines", () => {
    const retro = presets.find((p) => p.id === "retro-player")!;
    expect(retro.tokens).toMatchObject({ radius: "0px", borderStyle: "outset", bgPattern: "scanlines" });
    const paper = presets.find((p) => p.id === "paper-notebook")!;
    expect(paper.tokens.bgPattern).toBe("lines");
    const neon = presets.find((p) => p.id === "neon-night")!;
    expect(neon.tokens.shadow).toMatch(/^0 0 \d+px/); // a glow, not a drop shadow
  });
});

describe("fonts", () => {
  it("has unique ids and stacks", () => {
    expect(new Set(FONT_OPTIONS.map((f) => f.id)).size).toBe(FONT_OPTIONS.length);
    expect(new Set(FONT_OPTIONS.map((f) => f.stack)).size).toBe(FONT_OPTIONS.length);
  });

  it("only allows exact stacks from the list", () => {
    expect(isAllowedFontStack(fontStack("caveat"))).toBe(true);
    expect(isAllowedFontStack("Caveat")).toBe(false);
    expect(isAllowedFontStack("x; background: url(http://evil)")).toBe(false);
    expect(() => fontStack("nope")).toThrow();
  });

  it("builds one Google Fonts URL from the families in use, and none for system fonts", () => {
    const url = googleFontsUrl([fontStack("caveat"), fontStack("patrick-hand"), fontStack("caveat"), fontStack("system-sans")]);
    expect(url).toBe("https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Patrick+Hand&display=swap");
    expect(googleFontsUrl([fontStack("system-sans"), fontStack("verdana")])).toBeNull();
    expect(googleFontsUrl(["not a font"])).toBeNull();
  });
});

describe("skinCssVars / applySkin", () => {
  const dark = presets.find((p) => p.id === "clean-dark")!;
  const light = presets.find((p) => p.id === "clean-light")!;

  it("turns every token into a CSS variable, leaving pattern and density to data attributes", () => {
    const vars = skinCssVars(light);
    expect(vars["--surface-alt"]).toBe(light.tokens.surfaceAlt);
    expect(vars["--border-style"]).toBe("solid");
    expect(vars["--bg-image"]).toBe("none");
    expect(Object.keys(vars).some((k) => /pattern|density/.test(k))).toBe(false);
  });

  it("matches native controls to the skin: color-scheme follows how dark the background is", () => {
    expect(skinCssVars(dark)["color-scheme"]).toBe("dark");
    expect(skinCssVars(light)["color-scheme"]).toBe("light");
  });

  it("sets pattern, density and border style on the page", () => {
    const retro = presets.find((p) => p.id === "retro-player")!;
    const root: SkinTarget = { style: { setProperty: () => {} }, dataset: {} };
    applySkin(retro, root);
    expect(root.dataset).toMatchObject({ pattern: "scanlines", density: "compact", borderStyle: "outset" });
  });

  it("only passes a background image through if it's an inline raster image", () => {
    const withImage = (bgImage: string): Skin => ({ ...light, tokens: { ...light.tokens, bgImage } });
    expect(skinCssVars(withImage("data:image/webp;base64,AAAA"))["--bg-image"]).toBe('url("data:image/webp;base64,AAAA")');
    expect(skinCssVars(withImage("javascript:alert(1)"))["--bg-image"]).toBe("none");
  });
});
