import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Each page has its own address (/timeline), but there's only one real file. Hosts such as GitHub
 * Pages show 404.html for an address they don't know, so make that a copy of the app: then
 * refreshing a page, or opening it from a bookmark, still works.
 */
function pageAddresses(): Plugin {
  return {
    name: "page-addresses",
    enforce: "post",
    generateBundle(_options, bundle) {
      const page = bundle["index.html"];
      if (page?.type === "asset") this.emitFile({ type: "asset", fileName: "404.html", source: page.source });
    },
  };
}

export default defineConfig({
  // The folder the site is served from. A site in a sub-folder is built with
  // `npm run build -- --base=/work-calendar/` (the GitHub Pages workflow does this).
  base: "/",
  plugins: [react(), pageAddresses()],
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
