import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Workspace consolidation', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('serves map lenses through the shared map shell', async ({ page }) => {
    await page.goto('/#/map/astrology')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'astrology')
    await expect(page.getByTestId('natal-page')).toBeVisible()

    await page.goto('/#/map/human-design')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'humanDesign')
    await expect(page.getByTestId('human-design-page')).toBeVisible()

    await page.goto('/#/map/report')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'report')
    await expect(page.getByTestId('report-page')).toBeVisible()
  })

  test('opens the command palette and runs commands with the keyboard', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('command-palette-trigger').click()
    await expect(page.getByTestId('command-palette')).toBeVisible()

    await page.getByTestId('command-palette-input').fill('human design')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/human-design/)
    await expect(page.getByTestId('human-design-page')).toBeVisible()
  })

  test('uses palette grouping, empty state, chart switching, and timing commands', async ({ page }) => {
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

  test('opens astrology and Human Design inspector drawers from chart selections', async ({ page }) => {
    await page.goto('/#/natal')
    await page.locator('[data-aspect-row]').first().click()
    await expect(page.getByTestId('chart-inspector-drawer')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-aspect')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-pin-count')).toContainText('1')
    await expect(page.getByTestId('context-open-inspector')).toBeVisible()

    await page.getByTestId('chart-inspector-close').click()
    await expect(page.getByTestId('context-open-inspector')).toContainText('(1)')
    await page.getByTestId('context-open-inspector').click()
    await expect(page.getByTestId('chart-inspector-drawer')).toBeVisible()
    await page.getByTestId('chart-inspector-clear-pins').click()
    await expect(page.getByTestId('chart-inspector-drawer')).toBeHidden()

    await page.goto('/#/human-design')
    await page.locator('[data-testid="mandala-gate"][data-active="true"]').first().click({ force: true })
    await expect(page.getByTestId('chart-inspector-drawer')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-human-design')).toBeVisible()
  })

  test('uses report presets to hide and restore report sections', async ({ page }) => {
    await page.goto('/#/report')
    await expect(page.getByTestId('report-builder')).toBeVisible()
    await expect(page.getByTestId('report-interpretations-section')).toBeVisible()

    await page.getByTestId('report-preset').selectOption('technical')
    await expect(page.getByTestId('report-interpretations-section')).toBeHidden()
    await expect(page.getByTestId('report-aspectarian-section')).toBeVisible()

    await page.reload()
    await expect(page.getByTestId('report-interpretations-section')).toBeHidden()
  })

  test('persists timing technique dates and shows relationship summaries', async ({ page }) => {
    await page.goto('/#/solar-arc')
    await page.getByTestId('solar-arc-date').fill('2032-04-05')
    await page.reload()
    await expect(page.getByTestId('solar-arc-date')).toHaveValue('2032-04-05')
    await expect(page.getByTestId('timing-context-chips')).toContainText('2032-04-05')

    await page.goto('/#/synastry')
    await expect(page.getByTestId('relationship-summary')).toBeVisible()
    await page.getByTestId('relationship-modality-human-design').click()
    await expect(page.getByTestId('relationship-summary')).toBeVisible()
    await expect(page.getByTestId('human-design-connection')).toBeVisible()
  })
})
