import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Transits', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('renders biwheel and aspect table', async ({ page }) => {
    await page.goto('/#/transits')
    await expect(page.getByTestId('transits-page')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-panel')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-row')).toHaveCount(3)
    await expect(page.getByTestId('biwheel')).toBeVisible()
  })

  test('changing date updates the chart', async ({ page }) => {
    await page.goto('/#/transits')
    const input = page.getByTestId('transit-date')
    await input.fill('2030-06-15T12:00')
    await page.waitForTimeout(200)
    await expect(page.getByTestId('biwheel')).toBeVisible()
  })

  test('"now" button resets to current time', async ({ page }) => {
    await page.goto('/#/transits')
    await page.getByTestId('btn-now').click()
    const value = await page.getByTestId('transit-date').inputValue()
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  })
})
