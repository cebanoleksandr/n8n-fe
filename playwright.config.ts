import { defineConfig } from '@playwright/test'

const BACKEND_PORT = 3100
const FRONTEND_PORT = 5180

/**
 * End-to-end tests in a real browser against a real backend. The backend runs
 * on the e2e database, Redis db and bucket (as backend/test/test-env.ts), so
 * development data is never touched. Its docker services must be up.
 * Every test signs up its own user, so tests don't share state.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    // The installed Chrome: no browser download. PW_CHANNEL=chromium after
    // `npx playwright install chromium` where Chrome isn't installed.
    channel: process.env.PW_CHANNEL ?? 'chrome',
    // Texts in assertions are English.
    locale: 'en-US',
    viewport: { width: 1400, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run build && node dist/main',
      cwd: '../backend',
      url: `http://localhost:${BACKEND_PORT}/api/health`,
      env: {
        PORT: String(BACKEND_PORT),
        PUBLIC_URL: `http://localhost:${BACKEND_PORT}`,
        DATABASE_URL: 'postgres://flow:flow@localhost:5440/flow_test',
        REDIS_URL: 'redis://localhost:6390/1',
        S3_BUCKET: 'flow-binary-data-test',
        REGISTRATION_ENABLED: 'true',
        // Client IPs come from X-Forwarded-For (sent through Vite's proxy):
        // each test uses its own (see e2e/helpers.ts), so sign-up and login
        // rate limits per IP don't add up across tests and runs.
        TRUST_PROXY: 'loopback',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${FRONTEND_PORT} --strictPort`,
      url: `http://localhost:${FRONTEND_PORT}`,
      env: { BACKEND_URL: `http://localhost:${BACKEND_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
