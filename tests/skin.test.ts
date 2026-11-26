import { describe, expect, it } from "vitest";
import { cleanLight, presets } from "../src/skins/presets";
import baseCss from "../src/styles/base.css?raw";
import corkCss from "../src/styles/cork.css?raw";
import designCss from "../src/styles/design.css?raw";
import resetCss from "../src/styles/reset.css?raw";
import { applySkin, tokenVarName, type SkinTarget } from "../src/state/useSkin";
import type { Skin } from "../src/types";

function fakeRoot() {
  const props = new Map<string, string>();
  const root: SkinTarget = {
    style: { setProperty: (name: string, value: string | null) => void props.set(name, value ?? "") },
    dataset: {},
  };
  return { root, props };
}

describe("tokenVarName", () => {
  it("turns camelCase token names into CSS custom property names", () => {
    expect(tokenVarName("bg")).toBe("--bg");
    expect(tokenVarName("surfaceAlt")).toBe("--surface-alt");
    expect(tokenVarName("accentText")).toBe("--accent-text");
    expect(tokenVarName("borderWidth")).toBe("--border-width");
  });
});

describe("applySkin", () => {
  it("sets a CSS variable for every required token of Clean Light", () => {
    const { root, props } = fakeRoot();
    applySkin(cleanLight, root);

    const required = [
      "--bg", "--surface", "--surface-alt", "--text", "--text-muted", "--border",
      "--accent", "--accent-text", "--danger", "--warning", "--success",
      "--font-body", "--font-display", "--font-mono", "--font-size",
      "--radius", "--border-width", "--border-style", "--shadow", "--bg-image",
    ];
    for (const name of required) {
      expect(props.get(name), name).toBeTruthy();
    }
    expect(props.get("--accent")).toBe(cleanLight.tokens.accent);
    expect(root.dataset.pattern).toBe("cork");
    expect(root.dataset.density).toBe("comfortable");
  });

  it("falls back to no background image when none is set", () => {
    const { root, props } = fakeRoot();
    applySkin(cleanLight, root);
    expect(props.get("--bg-image")).toBe("none");
  });

  it("only accepts inline raster images as a background", () => {
    const withImage = (bgImage: string): Skin => ({
      ...cleanLight,
      tokens: { ...cleanLight.tokens, bgImage },
    });

    const good = fakeRoot();
    applySkin(withImage("data:image/png;base64,iVBORw0KGgo="), good.root);
    expect(good.props.get("--bg-image")).toBe('url("data:image/png;base64,iVBORw0KGgo=")');

    for (const bad of [
      "https://example.com/x.png",
      "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
      'data:image/png;base64,AAAA"); background: red; ("',
    ]) {
      const { root, props } = fakeRoot();
      applySkin(withImage(bad), root);
      expect(props.get("--bg-image"), bad).toBe("none");
    }
  });
});

describe("presets", () => {
  it("includes Cork Board with unique ids", () => {
    const ids = presets.map((s) => s.id);
    expect(ids).toContain("cork-board");
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("stylesheets", () => {
  // CLAUDE.md 7.1: no hard-coded colours outside skin preset data.
  const files = { "base.css": baseCss, "design.css": designCss, "reset.css": resetCss, "cork.css": corkCss };
  const colour = /#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/;

  for (const [file, source] of Object.entries(files)) {
    it(`${file} has no hard-coded colours`, () => {
      const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
      expect(css).not.toMatch(colour);
    });
  }
});
