import { describe, expect, it } from "vitest";
import { contrastRatio, parseColor } from "../src/lib/color";
import { FONT_OPTIONS, fontStack, googleFontsUrl, isAllowedFontStack } from "../src/lib/fonts";
import { checkSkin, sanitizeSkin } from "../src/lib/skinSchema";
import {
  DEFAULT_SKIN,
  FIRST_RUN_SKIN,
  SYSTEM_DARK_SKIN,
  SYSTEM_LIGHT_SKIN,
  boombox,
  cleanLight,
  corkBoard,
  isBuiltInSkin,
  portableSilver,
  presets,
} from "../src/skins/presets";
import { applySkin, skinCssVars, type SkinTarget } from "../src/state/useSkin";
import type { Skin } from "../src/types";

const COLOR_TOKENS = [
  "bg", "surface", "surfaceAlt", "text", "textMuted", "border",
  "accent", "accentText", "danger", "warning", "success",
] as const;

describe("built-in skins", () => {
  it("offers Cork Board, Portable Silver and Boombox, and nothing else", () => {
    expect(presets.map((p) => p.name)).toEqual(["Cork Board", "Portable Silver", "Boombox"]);
    expect(presets.map((p) => p.id)).toEqual(["cork-board", "portable-silver", "boombox"]);
    expect(presets.every((p) => isBuiltInSkin(p.id))).toBe(true);
    expect(isBuiltInSkin("clean-light")).toBe(false); // the plain base isn't a choice
    expect(isBuiltInSkin("someone-elses-skin")).toBe(false);
  });

  it("uses Cork Board for new visitors and as the fallback, and pairs it with Boombox for light/dark", () => {
    expect(FIRST_RUN_SKIN).toBe(corkBoard);
    expect(DEFAULT_SKIN).toBe(corkBoard);
    expect(SYSTEM_LIGHT_SKIN).toBe(corkBoard);
    expect(SYSTEM_DARK_SKIN).toBe(boombox);
  });

  it("keeps the plain base skin to fill in anything a skin leaves out", () => {
    expect(cleanLight.tokens.layout).toBe("tape");
    expect(checkSkin({ id: "x", name: "X", version: 1, tokens: {} }).skin?.tokens.surface).toBe(cleanLight.tokens.surface);
  });

  for (const skin of presets) {
    describe(skin.name, () => {
      it("is a valid skin, unchanged by validation", () => {
        expect(sanitizeSkin(skin)).toEqual(skin);
        expect(checkSkin(skin).problems).toEqual([]);
      });

      it("uses readable colours and allowed fonts", () => {
        for (const key of COLOR_TOKENS) expect(parseColor(skin.tokens[key]), key).not.toBeNull();
        for (const key of ["fontBody", "fontDisplay", "fontMono"] as const) {
          expect(isAllowedFontStack(skin.tokens[key]), key).toBe(true);
        }
        for (const key of ["fontSize", "radius", "borderWidth"] as const) {
          expect(skin.tokens[key]).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
        }
      });

      it("says which layout it is; a tape deck also has an LCD that stays readable", () => {
        expect(skin.tokens.layout).toBe(skin === corkBoard ? "cork" : "tape");
        if (skin.tokens.layout !== "tape") return;
        expect(parseColor(skin.tokens.lcdBg ?? "")).not.toBeNull();
        expect(contrastRatio(skin.tokens.lcdText ?? "", skin.tokens.lcdBg ?? "")).toBeGreaterThanOrEqual(4.5);
      });

      // CLAUDE.md 7.5: WCAG AA is 4.5:1 for these three pairs.
      it("meets WCAG AA for the pairs the skin editor checks", () => {
        const t = skin.tokens;
        expect(contrastRatio(t.text, t.bg), "text on bg").toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(t.text, t.surface), "text on surface").toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(t.accentText, t.accent), "accentText on accent").toBeGreaterThanOrEqual(4.5);
      });

      // The keyboard focus ring uses the accent colour; WCAG 2.2 asks 3:1 for visual indicators.
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

  it("Boombox is the dark partner, with an amber display", () => {
    expect(contrastRatio(boombox.tokens.text, boombox.tokens.bg)).toBeGreaterThan(10);
    expect(boombox.tokens.lcdText).toBe("#FFB84A");
    expect(portableSilver.tokens.lcdBg).toBe("#B5C79A");
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
  it("turns every token into a CSS variable, leaving pattern, density and the look to data attributes", () => {
    const vars = skinCssVars(portableSilver);
    expect(vars["--surface-alt"]).toBe(portableSilver.tokens.surfaceAlt);
    expect(vars["--border-style"]).toBe("solid");
    expect(vars["--bg-image"]).toBe("none");
    expect(vars["--lcd-bg"]).toBe("#B5C79A");
    expect(Object.keys(vars).some((k) => /pattern|density|layout/.test(k))).toBe(false);
  });

  it("gives a skin with no LCD colours a sensible display (panel colour, accent text)", () => {
    const vars = skinCssVars(cleanLight);
    expect(vars["--lcd-bg"]).toBe(cleanLight.tokens.surfaceAlt);
    expect(vars["--lcd-text"]).toBe(cleanLight.tokens.accent);
  });

  it("matches native controls to the skin: color-scheme follows how dark the background is", () => {
    expect(skinCssVars(boombox)["color-scheme"]).toBe("dark");
    expect(skinCssVars(portableSilver)["color-scheme"]).toBe("light");
  });

  it("sets pattern, density, border style and the layout on the page", () => {
    const root: SkinTarget = { style: { setProperty: () => {} }, dataset: {} };
    applySkin(portableSilver, root);
    expect(root.dataset).toMatchObject({ pattern: "none", density: "comfortable", borderStyle: "solid", layout: "tape" });
    applySkin(cleanLight, root);
    expect(root.dataset.layout).toBe("tape");
  });

  it("only passes a background image through if it's an inline raster image", () => {
    const withImage = (bgImage: string): Skin => ({ ...portableSilver, tokens: { ...portableSilver.tokens, bgImage } });
    expect(skinCssVars(withImage("data:image/webp;base64,AAAA"))["--bg-image"]).toBe('url("data:image/webp;base64,AAAA")');
    expect(skinCssVars(withImage("javascript:alert(1)"))["--bg-image"]).toBe("none");
  });
});
