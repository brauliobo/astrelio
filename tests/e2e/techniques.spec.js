import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Techniques', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('renders annual profections', async ({ page }) => {
    await page.goto('/#/profections')
    await expect(page.getByTestId('profections-page')).toBeVisible()
    await expect(page.getByTestId('profection-summary')).toBeVisible()
    await expect(page.getByTestId('profection-house')).toBeVisible()

    await page.getByTestId('profection-date').fill('2026-05-29')
    await expect(page.getByTestId('profection-age')).toHaveText('40')
  })

  test('renders solar arc directions', async ({ page }) => {
    await page.goto('/#/solar-arc')
    await expect(page.getByTestId('solar-arc-page')).toBeVisible()
    await expect(page.getByTestId('solar-arc-degrees')).toBeVisible()
    await expect(page.getByTestId('chart-comparison')).toBeVisible()

    await page.getByTestId('solar-arc-date').fill('2030-01-01')
    await expect(page.getByTestId('chart-wheel')).toHaveCount(1)
  })

  test('renders lunar return chart', async ({ page }) => {
    await page.goto('/#/lunar-return')
    await expect(page.getByTestId('lunar-return-page')).toBeVisible()
    await expect(page.getByTestId('lunar-return-exact')).toBeVisible()
    await expect(page.getByTestId('chart-comparison')).toBeVisible()

    await page.getByTestId('lunar-return-date').fill('2030-02-01')
    await expect(page.getByTestId('chart-wheel')).toHaveCount(1)
  })
})
