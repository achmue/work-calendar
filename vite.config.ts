import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the built site works wherever it's hosted: the root of a
  // domain, or a sub-folder such as https://<user>.github.io/<repo>/.
  base: "./",
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
