import { describe, expect, it } from "vitest";
import { fileSlug } from "../src/lib/files";
import { MAX_SKIN_FILE_CHARS, formatProblems, parseSkinFile, serializeSkin, uniqueSkinName } from "../src/lib/skinFile";
import { cleanLight, presets } from "../src/skins/presets";
import type { Skin } from "../src/types";

describe("exporting and importing a skin", () => {
  it("round-trips every built-in skin exactly", () => {
    for (const skin of presets) {
      const result = parseSkinFile(serializeSkin(skin));
      expect(result, skin.name).toEqual({ ok: true, value: skin });
    }
  });

  it("round-trips a skin with an author and a background picture", () => {
    const skin: Skin = { ...cleanLight, id: "mine", name: "Mine", author: "Sam", tokens: { ...cleanLight.tokens, bgImage: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" } };
    expect(parseSkinFile(serializeSkin(skin))).toEqual({ ok: true, value: skin });
  });

  it("writes readable, pretty-printed JSON with only the known fields", () => {
    const text = serializeSkin({ ...cleanLight, ...({ css: "body{}" } as object) });
    expect(text).toContain('\n  "name": "Clean Light"');
    expect(Object.keys(JSON.parse(text))).toEqual(["id", "name", "version", "tokens"]);
    expect(text).not.toContain("body{}");
  });

  it("fills in missing tokens from the defaults", () => {
    const result = parseSkinFile(JSON.stringify({ id: "a", name: "Partial", version: 1, tokens: { accent: "#123456" } }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tokens).toEqual({ ...cleanLight.tokens, accent: "#123456" });
  });

  it("uses the .skin.json file name convention", () => {
    expect(`${fileSlug("Neon Night")}.skin.json`).toBe("neon-night.skin.json");
  });
});

describe("rejecting bad skin files with a clear message", () => {
  const fail = (text: string) => {
    const result = parseSkinFile(text);
    expect(result.ok).toBe(false);
    return result.ok ? "" : result.error;
  };

  it("explains when it isn't JSON at all", () => {
    expect(fail("not json {")).toBe("That file isn't valid JSON, so it can't be a skin.");
    expect(fail("")).toMatch(/valid JSON/);
    expect(fail("<html><script>alert(1)</script></html>")).toMatch(/valid JSON/);
  });

  it("explains when it's JSON but not a skin", () => {
    expect(fail("[]")).toMatch(/isn't a skin file/);
    expect(fail("42")).toMatch(/isn't a skin file/);
    expect(fail("null")).toMatch(/isn't a skin file/);
    expect(fail("{}")).toMatch(/needs an "id"/);
    expect(fail(JSON.stringify({ id: "a", name: "A", version: 1 }))).toMatch(/no "tokens"/);
    expect(fail(JSON.stringify({ id: "a", name: "A", version: 9, tokens: {} }))).toMatch(/format version 9/);
  });

  it("refuses a skin with even one invalid value, listing what's wrong", () => {
    const message = fail(JSON.stringify({ id: "a", name: "A", version: 1, tokens: { accent: "banana", radius: "10", fontBody: "Comic Sans" } }));
    expect(message).toMatch(/^This skin file can't be used:/);
    expect(message).toContain("• accent:");
    expect(message).toContain("• radius:");
    expect(message).toContain("• fontBody:");
  });

  it("refuses skins carrying CSS, script or outside images", () => {
    const tokens = (t: object) => JSON.stringify({ id: "a", name: "A", version: 1, tokens: t });
    expect(fail(tokens({ bg: "red; } body { display: none" }))).toMatch(/bg: .*colour/);
    expect(fail(tokens({ shadow: "0 0 1px #000; background: url(//evil)" }))).toMatch(/shadow:/);
    expect(fail(tokens({ bgImage: "https://evil.example/track.png" }))).toMatch(/bgImage:/);
    expect(fail(tokens({ bgImage: "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Lz48L3N2Zz4=" }))).toMatch(/bgImage:/);
    expect(fail(tokens({ fontDisplay: "Arial; background: url(x)" }))).toMatch(/fontDisplay:/);
  });

  it("caps how many problems it lists", () => {
    const bad = Object.fromEntries(["bg", "surface", "surfaceAlt", "text", "textMuted", "border", "accent"].map((k) => [k, "x"]));
    const message = fail(JSON.stringify({ id: "a", name: "A", version: 1, tokens: bad }));
    expect(message.split("\n").filter((l) => l.startsWith("•"))).toHaveLength(5);
    expect(message).toMatch(/…and 2 more\./);
  });

  it("refuses an oversized file without parsing it", () => {
    expect(fail(" ".repeat(MAX_SKIN_FILE_CHARS + 1))).toMatch(/too big/);
  });
});

describe("helpers", () => {
  it("formatProblems builds a bulleted message", () => {
    expect(formatProblems("Nope:", ["a", "b"])).toBe("Nope:\n• a\n• b");
    expect(formatProblems("Nope:", ["a", "b", "c"], 2)).toBe("Nope:\n• a\n• b\n…and 1 more.");
  });

  it("uniqueSkinName keeps names apart without being fussy about case", () => {
    expect(uniqueSkinName("Night", ["Day"])).toBe("Night");
    expect(uniqueSkinName("Night", ["night"])).toBe("Night (imported)");
    expect(uniqueSkinName("Night", ["Night", "Night (imported)"])).toBe("Night (imported 2)");
    expect(uniqueSkinName("Night", ["Night", "Night (imported)", "Night (imported 2)"])).toBe("Night (imported 3)");
  });
});
