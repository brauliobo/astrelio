import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Progressions', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('renders progression biwheel', async ({ page }) => {
    await page.goto('/#/progressions')
    await expect(page.getByTestId('progressions-page')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-panel')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-row')).toHaveCount(3)
    await expect(page.getByTestId('chart-comparison')).toBeVisible()
    await expect(page.getByTestId('comparison-chart-panel')).toBeVisible()
    await expect(page.getByTestId('chart-wheel')).toHaveCount(1)
    await expect(page.getByTestId('base-positions')).toBeVisible()
    await expect(page.getByTestId('comparison-positions')).toBeVisible()
    await expect(page.getByTestId('planet-list')).toHaveCount(2)
  })

  test('changing date updates progression', async ({ page }) => {
    await page.goto('/#/progressions')
    await page.getByTestId('prog-date').fill('2030-01-01')
    await page.waitForTimeout(200)
    await expect(page.getByTestId('chart-comparison')).toBeVisible()
    await expect(page.getByTestId('chart-wheel')).toHaveCount(1)
  })
})
