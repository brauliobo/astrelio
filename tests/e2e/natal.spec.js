import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Natal chart', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('renders chart wheel and planet table for the reference person', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('natal-page')).toBeVisible()
    await expect(page.getByTestId('chart-wheel')).toBeVisible()
    await expect(page.getByTestId('planet-list')).toBeVisible()

    // SVG produced by @astrodraw/astrochart
    await expect(page.locator('[data-testid="chart-wheel"] svg')).toBeVisible()
  })

  test('displays Aquarius for Sun (1986-02-12 reference)', async ({ page }) => {
    await page.goto('/#/natal')
    const sun = page.getByTestId('planet-Sun')
    await expect(sun).toBeVisible()
    await expect(sun).toContainText(/Aqu[áa]rio|Aquarius/)
  })

  test('displays Cancer for Ascendant', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('asc-sign')).toContainText(/C[âa]ncer|Cancer/)
  })

  test('displays Taurus for Midheaven', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('mc-sign')).toContainText(/Touro|Taurus/)
  })

  test('shows moon phase label', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('moon-phase')).toBeVisible()
  })
})
