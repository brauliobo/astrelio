import { expect, test } from '@playwright/test'

test('defaults to dark mode when the system prefers light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/#/settings')

  await expect(page.getByTestId('settings-page')).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
})
