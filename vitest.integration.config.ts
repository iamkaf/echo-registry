import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    include: ["worker/tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: {
      "@worker": resolve(__dirname, "worker"),
      "@": resolve(__dirname, "src"),
    },
  },
});
