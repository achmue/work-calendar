import { describe, expect, it } from "vitest";
import { contrastRatio, parseColor, skinContrastChecks } from "../src/lib/color";
import { FONT_OPTIONS, fontStack, googleFontsUrl, isAllowedFontStack } from "../src/lib/fonts";
import { DEFAULT_FRAME } from "../src/lib/materials";
import { checkSkin, sanitizeSkin } from "../src/lib/skinSchema";
import {
  DEFAULT_SKIN,
  FIRST_RUN_SKIN,
  SYSTEM_DARK_SKIN,
  SYSTEM_LIGHT_SKIN,
  cleanLight,
  corkBoard,
  isBuiltInSkin,
  nightCork,
  presets,
} from "../src/skins/presets";
import { applySkin, skinCssVars, type SkinTarget } from "../src/state/useSkin";
import type { Skin } from "../src/types";

const COLOR_TOKENS = [
  "bg", "surface", "surfaceAlt", "text", "textMuted", "border",
  "accent", "accentText", "danger", "warning", "success",
] as const;

describe("built-in skins", () => {
  it("offers two cork boards, and nothing else", () => {
    expect(presets.map((p) => p.name)).toEqual(["Cork Board", "Night Cork"]);
    expect(presets.map((p) => p.id)).toEqual(["cork-board", "night-cork"]);
    expect(presets.every((p) => isBuiltInSkin(p.id))).toBe(true);
    expect(isBuiltInSkin("clean-light")).toBe(false); // the plain base isn't a choice
    expect(isBuiltInSkin("boombox")).toBe(false); // the tape deck skins live on the master branch
  });

  it("uses Cork Board for new visitors and as the fallback, and pairs it with Night Cork for light/dark", () => {
    expect(FIRST_RUN_SKIN).toBe(corkBoard);
    expect(DEFAULT_SKIN).toBe(corkBoard);
    expect(SYSTEM_LIGHT_SKIN).toBe(corkBoard);
    expect(SYSTEM_DARK_SKIN).toBe(nightCork);
  });

  it("keeps the plain base skin to fill in anything a skin leaves out", () => {
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

      it("has a board colour, a frame and the cork texture", () => {
        expect(parseColor(skin.tokens.frame ?? "")).not.toBeNull();
        expect(skin.tokens.bgPattern).toBe("cork");
      });

      // CLAUDE.md 7.5: WCAG AA is 4.5:1 for these three pairs.
      it("meets WCAG AA for the pairs the skin editor checks", () => {
        for (const check of skinContrastChecks(skin.tokens)) expect(check.ok, `${check.label}: ${check.ratio}`).toBe(true);
      });

      // The accent marks today and the buttons, always on paper; WCAG 2.2 asks 3:1 for such indicators.
      it("keeps the accent visible (3:1) against both papers", () => {
        const t = skin.tokens;
        for (const [name, bg] of [["surface", t.surface], ["surfaceAlt", t.surfaceAlt]] as const) {
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
        expect(contrastRatio(t.surface, t.danger), "button text on danger").toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  it("Night Cork is the dark partner: pale ink on dark paper, on a darker board", () => {
    expect(contrastRatio(nightCork.tokens.text, nightCork.tokens.surface)).toBeGreaterThan(10);
    expect(contrastRatio(corkBoard.tokens.bg, nightCork.tokens.bg)).toBeGreaterThan(2);
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
  it("turns every token into a CSS variable, leaving pattern and density to data attributes", () => {
    const vars = skinCssVars(corkBoard);
    expect(vars["--surface-alt"]).toBe(corkBoard.tokens.surfaceAlt);
    expect(vars["--border-style"]).toBe("solid");
    expect(vars["--bg"]).toBe(corkBoard.tokens.bg);
    expect(vars["--frame"]).toBe(corkBoard.tokens.frame);
    expect(vars["--bg-image"]).toBe("none");
    expect(Object.keys(vars).some((k) => /pattern|density/.test(k))).toBe(false);
  });

  it("gives a skin with no frame colour a wooden one", () => {
    expect(skinCssVars(cleanLight)["--frame"]).toBe(DEFAULT_FRAME);
  });

  it("matches native controls to the paper they sit on", () => {
    expect(skinCssVars(nightCork)["color-scheme"]).toBe("dark");
    expect(skinCssVars(corkBoard)["color-scheme"]).toBe("light");
  });

  it("sets texture, density and border style on the page", () => {
    const root: SkinTarget = { style: { setProperty: () => {} }, dataset: {} };
    applySkin(corkBoard, root);
    expect(root.dataset).toMatchObject({ pattern: "cork", density: "comfortable", borderStyle: "solid" });
  });

  it("only passes a background image through if it's an inline raster image", () => {
    const withImage = (bgImage: string): Skin => ({ ...corkBoard, tokens: { ...corkBoard.tokens, bgImage } });
    expect(skinCssVars(withImage("data:image/webp;base64,AAAA"))["--bg-image"]).toBe('url("data:image/webp;base64,AAAA")');
    expect(skinCssVars(withImage("javascript:alert(1)"))["--bg-image"]).toBe("none");
  });

  it("accepts a frame colour in a skin, and rejects one that isn't a colour", () => {
    const base = { id: "x", name: "X", version: 1 };
    expect(checkSkin({ ...base, tokens: { frame: "#123456" } }).skin?.tokens.frame).toBe("#123456");
    expect(checkSkin({ ...base, tokens: { frame: "url(evil)" } }).problems.join()).toMatch(/frame/);
    expect(sanitizeSkin({ ...base, tokens: { frame: "url(evil)" } })?.tokens.frame).toBeUndefined();
  });

  it("still reads a skin saved with the old tape deck settings, ignoring them", () => {
    const old = { id: "old", name: "Old", version: 1, tokens: { surface: "#202226", layout: "tape", lcdBg: "#241A0A", chrome: "player" } };
    const result = checkSkin(old);
    expect(result.problems).toEqual([]);
    expect(result.skin?.tokens.surface).toBe("#202226");
    expect(Object.keys(result.skin?.tokens ?? {})).not.toContain("lcdBg");
  });
});
