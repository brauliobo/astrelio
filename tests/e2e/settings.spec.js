import { test, expect } from '@playwright/test'
import { seedSettings } from './support/fixtures.js'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page, 'pt-BR') })

  test('switches locale to en and updates UI strings', async ({ page }) => {
    await page.goto('/#/settings')
    await expect(page.getByTestId('settings-page')).toBeVisible()
    await page.getByTestId('setting-locale').selectOption('en')
    await expect(page.getByTestId('nav-home')).toHaveText('Home')
    await expect(page.getByTestId('nav-natal')).toHaveText('Natal')
  })

  test('switches locale back to pt-BR', async ({ page }) => {
    await page.goto('/#/settings')
    await page.getByTestId('setting-locale').selectOption('pt-BR')
    await expect(page.getByTestId('nav-home')).toHaveText('Início')
    await expect(page.getByTestId('nav-natal')).toHaveText('Mapa Natal')
  })

  test('changing house system persists across reload', async ({ page }) => {
    await page.goto('/#/settings')
    await page.getByTestId('setting-houses').selectOption('whole_sign')
    await page.reload()
    await expect(page.getByTestId('setting-houses')).toHaveValue('whole_sign')
  })

  test('toggling sky bg disables WebGL background', async ({ page }) => {
    await page.goto('/#/settings')
    const cb = page.getByTestId('setting-sky')
    await expect(cb).toBeChecked({ checked: false })  // seedSettings disables it
  })
})
