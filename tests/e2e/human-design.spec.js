import { expect, test } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSettings } from './support/fixtures.js'
import { expectNoUnexpectedHorizontalOverflow } from './support/layout.js'

const open = async (page, view = 'chart') => {
  await page.goto(`/astrelio/map/human-design/${view}`)
  await expect(page.getByTestId('human-design-page')).toBeVisible()
}

test.describe('Human Design chart workspace', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page, 'en')
    await seedPeople(page, [REF_PERSON])
  })

  test('summarizes the chart and explains a fact in the selection panel', async ({ page }) => {
    await open(page)

    await expect(page.getByTestId('human-design-summary').locator('button')).toHaveCount(8)
    await expect(page.getByTestId('hd-type')).toHaveText('Generator')
    await expect(page.getByTestId('hd-detail-overview')).toBeVisible()

    await page.locator('[data-key="authority"]').click()
    await expect(page.getByTestId('hd-detail-authority')).toContainText('Emotional')
    await page.getByTestId('hd-selection-clear').click()
    await expect(page.getByTestId('hd-detail-overview')).toBeVisible()
  })

  test('links the bodygraph, the activation lists and the panel', async ({ page }) => {
    await open(page)

    await page.locator('[data-focus-id="center:Sacral"]').click()
    await expect(page.getByTestId('hd-detail-center')).toContainText('Sacral')
    await expect(page.locator('.hd-act[data-state="lit"]').first()).toBeVisible()

    const sun = page.locator('[data-testid^="hd-list-"]:visible .hd-act[data-planet="Sun"]').first()
    const gate = await sun.getAttribute('data-gate')
    await sun.click()
    await expect(page.getByTestId('hd-detail-gate')).toContainText(gate)
    await expect(page.locator(`[data-focus-id="gate:${gate}"]`)).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('hd-detail-overview')).toBeVisible()
  })

  test('keeps the bodygraph visible above a compact selection sheet on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await open(page)

    await page.locator('[data-focus-id="center:Sacral"]').dispatchEvent('click')
    const panel = page.getByTestId('hd-selection-panel')
    await expect(page.getByTestId('bodygraph-svg')).toHaveAttribute('data-zoomed', 'true')
    await expect(page.getByTestId('hd-zoom-reset')).toBeVisible()
    await page.waitForTimeout(700)

    const [sheet, figure, tabs] = await Promise.all(
      [panel, page.getByTestId('bodygraph-svg'), page.getByTestId('nav-map')].map(locator => locator.boundingBox()),
    )
    expect(sheet.height).toBeLessThanOrEqual(844 * 0.4)
    expect(sheet.y + sheet.height).toBeLessThanOrEqual(tabs.y)
    expect(figure.y).toBeGreaterThanOrEqual(0)
    expect(figure.y + figure.height).toBeLessThanOrEqual(sheet.y)

    await page.getByTestId('hd-zoom-reset').click()
    await expect(page.getByTestId('bodygraph-svg')).toHaveAttribute('data-zoomed', 'false')
    await expect(panel).toHaveAttribute('data-open', 'true')
  })

  test('switches to the mandala and layers the bodygraph', async ({ page }) => {
    await open(page)

    await page.getByTestId('hd-layer-design').click()
    await expect(page.getByTestId('bodygraph-svg')).toHaveAttribute('data-layers', 'design')
    await page.getByTestId('hd-view-mandala').click()
    await expect(page.getByTestId('rave-mandala')).toBeVisible()
    await expect(page.getByTestId('hd-mandala-panel').getByTestId('mandala-gate-sector')).toHaveCount(64)
  })

  test('keeps the reading and data views mounted', async ({ page }) => {
    await open(page, 'reading')
    await expect(page.getByTestId('workspace-reference-chart')).toBeVisible()

    await open(page, 'data')
    await expect(page.getByTestId('human-design-data')).toBeVisible()
  })

  for (const theme of ['dark', 'light']) {
    test(`fits a 360px phone without horizontal overflow in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => {
        const settings = JSON.parse(localStorage.getItem('astrelio_settings'))
        localStorage.setItem('astrelio_settings', JSON.stringify({ ...settings, theme: value }))
      }, theme)
      await page.setViewportSize({ width: 360, height: 740 })
      await open(page)
      await expectNoUnexpectedHorizontalOverflow(page)

      await page.locator('[data-focus-id="gate:34"]').click({ force: true })
      await expect(page.getByTestId('hd-selection-panel')).toHaveAttribute('data-open', 'true')
      await expectNoUnexpectedHorizontalOverflow(page)
    })
  }
})
