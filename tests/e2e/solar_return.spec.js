import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Solar Return', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('renders solar-return chart for current year', async ({ page }) => {
    await page.goto('/#/solar-return')
    await expect(page.getByTestId('solar-return-page')).toBeVisible()
    await expect(page.getByTestId('chart-wheel')).toBeVisible()
    await expect(page.getByTestId('planet-list')).toBeVisible()
  })

  test('changing year updates the chart', async ({ page }) => {
    await page.goto('/#/solar-return')
    await page.getByTestId('sr-year').fill('2030')
    await page.waitForTimeout(200)
    await expect(page.getByTestId('chart-wheel')).toBeVisible()
  })
})
