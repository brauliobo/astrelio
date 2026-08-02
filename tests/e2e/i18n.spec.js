import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('i18n', () => {
  test('uses the browser locale when no saved locale exists', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page    = await context.newPage()

    await page.goto(baseURL)
    await expect(page.getByTestId('nav-map')).toHaveText('Map')
    await page.getByTestId('utility-menu-summary').click()
    await expect(page.getByTestId('locale-select')).toHaveValue('en')

    await context.close()
  })

  test('en locale loads English nav', async ({ page }) => {
    await seedSettings(page, 'en')
    await page.goto('/')
    await expect(page.getByTestId('nav-map')).toHaveText('Map')
    await expect(page.getByTestId('nav-relationships')).toHaveText('Relationships')
    await expect(page.getByTestId('nav-timing')).toHaveText('Timing')
  })

  test('pt-BR locale loads Portuguese nav', async ({ page }) => {
    await seedSettings(page, 'pt-BR')
    await page.goto('/')
    await expect(page.getByTestId('nav-map')).toHaveText('Mapa')
    await expect(page.getByTestId('nav-relationships')).toHaveText('Relações')
    await expect(page.getByTestId('nav-timing')).toHaveText('Tempo')
  })

  test('Sun planet label translates between locales', async ({ page }) => {
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
    await seedSettings(page, 'pt-BR')
    await page.goto('/astrelio/map/astrology/data')
    await expect(page.getByTestId('planet-Sun')).toContainText('Sol')

    await page.getByTestId('utility-menu-summary').click()
    await page.getByTestId('locale-select').selectOption('en')
    await expect(page.getByTestId('planet-Sun')).toContainText('Sun')
  })

  test('top language selector changes locale and persists it', async ({ page }) => {
    await seedSettings(page, 'pt-BR')
    await page.goto('/')

    await page.getByTestId('utility-menu-summary').click()
    await page.getByTestId('locale-select').selectOption('en')
    await expect(page.getByTestId('nav-map')).toHaveText('Map')
    await expect.poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('astrelio_settings')).locale)
    ).toBe('en')

    await page.reload()
    await page.getByTestId('utility-menu-summary').click()
    await expect(page.getByTestId('locale-select')).toHaveValue('en')
    await expect(page.getByTestId('nav-map')).toHaveText('Map')
  })
})
