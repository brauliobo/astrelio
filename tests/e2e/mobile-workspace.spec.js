import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

const expectWithinViewport = async (page, locator) => {
  const box      = await locator.boundingBox()
  const viewport = page.viewportSize()

  expect(box).not.toBeNull()
  expect(box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.x).toBeGreaterThanOrEqual(0)
}

test.describe('Mobile workspace surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('keeps command palette and workspace controls within the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/astrelio/map/astrology/chart')
    await expectWithinViewport(page, page.getByTestId('shell-utilities'))
    await expect(page.getByTestId('context-open-inspector')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByTestId('command-palette-trigger').click()
    await expect(page.getByTestId('command-palette')).toBeVisible()
    await expectWithinViewport(page, page.getByTestId('command-palette'))
    await page.keyboard.press('Escape')

    await page.getByTestId('utility-menu-summary').click()
    await expectWithinViewport(page, page.getByTestId('utility-menu'))
    await expectWithinViewport(page, page.getByTestId('utility-settings'))
    await page.getByTestId('utility-menu-summary').click()

    const sun = page.getByTestId('planet-glyph-Sun')
    await sun.focus()
    await sun.press('Space')
    await expect(sun).toHaveAttribute('data-highlight', 'active')
    await expect(page.getByTestId('chart-selection-summary')).toBeVisible()
    await expectWithinViewport(page, page.getByTestId('chart-selection-summary'))
    await sun.press('Space')
    await expect(sun).toHaveAttribute('data-highlight', 'idle')
    await expect(page.getByTestId('chart-selection-summary')).toBeHidden()
  })

  test('renders map lenses, timing chips, and report controls on narrow screens', async ({ page }) => {
    await page.goto('/#/map/astrology')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'astrology')
    await expect(page.getByTestId('natal-page')).toBeVisible()

    await page.goto('/#/map/human-design')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'humanDesign')
    await expect(page.getByTestId('human-design-page')).toBeVisible()

    await page.goto('/#/solar-arc')
    await page.getByTestId('solar-arc-date').fill('2032-04-05')
    await page.reload()
    await expect(page.getByTestId('timing-context-chips')).toContainText('2032-04-05')
    await expectWithinViewport(page, page.getByTestId('timing-context-chips'))

    await page.goto('/#/report')
    await expect(page.getByTestId('report-builder')).toBeVisible()
    await expect(page.getByTestId('report-svg')).toBeVisible()
    await expect(page.getByTestId('report-png')).toBeVisible()
    await page.getByTestId('report-preset').selectOption('technical')
    await expect(page.getByTestId('report-interpretations-section')).toBeHidden()
    await page.getByTestId('report-section-positions').locator('input').uncheck()
    await expect(page.getByTestId('report-position-lists')).toBeHidden()
  })
})
