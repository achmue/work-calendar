import { describe, expect, it } from "vitest";

// CLAUDE.md 7.1: every visual value is a skin token. Colours may only appear in
// skin preset data (src/skins/presets.ts) and in project colour data (src/lib/*).
const components = import.meta.glob<string>("../src/components/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
});

const colour = /#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/;

describe("components", () => {
  it("finds the component files", () => {
    expect(Object.keys(components).length).toBeGreaterThan(3);
  });

  for (const [path, source] of Object.entries(components)) {
    it(`${path.split("/").pop()} has no hard-coded colours`, () => {
      const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect(code).not.toMatch(colour);
    });
  }
});
