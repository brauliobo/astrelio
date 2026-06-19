import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Command palette', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('opens and runs navigation commands with the keyboard', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('command-palette-trigger').click()
    await expect(page.getByTestId('command-palette')).toBeVisible()
    await expect(page.getByTestId('command-palette-input')).toBeFocused()

    await page.getByTestId('command-palette-input').fill('human design')
    await expect(page.getByTestId('command-human-design')).toBeVisible()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/human-design/)
    await expect(page.getByTestId('human-design-page')).toBeVisible()
    await expect(page.getByTestId('command-palette')).toBeHidden()
  })

  test('groups empty, people, and timing command results', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('command-palette-trigger').click()
    await page.getByTestId('command-palette-input').fill('not-a-real-command')
    await expect(page.getByTestId('command-palette-empty')).toContainText('not-a-real-command')

    await page.getByTestId('command-palette-input').fill(SECOND_PERSON.name)
    await expect(page.getByTestId('command-group-people')).toBeVisible()
    await expect(page.getByTestId(`command-person-${SECOND_PERSON.id}`)).toContainText(SECOND_PERSON.name)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('context-person')).toContainText(SECOND_PERSON.name)

    await page.getByTestId('command-palette-trigger').click()
    await page.getByTestId('command-palette-input').fill('transits now')
    await expect(page.getByTestId('command-group-techniques')).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/transits/)
  })

  test('pins planets from command results', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('command-palette-trigger').click()
    await page.getByTestId('command-palette-input').fill('Sun inspect')
    await page.getByTestId('command-planet-Sun').click()

    await expect(page.getByTestId('chart-inspector-drawer')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-body-Sun')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-pin-count')).toContainText('1')
    await expect(page.getByTestId('chart-inspector-human-design')).toBeHidden()
  })

  test('applies chart and report presets from commands', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('command-palette-trigger').click()
    await page.getByTestId('command-palette-input').fill('chart preset technical')
    await page.getByTestId('command-setting-preset-technical').click()

    const settingsAfterChartPreset = await page.evaluate(() => JSON.parse(localStorage.getItem('astrelio_settings')))
    expect(settingsAfterChartPreset.zodiac).toBe('sidereal')

    await page.getByTestId('command-palette-trigger').click()
    await page.getByTestId('command-palette-input').fill('report preset summary')
    await page.getByTestId('command-report-preset-summary').click()

    await expect(page).toHaveURL(/\/report/)
    await expect(page.getByTestId('report-interpretations-section')).toBeHidden()
  })
})
