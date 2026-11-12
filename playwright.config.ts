import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout : nécessitent la pile Supabase locale (`npx supabase start`)
 * et un `.env.local` pointant dessus (voir docs/mise-en-place-supabase.md).
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  },
  projects: [{ name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
