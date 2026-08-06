import { expect, test } from '@playwright/test'
import { LONG_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'
import { expectNoUnexpectedHorizontalOverflow, expectWithinViewport } from './support/layout.js'

test.describe('Responsive long-content layout', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [LONG_PERSON])
    await seedSession(page, LONG_PERSON.id)
  })

  test('keeps the current person context and navigation usable at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/#/transits')

    await expect(page.getByTestId('transits-page')).toBeVisible()
    await expect(page.getByTestId('context-person')).toHaveText(LONG_PERSON.name)
    await expect(page.getByTestId('context-birth')).toContainText(LONG_PERSON.placeLabel)
    await expectWithinViewport(page, page.getByTestId('chart-context-bar'))
    await expectNoUnexpectedHorizontalOverflow(page)

    const navOrder = await page.locator('[data-testid^="nav-"]').evaluateAll(links =>
      links.map(link => link.dataset.testid)
    )
    expect(navOrder).toEqual(['nav-relationships', 'nav-timing', 'nav-map', 'nav-charts'])
  })

  test('stacks narrow transit insights and scrolls the fixed-width matrix', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/#/transits')

    await expect(page.getByTestId('transits-page')).toBeVisible()
    await expect(page.getByTestId('biwheel')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('aspect-matrix-stage')).toBeVisible({ timeout: 15000 })
    const insightRows = page.getByTestId('comparison-insight-panel').locator('.comparison-insight-panel__rows')
    await expect(insightRows).toBeVisible()
    const insightColumns = await insightRows.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)
    expect(insightColumns).toBe(1)

    await expect(page.getByTestId('aspect-matrix-stage')).toHaveCSS('overflow-x', 'auto')
    await expectNoUnexpectedHorizontalOverflow(page)
  })

  test('keeps the long-person header and comparison surfaces inside narrow workspaces', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    for (const [path, ready] of [
      ['/#/map/astrology/chart', 'map-page'],
      ['/#/synastry', 'synastry-page'],
      ['/#/report', 'report-page'],
    ]) {
      await page.goto(path)
      await expect(page.getByTestId(ready)).toBeVisible()
      await expectWithinViewport(page, page.getByTestId('chart-context-bar'))
      await expectNoUnexpectedHorizontalOverflow(page)
    }
  })
})
