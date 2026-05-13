import { defineConfig } from "vitest/config";

/** Юнит-тесты отдельно; интеграция — `npm run test:integration`; e2e — `npm run test:e2e`. */
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.spec.ts"],
    exclude: ["tests/e2e/**", "tests/integration/**", "node_modules/**"],
  },
});
