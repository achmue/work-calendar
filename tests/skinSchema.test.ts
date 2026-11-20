import { describe, expect, it } from "vitest";
import { fontStack } from "../src/lib/fonts";
import {
  LENGTH_PATTERN,
  MAX_BG_IMAGE_LENGTH,
  checkSkin,
  isValidShadow,
  sanitizeSkin,
} from "../src/lib/skinSchema";
import { cleanLight, presets } from "../src/skins/presets";

const valid = { id: "mine", name: "Mine", version: 1, tokens: { ...cleanLight.tokens, accent: "#FF00AA" } };

describe("checkSkin: good skins", () => {
  it("accepts every built-in skin with no problems", () => {
    for (const skin of presets) {
      const { skin: checked, problems } = checkSkin(skin);
      expect(problems, skin.name).toEqual([]);
      expect(checked).toEqual(skin);
    }
  });

  it("accepts a complete skin", () => {
    expect(checkSkin(valid)).toEqual({ skin: valid, problems: [] });
  });

  it("fills missing tokens from Clean Light without complaint", () => {
    const { skin, problems } = checkSkin({ id: "tiny", name: "Tiny", version: 1, tokens: { accent: "#FF00AA" } });
    expect(problems).toEqual([]);
    expect(skin?.tokens).toEqual({ ...cleanLight.tokens, accent: "#FF00AA" });
  });

  it("accepts colours written as hex, rgb() and hsl()", () => {
    const tokens = { bg: "#fff", surface: "rgb(10, 20, 30)", text: "hsl(120, 50%, 20%)", accent: "rgba(1,2,3,0.5)", border: "#11223344" };
    const { skin, problems } = checkSkin({ ...valid, tokens });
    expect(problems).toEqual([]);
    expect(skin?.tokens).toMatchObject(tokens);
  });

  it("accepts a reasonably sized inline background picture", () => {
    const { skin, problems } = checkSkin({ ...valid, tokens: { bgImage: "data:image/png;base64,iVBORw0KGgo=" } });
    expect(problems).toEqual([]);
    expect(skin?.tokens.bgImage).toBe("data:image/png;base64,iVBORw0KGgo=");
  });

  it("treats null and empty optional values as absent", () => {
    const { problems } = checkSkin({ ...valid, tokens: { bgImage: null, bgPattern: null, density: undefined, shadow: null } });
    expect(problems).toEqual([]);
  });
});

