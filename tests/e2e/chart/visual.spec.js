import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from '../support/fixtures.js'

const TRANSIT_DATE_MS = Date.UTC(2026, 0, 15, 12, 0, 0)

const expectScreenshotSmoke = async (locator, minBytes = 8000) => {
  await expect(locator).toBeVisible()
  const screenshot = await locator.screenshot()
  expect(screenshot.length).toBeGreaterThan(minBytes)
}

test.describe('Tropical visual smoke', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id, null, { transitDateMs: TRANSIT_DATE_MS })
  })

  test('captures the natal wheel with visible SVG content', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/#/natal')

    await expect(page.getByTestId('chart-wheel-svg')).toBeVisible()
    const svgHealth = await page.getByTestId('chart-wheel-svg').evaluate((svg) => ({
      width: svg.getBoundingClientRect().width,
      height: svg.getBoundingClientRect().height,
      marks: svg.querySelectorAll('path, text, line, circle, polygon').length,
    }))

    expect(svgHealth.width).toBeGreaterThan(360)
    expect(svgHealth.height).toBeGreaterThan(360)
    expect(svgHealth.marks).toBeGreaterThan(80)
    await expectScreenshotSmoke(page.getByTestId('natal-chart-panel'), 18000)
  })

  test('captures the transit orbit after enabling the exterior orbit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/#/natal')

    await page.getByTestId('chart-toggle-transit-orbit').click()
    await expect(page.getByTestId('transit-orbit-frame')).toBeVisible()
    await expect(page.getByTestId('chart-wheel')).toHaveAttribute('data-chart-mode', 'detailed')
    await expectScreenshotSmoke(page.getByTestId('natal-chart-panel'), 20000)
  })

  test('captures the printable aspectarian section with position lists', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.goto('/#/report')

    await expect(page.getByTestId('tropical-print-report')).toBeVisible()
    await expect(page.getByTestId('aspect-matrix')).toBeVisible()
    await expect(page.getByTestId('aspect-matrix-natal-positions')).toBeVisible()
    await expect(page.getByTestId('aspect-matrix-transit-positions')).toBeVisible()
    await expect(page.locator('[data-aspect-grid-cell]:not([data-aspect-grid-cell=""])').first()).toBeVisible()
    await expectScreenshotSmoke(page.getByTestId('report-aspectarian-section'), 18000)
  })

  test('keeps the printable report usable on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#/report')

    await expect(page.getByTestId('tropical-print-report')).toBeVisible()
    await expect(page.getByTestId('chart-wheel')).toBeVisible()
    await expect(page.getByTestId('report-position-lists')).toBeVisible()

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      wheelWidth: document.querySelector('[data-testid="chart-wheel"]')?.getBoundingClientRect().width || 0,
    }))

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport + 2)
    expect(layout.wheelWidth).toBeGreaterThan(300)
    expect(layout.wheelWidth).toBeLessThanOrEqual(layout.viewport - 32)
    await expectScreenshotSmoke(page.getByTestId('tropical-print-report'), 20000)
  })
})
