import { defineConfig } from "@playwright/test";
import path from "path";

const backendLauncher = path.join(__dirname, "scripts", "playwright-backend.cjs");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: `node "${backendLauncher}"`,
      url: "http://127.0.0.1:8080/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