describe("checkSkin: colours", () => {
  it("rejects anything that isn't a colour, and says which token", () => {
    for (const bad of ["banana", "red", "#12", "url(http://evil)", "rgb(1,2)", "var(--x)", "red; background: blue", "#fff; } body { display: none", "</style><script>alert(1)</script>", 123, true, {}, ["#fff"]]) {
      const { skin, problems } = checkSkin({ ...valid, tokens: { accent: bad } });
      expect(problems.length, String(bad)).toBe(1);
      expect(problems[0], String(bad)).toMatch(/^accent: .*isn't a colour/);
      expect(skin?.tokens.accent, "falls back to the default").toBe(cleanLight.tokens.accent);
    }
  });

  it("rejects absurdly long colour strings", () => {
    expect(checkSkin({ ...valid, tokens: { accent: "#" + "a".repeat(5000) } }).problems).toHaveLength(1);
  });
});

describe("checkSkin: sizes", () => {
  it("accepts px, rem and em with optional decimals", () => {
    for (const ok of ["0px", "10px", "1.5rem", "2em", "0.25rem", "120px"]) {
      expect(LENGTH_PATTERN.test(ok), ok).toBe(true);
      expect(checkSkin({ ...valid, tokens: { radius: ok } }).problems, ok).toEqual([]);
    }
  });

  it("rejects everything else", () => {
    for (const bad of ["10", "10%", "-5px", "calc(1px+1px)", "10px; color: red", "1e3px", " 10px", "10 px", "var(--x)", "auto", "", ".5px", 10]) {
      expect(checkSkin({ ...valid, tokens: { fontSize: bad } }).problems.length, String(bad)).toBeGreaterThan(0);
    }
    for (const key of ["fontSize", "radius", "borderWidth"]) {
      const { problems } = checkSkin({ ...valid, tokens: { [key]: "huge" } });
      expect(problems[0]).toMatch(new RegExp(`^${key}: "huge" isn't a size`));
    }
  });
});

describe("checkSkin: fonts", () => {
  it("accepts only the exact allowed stacks", () => {
    expect(checkSkin({ ...valid, tokens: { fontBody: fontStack("caveat") } }).problems).toEqual([]);
    for (const bad of ["Caveat", "Comic Sans MS", 'Arial; background: url("https://evil/x")', "system-ui", "serif", `${fontStack("caveat")}, evil`, 12]) {
      const { skin, problems } = checkSkin({ ...valid, tokens: { fontBody: bad } });
      expect(problems, String(bad)).toEqual(["fontBody: that font isn't on the allowed list."]);
      expect(skin?.tokens.fontBody).toBe(cleanLight.tokens.fontBody);
    }
  });
});

describe("checkSkin: shadows", () => {
  it("accepts none and normal shadows, including several layers", () => {
    for (const ok of [
      "none", "0 1px 3px rgba(0, 0, 0, 0.2)", "2px 2px 0 rgba(60, 50, 30, 0.15)", "0 0 14px #ff3ddb",
      "inset 0 1px 0 rgba(255,255,255,.3), 0 2px 6px rgba(0,0,0,.4)", "0 0 0 1px hsl(0, 0%, 50%)", "0px 0px 4px 2px #000",
    ]) {
      expect(isValidShadow(ok), ok).toBe(true);
    }
  });

  it("rejects malformed shadows and anything that smuggles in other CSS", () => {
    for (const bad of [
      "", "   ", "0 1px 3px", "red", "0 1px 3px red", "0 1px 3px rgba(0,0,0,0.2); color: red", "url(x) 0 0 #000",
      "0 1px 3px rgba(0,0,0,0.2) !important", "0 0 0 0 0 #000", "1px #000", "0 1px 3px rgba(0,0,0,0.2", "0 1px 3px rgba(0,0,0,0.2))",
      "0 0 1px #000, 0 0 1px #000, 0 0 1px #000, 0 0 1px #000, 0 0 1px #000", "0 0 1px #000 } body { display:none", "x".repeat(400),
    ]) {
      expect(isValidShadow(bad), bad).toBe(false);
    }
    expect(checkSkin({ ...valid, tokens: { shadow: "0 1px 3px red" } }).problems[0]).toMatch(/^shadow: .*isn't a shadow/);
  });
});

describe("checkSkin: words and images", () => {
  it("only allows the listed border styles, patterns and densities", () => {
    const { skin, problems } = checkSkin({ ...valid, tokens: { borderStyle: "wavy", bgPattern: "stripes", density: "huge" } });
    expect(problems).toHaveLength(3);
    expect(problems[0]).toMatch(/^borderStyle: "wavy" isn't one of: solid, dashed/);
    expect(skin?.tokens).toMatchObject({ borderStyle: "solid", bgPattern: "none", density: "comfortable" });

    const retro = checkSkin({ ...valid, tokens: { borderStyle: "outset", bgPattern: "scanlines", density: "compact" } });
    expect(retro.problems).toEqual([]);
    expect(retro.skin?.tokens).toMatchObject({ borderStyle: "outset", bgPattern: "scanlines", density: "compact" });
  });

  it("only allows inline raster images as a background", () => {
    for (const bad of [
      "https://example.com/a.png", "//example.com/a.png", "data:image/svg+xml;base64,PHN2Zz4=", "data:text/html;base64,PHNjcmlwdD4=",
      "data:image/png;charset=utf-8,%3Cscript%3E", 'data:image/png;base64,AAAA")', "javascript:alert(1)", "file:///etc/passwd", 42,
      "x".repeat(MAX_BG_IMAGE_LENGTH + 1),
    ]) {
      const { skin, problems } = checkSkin({ ...valid, tokens: { bgImage: bad } });
      expect(problems.length, String(bad).slice(0, 30)).toBe(1);
      expect(skin?.tokens.bgImage).toBeUndefined();
    }
  });
});

describe("checkSkin: shape of the file", () => {
  it("rejects things that aren't skins", () => {
    for (const bad of [null, undefined, 42, "skin", [], {}, { ...valid, id: "" }, { ...valid, id: 5 }, { ...valid, name: "  " }, { ...valid, version: 2 }, { ...valid, version: "1" }, { ...valid, tokens: undefined }, { ...valid, tokens: [] }, { ...valid, tokens: "x" }]) {
      const { skin, problems } = checkSkin(bad);
      expect(skin, JSON.stringify(bad)).toBeNull();
      expect(problems, JSON.stringify(bad)).toHaveLength(1);
    }
  });

  it("explains an unsupported version and a missing version", () => {
    expect(checkSkin({ ...valid, version: 2 }).problems[0]).toMatch(/format version 2/);
    expect(checkSkin({ ...valid, version: undefined }).problems[0]).toMatch(/missing its "version"/);
  });

  it("ignores extra fields, so raw CSS or script in a skin file never goes anywhere", () => {
    const sneaky = {
      ...valid, css: "body{display:none}", style: "x", script: "alert(1)", onload: "alert(1)",
      tokens: { ...valid.tokens, extra: "x", customCss: "a{}", "--evil": "red", __proto__: { polluted: true } },
    };
    const { skin, problems } = checkSkin(sneaky);
    expect(problems).toEqual([]);
    expect(skin).toEqual(valid);
    expect(JSON.stringify(skin)).not.toMatch(/display:none|alert|customCss|evil|polluted/);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("limits the length of the name, id and author", () => {
    const { skin, problems } = checkSkin({ ...valid, id: "i".repeat(150), name: "n".repeat(80), author: "a".repeat(90) });
    expect(problems).toHaveLength(2);
    expect(skin?.id).toHaveLength(100);
    expect(skin?.name).toHaveLength(60);
    expect(skin?.author).toHaveLength(60);
  });

  it("keeps an author only when it's a real string", () => {
    expect(checkSkin({ ...valid, author: "  Sam " }).skin?.author).toBe("Sam");
    expect(checkSkin({ ...valid, author: 5 }).skin).not.toHaveProperty("author");
    expect(checkSkin({ ...valid, author: "" }).skin).not.toHaveProperty("author");
  });

  it("reports every problem at once", () => {
    const { problems } = checkSkin({ ...valid, tokens: { bg: "x", text: "y", radius: "z", fontBody: "w", shadow: "v", borderStyle: "u", bgImage: "t" } });
    expect(problems).toHaveLength(7);
  });
});

describe("sanitizeSkin (the forgiving version used for saved data)", () => {
  it("keeps what's usable and swaps bad values for defaults", () => {
    const skin = sanitizeSkin({ ...valid, tokens: { ...valid.tokens, bg: 123, radius: "banana" } });
    expect(skin?.tokens.bg).toBe(cleanLight.tokens.bg);
    expect(skin?.tokens.radius).toBe(cleanLight.tokens.radius);
    expect(skin?.tokens.accent).toBe("#FF00AA");
  });

  it("returns null only when it isn't a skin at all", () => {
    expect(sanitizeSkin("nope")).toBeNull();
    expect(sanitizeSkin({ ...valid, version: 3 })).toBeNull();
  });
});
