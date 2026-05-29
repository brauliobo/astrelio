import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: BASE, trace: 'on-first-retry' },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-pixel',     use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
})
