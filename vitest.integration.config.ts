import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.spec.ts"],
    globals: false,
    environment: "node",
    testTimeout: 15000,
    hookTimeout: 15000,
    sequence: {
      concurrent: false,
    },
  },
});
