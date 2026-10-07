import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSettings } from './support/fixtures.js'

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page) })

  test('starts a new chart from the top bar person switcher', async ({ page }) => {
    await seedPeople(page, [REF_PERSON])
    await page.goto('/astrelio/map/astrology/chart')
    await page.getByTestId('person-switcher').click()
    await page.getByTestId('person-switcher-new').click()

    await expect(page.getByTestId('home-form-panel')).toBeVisible()
    await expect(page.getByTestId('natal-form')).toBeVisible()
  })

  test('creates a person and lands on the map', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-new').click()

    await page.getByTestId('input-name').fill('Bráulio')
    await page.getByTestId('input-date').fill('1986-02-12')
    await page.getByTestId('input-time').fill('18:10')

    await page.getByTestId('city-input').click()
    await page.getByTestId('city-input').fill('São José')
    await expect(page.getByTestId('city-list')).toBeVisible()
    await page.getByTestId('city-São José dos Campos, SP - Brasil').click()

    await expect(page.getByTestId('btn-submit')).toBeEnabled()
    await page.getByTestId('btn-submit').click()

    await expect(page).toHaveURL(/\/map\/astrology\/chart$/)
    await expect(page.getByTestId('map-page')).toBeVisible()
    await expect(page.getByTestId('context-person')).toHaveText('Bráulio')
    await expect(page.getByTestId('chart-wheel')).toBeVisible()
    await page.getByTestId('workspace-view-data').click()
    await expect(page.getByTestId('planet-list')).toBeVisible()
  })

  test('persists person across reload', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-new').click()
    await page.getByTestId('input-name').fill('Reloaded')
    await page.getByTestId('input-date').fill('2000-01-01')
    await page.getByTestId('input-time').fill('12:00')
    await page.getByTestId('city-input').fill('São Paulo')
    await page.getByTestId('city-São Paulo, SP - Brasil').click()
    await page.getByTestId('btn-submit').click()

    await expect(page).toHaveURL(/\/map\/astrology\/chart$/)
    await page.goto('/')
    await expect(page.locator('[data-testid^="person-name-"]').filter({ hasText: 'Reloaded' })).toBeVisible()
  })
})
