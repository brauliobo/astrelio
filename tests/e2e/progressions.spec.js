import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Progressions', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page, 'en')
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('renders progression biwheel', async ({ page }) => {
    await page.goto('/#/progressions')
    await expect(page.getByTestId('progressions-page')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-panel')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-row')).toHaveCount(3)
    const backgroundRow = page.locator('[data-testid="comparison-insight-row"][data-insight-kind="group"]')
    await expect(backgroundRow).toHaveCount(1)
    await expect(backgroundRow).toContainText('Background')
    await expect(backgroundRow).toContainText('Slow-planet background')
    await expect(page.getByTestId('comparison-insight-panel')).not.toContainText(/Progressed Uranus .* natal Uranus/i)
    await expect(page.getByTestId('comparison-insight-panel')).not.toContainText(/Progressed Neptune .* natal Neptune/i)
    await expect(page.getByTestId('comparison-insight-panel')).not.toContainText(/Progressed Pluto .* natal Pluto/i)
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
