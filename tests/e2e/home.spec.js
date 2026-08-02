import { test, expect } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSettings } from './support/fixtures.js'

test.describe('Home', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page) })

  test('renders brand and nav links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('brand')).toHaveText('Astrelio')
    await expect(page.getByTestId('nav-charts')).toBeVisible()
    await expect(page.getByTestId('nav-map')).toHaveAttribute('href', /\/map\/astrology\/chart$/)
    await expect(page.getByTestId('nav-timing')).toBeVisible()
    await expect(page.getByTestId('nav-relationships')).toBeVisible()
    await expect(page.locator('[data-testid^="nav-"]')).toHaveCount(4)
    await expect(page.getByTestId('command-palette-trigger')).toBeVisible()
    await expect(page.getByTestId('utility-settings')).toBeHidden()
    await page.getByTestId('utility-menu-summary').click()
    await expect(page.getByTestId('utility-settings')).toBeVisible()
    await expect(page.getByTestId('chart-context-bar')).toBeHidden()
  })

  test('shows timezone in the active chart header context', async ({ page }) => {
    await seedPeople(page, [REF_PERSON])
    await page.goto('/astrelio/map/astrology/chart')

    await expect(page.getByTestId('chart-context-bar')).toBeVisible()
    await expect(page.getByTestId('context-birth')).toContainText('America/Sao_Paulo')
    await expect(page.getByTestId('context-birth')).toContainText('UTC-02:00')
    await expect(page.getByTestId('context-preset')).toContainText('Predefinição')
  })

  test('shows empty state when no person saved', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('home-empty')).toBeVisible()
    await expect(page.getByTestId('home-form-panel')).toBeVisible()
    await expect(page.getByTestId('input-time')).toHaveValue('12:00')
  })

  test('keeps the first-chart form ready from the empty state', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('natal-form')).toBeVisible()
    await page.getByTestId('btn-new').click()
    await expect(page.getByTestId('natal-form')).toBeVisible()
  })

  test('supports city search guidance, keyboard selection, and validation', async ({ page }) => {
    await page.goto('/')

    const city = page.getByTestId('city-input')
    await city.click()
    await city.fill('S')
    await expect(page.getByTestId('city-min-query')).toBeVisible()

    await city.fill('São Paulo')
    await expect(page.getByTestId('city-São Paulo, SP - Brasil')).toBeVisible({ timeout: 15000 })
    await city.press('ArrowDown')
    await city.press('ArrowUp')
    await city.press('Enter')
    await expect(page.getByTestId('city-selected')).toContainText('São Paulo')

    await city.fill('Xy')
    await page.getByTestId('input-name').click()
    await expect(page.getByTestId('city-validation')).toBeVisible()
  })

  test('marks active chart and supports edit, duplicate, and delete undo', async ({ page }) => {
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await page.goto('/')

    await expect(page.getByTestId(`active-${SECOND_PERSON.id}`)).toBeVisible()

    await page.getByTestId(`edit-${REF_PERSON.id}`).click()
    await expect(page.getByTestId('home-form-title')).toBeVisible()
    await page.getByTestId('input-name').fill('Edited chart')
    await page.getByTestId('btn-submit').click()
    await expect(page.getByTestId(`person-name-${REF_PERSON.id}`)).toHaveText('Edited chart')
    await expect(page.getByTestId(`active-${REF_PERSON.id}`)).toBeVisible()

    await page.getByTestId(`duplicate-${REF_PERSON.id}`).click()
    await expect(page.getByTestId('btn-submit')).toBeEnabled()
    await page.getByTestId('btn-submit').click()
    await expect(page).toHaveURL(/\/natal/)
    await page.goto('/')
    await expect(page.locator('[data-testid^="person-name-"]').filter({ hasText: /Cópia de Edited chart|Copy of Edited chart/ })).toBeVisible()

    await page.getByTestId(`delete-${SECOND_PERSON.id}`).click()
    await page.getByTestId(`delete-${SECOND_PERSON.id}`).click()
    await expect(page.getByTestId(`person-${SECOND_PERSON.id}`)).not.toBeVisible()
    await expect(page.getByTestId('delete-undo')).toBeVisible()
    await page.getByTestId('undo-delete').click()
    await expect(page.getByTestId(`person-${SECOND_PERSON.id}`)).toBeVisible()
  })
})
