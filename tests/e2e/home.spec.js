import { test, expect } from '@playwright/test'
import { seedSettings } from './support/fixtures.js'

test.describe('Home', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page) })

  test('renders brand and nav links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('brand')).toHaveText('Astrelio')
    await expect(page.getByTestId('nav-natal')).toBeVisible()
    await expect(page.getByTestId('nav-transits')).toBeVisible()
    await expect(page.getByTestId('nav-progressions')).toBeVisible()
    await expect(page.getByTestId('nav-solar-return')).toBeVisible()
    await expect(page.getByTestId('nav-synastry')).toBeVisible()
    await expect(page.getByTestId('nav-settings')).toBeVisible()
  })

  test('shows empty state when no person saved', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home-empty')).toBeVisible()
  })

  test('opens new chart form', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-new').click()
    await expect(page.getByTestId('natal-form')).toBeVisible()
  })
})
