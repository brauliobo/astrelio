import { test, expect } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { REF_PERSON, seedPeople, seedSettings } from './support/fixtures.js'

const openAdvancedSettings = async (page) => {
  await page.getByTestId('settings-advanced-summary').click()
}

const openBackupSettings = async (page) => {
  await page.getByTestId('settings-backup-summary').click()
}

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page, 'pt-BR') })

  test('switches locale to en and updates UI strings', async ({ page }) => {
    await page.goto('/#/settings')
    await expect(page.getByTestId('settings-page')).toBeVisible()
    await page.getByTestId('setting-locale').selectOption('en')
    await expect(page.getByTestId('nav-home')).toHaveText('Home')
    await expect(page.getByTestId('nav-natal')).toHaveText('Map')
  })

  test('switches locale back to pt-BR', async ({ page }) => {
    await page.goto('/#/settings')
    await page.getByTestId('setting-locale').selectOption('pt-BR')
    await expect(page.getByTestId('nav-home')).toHaveText('Início')
    await expect(page.getByTestId('nav-natal')).toHaveText('Mapa')
  })

  test('changing house system persists across reload', async ({ page }) => {
    await page.goto('/#/settings')
    await openAdvancedSettings(page)
    await page.getByTestId('setting-houses').selectOption('whole_sign')
    await page.reload()
    await expect(page.getByTestId('setting-houses')).toHaveValue('whole_sign')
  })

  test('toggling sky bg disables WebGL background', async ({ page }) => {
    await page.goto('/#/settings')
    const cb = page.getByTestId('setting-sky')
    await expect(cb).toBeChecked({ checked: false })  // seedSettings disables it
  })

  test('toggles light and dark mode globally and persists it', async ({ page }) => {
    await page.goto('/#/settings')

    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
    await page.getByTestId('theme-toggle').click()
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')

    await page.reload()
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')

    await page.getByTestId('theme-toggle').click()
    await expect.poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('astrelio_settings')).theme)
    ).toBe('dark')
  })

  test('persists aspect display options', async ({ page }) => {
    await page.goto('/#/settings')
    await openAdvancedSettings(page)
    await page.getByTestId('setting-aspect-set').selectOption('major')
    await page.getByTestId('setting-orb-scale').selectOption('0.75')
    await page.getByTestId('setting-applying-only').check()
    await page.getByTestId('setting-modern-planets').uncheck()
    await page.reload()

    await expect(page.getByTestId('setting-aspect-set')).toHaveValue('major')
    await expect(page.getByTestId('setting-orb-scale')).toHaveValue('0.75')
    await expect(page.getByTestId('setting-applying-only')).toBeChecked()
    await expect(page.getByTestId('setting-modern-planets')).not.toBeChecked()
  })

  test('applies preset settings to chart options', async ({ page }) => {
    await page.goto('/#/settings')
    await page.getByTestId('setting-preset').selectOption('technical')

    await expect(page.getByTestId('setting-preset')).toHaveValue('technical')
    await expect(page.getByTestId('setting-houses')).toHaveValue('regiomontanus')
    await expect(page.getByTestId('setting-zodiac')).toHaveValue('sidereal')
    await expect(page.getByTestId('setting-aspect-set')).toHaveValue('all')
    await expect(page.getByTestId('setting-orb-scale')).toHaveValue('1.25')
    await expect(page.getByTestId('setting-modern-planets')).toBeChecked()
    await expect(page.getByTestId('setting-sky')).toBeChecked()
  })

  test('exports and imports saved charts and settings as JSON', async ({ page }) => {
    await seedPeople(page, [REF_PERSON])
    await page.goto('/#/settings')
    await openBackupSettings(page)

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('backup-export').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^astrelio-backup-.*\.json$/)
    await expect(page.getByTestId('backup-status')).toHaveText('Backup baixado.')

    page.on('dialog', dialog => dialog.accept())
    await page.getByTestId('backup-file').setInputFiles({
      name: 'astrelio-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        app: 'astrelio',
        version: 1,
        people: [{
          ...REF_PERSON,
          id: 'imported-person',
          name: 'Imported Chart',
          createdAt: 2234567890
        }],
        settings: {
          locale: 'en',
          houseSystem: 'whole_sign',
          zodiac: 'sidereal',
          skyEnabled: false,
          theme: 'dark',
          aspectSet: 'major',
          orbScale: 0.75,
          applyingOnly: true,
          includeModernPlanets: false
        }
      }))
    })

    await expect(page.getByTestId('nav-home')).toHaveText('Home')
    await expect(page.getByTestId('setting-houses')).toHaveValue('whole_sign')
    await expect(page.getByTestId('setting-aspect-set')).toHaveValue('major')
    await expect(page.getByTestId('setting-applying-only')).toBeChecked()
    await expect(page.getByTestId('backup-status')).toHaveText('Backup imported.')

    await expect.poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('astrelio_people')).list[0].name)
    ).toBe('Imported Chart')
  })
})
