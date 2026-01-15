import { defineConfig } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  webServer: [
    {
      command: "node tests/helpers/mockSupabaseServer.cjs",
      url: "http://127.0.0.1:54321/health",
      reuseExistingServer: true,
      timeout: 5000,
    },
    {
      command:
        'PORT=3001 NODE_OPTIONS="--require ./tests/helpers/overrideEnv.cjs" pnpm dev',
      url: "http://localhost:3001/en/spray",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
