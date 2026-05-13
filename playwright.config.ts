import { defineConfig, devices } from "@playwright/test";

/**
 * Переменные окружения:
 * - `DATABASE_URL` — PostgreSQL (по умолчанию порт Docker Compose из `docker-compose.yml`: 5434)
 * - `PLAYWRIGHT_BASE_URL` — уже поднятое приложение (если задано, `webServer` не стартует при reuseExistingServer)
 *
 * Перед прогоном: `docker compose up db -d` и один раз дождаться healthy (или полный `docker compose up`).
 */
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://recipe:recipe@127.0.0.1:5434/recipe_book?schema=public";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx prisma db push && npx next dev --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      DATABASE_URL,
    },
  },
});
