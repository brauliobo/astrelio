import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('i18n', () => {
  test('en locale loads English nav', async ({ page }) => {
    await seedSettings(page, 'en')
    await page.goto('/')
    await expect(page.getByTestId('nav-home')).toHaveText('Home')
    await expect(page.getByTestId('nav-natal')).toHaveText('Natal')
    await expect(page.getByTestId('nav-transits')).toHaveText('Transits')
  })

  test('pt-BR locale loads Portuguese nav', async ({ page }) => {
    await seedSettings(page, 'pt-BR')
    await page.goto('/')
    await expect(page.getByTestId('nav-home')).toHaveText('Início')
    await expect(page.getByTestId('nav-natal')).toHaveText('Mapa Natal')
  })

  test('Sun planet label translates between locales', async ({ page }) => {
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
    await seedSettings(page, 'pt-BR')
    await page.goto('/#/natal')
    await expect(page.getByTestId('planet-Sun')).toContainText('Sol')

    await page.evaluate(() => localStorage.setItem('astrelio_locale', 'en'))
    await page.reload()
    await expect(page.getByTestId('planet-Sun')).toContainText('Sun')
  })
})
