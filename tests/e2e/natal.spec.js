import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

const expectBelowStage = async (page, summary) => {
  const geometry = await summary.evaluate((element) => {
    const wheel = element.closest('[data-testid="chart-wheel"]')
    const stage = wheel.querySelector('[data-testid="chart-wheel-stage"]')
    const summaryRect = element.getBoundingClientRect()
    const stageRect   = stage.getBoundingClientRect()
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      position: getComputedStyle(element).position,
      summaryTop: summaryRect.top,
      stageBottom: stageRect.bottom,
    }
  })
  expect(geometry.position).toBe('static')
  expect(geometry.summaryTop).toBeGreaterThanOrEqual(geometry.stageBottom)
  expect(geometry.overflow).toBeLessThanOrEqual(0)
}

test.describe('Natal chart', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('separates the direct natal route into chart, reading, and data views', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('natal-page')).toBeVisible()
    await expect(page.getByTestId('chart-wheel')).toBeVisible()
    await expect(page.getByTestId('natal-view-switch')).toBeVisible()
    await expect(page.locator('[data-testid="chart-insight"][data-panel="left"]')).toBeVisible()
    await expect(page.locator('[data-testid="chart-insight"][data-panel="right"]')).toHaveCount(0)

    // SVG produced by @astrodraw/astrochart
    await expect(page.locator('[data-testid="chart-wheel"] svg')).toBeVisible()

    await page.getByTestId('natal-view-reading').click()
    await expect(page.getByTestId('reading-document-view')).toBeVisible()
    await expect(page.locator('[data-testid="reading-reference-chart"] [data-testid="workspace-reference-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="reading-document-view"] [data-testid="chart-wheel"]')).toHaveAttribute('data-chart-mode', 'clean')
    await expect(page.getByTestId('workspace-reference-panel')).toHaveCount(0)
    await expect(page.locator('[data-testid="workspace-reference-chart"] .chart-wheel-toolbar')).toHaveCount(0)
    await expect(page.locator('[data-testid="workspace-reference-chart"] [data-testid="aspect-layer"]')).toHaveCount(0)
    await page.locator('[data-reading-keyword-id="body:Sun"]').first().hover()
    await expect(page.locator('[data-testid="workspace-reference-chart"] [data-testid="planet-glyph-Sun"]')).toHaveAttribute('data-highlight', 'active')
    const readingSummary = page.locator('[data-testid="workspace-reference-chart"] [data-testid="chart-selection-summary"]')
    await expect(readingSummary).toHaveAttribute('data-selection-summary-placement', 'below')
    await expect(readingSummary).toContainText(/Sun|Sol/)
    await expect(readingSummary).toContainText(/Aquarius|Aquário/)
    await expectBelowStage(page, readingSummary)

    await page.getByTestId('natal-view-data').click()
    await expect(page.getByTestId('natal-data')).toBeVisible()
    await expect(page.getByTestId('planet-list')).toBeVisible()
    await expect(page.locator('[data-testid="natal-aspect-matrix-panel"] [data-testid="workspace-reference-chart"]')).toBeVisible()
    await expect(page.getByTestId('workspace-reference-panel')).toHaveCount(0)
    await page.locator('[data-testid="natal-aspect-matrix-panel"] [data-testid="planet-glyph-Sun"]').dispatchEvent('mouseenter')
    const dataSummary = page.locator('[data-testid="natal-aspect-matrix-panel"] [data-testid="chart-selection-summary"]')
    await expect(dataSummary).toHaveAttribute('data-selection-summary-placement', 'below')
    await expectBelowStage(page, dataSummary)
  })

  test('displays Aquarius for Sun (1986-02-12 reference)', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('natal-view-data').click()
    const sun = page.getByTestId('planet-Sun')
    await expect(sun).toBeVisible()
    await expect(sun).toContainText(/Aqu[áa]rio|Aquarius/)
  })

  test('shows the complementary sign axis beside the Tropical wheel', async ({ page }) => {
    await page.goto('/#/map/astrology/chart')

    const selected = page.locator('[data-wheel-id="sign-0"]')
    const opposite = page.locator('[data-wheel-id="sign-6"]')
    const stage    = page.getByTestId('chart-wheel-stage')
    const summary  = page.getByTestId('chart-selection-summary')

    await selected.hover()
    await expect(selected).toHaveAttribute('data-highlight', 'active')
    await expect(opposite).toHaveAttribute('data-highlight', 'related')
    await expect(page.getByTestId('sign-axis-guide')).toBeVisible()
    await expect(summary).toContainText('Áries ↔ Libra')
    await expect(summary).toContainText('Eixo Iniciativa e reciprocidade')
    await expect(summary).toContainText('Signo oposto Libra')
    await expect(summary).toHaveAttribute('data-selection-summary-placement', 'overlay')

    const stageBox   = await stage.boundingBox()
    const summaryBox = await summary.boundingBox()
    if (page.viewportSize().width >= 640)
      expect(summaryBox.x).toBeGreaterThan(stageBox.x + stageBox.width / 2)
    else
      expect(summaryBox.y).toBeGreaterThan(stageBox.y + stageBox.height / 2)

    await selected.click()
    await expect(selected).toHaveAttribute('data-highlight', 'active')
    await expect(summary).toBeVisible()
  })

  test('displays Cancer for Ascendant', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('natal-view-data').click()
    await expect(page.getByTestId('asc-sign')).toContainText(/C[âa]ncer|Cancer/)
  })

  test('displays Taurus for Midheaven', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('natal-view-data').click()
    await expect(page.getByTestId('mc-sign')).toContainText(/Touro|Taurus/)
  })

  test('shows moon phase label', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('natal-view-data').click()
    await expect(page.getByTestId('moon-phase')).toBeVisible()
  })

  test('uses Map-owned workspace controls without duplicating the modality switch', async ({ page }) => {
    await page.goto('/#/map/astrology/reading')

    await expect(page.getByTestId('map-page')).toHaveAttribute('data-workspace-view', 'reading')
    await expect(page.getByTestId('reading-document-view')).toBeVisible()
    await expect(page.getByTestId('modality-switch')).toHaveCount(1)
    await expect(page.getByTestId('natal-view-switch')).toHaveCount(0)
    await expect(page.getByTestId('open-report')).toHaveCount(0)
    await expect(page.getByTestId('natal-page').locator('h1')).toHaveCount(0)
  })

  test('reactively updates chart wheel colors when theme changes', async ({ page }) => {
    await page.goto('/#/natal')
    const sign       = page.locator('[data-testid="zodiac-ring"] text').first()
    const center     = page.locator('[data-testid="wheel-frame"] circle').nth(4)
    const retrograde = page.locator('.insight-retrograde-chip').first()
    const modality   = page.getByTestId('modality-astrology')
    const darkFill   = await sign.evaluate(el => getComputedStyle(el).fill)

    await page.getByTestId('utility-menu-summary').click()
    await page.getByTestId('theme-toggle').click()
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')

    const lightFill       = await sign.evaluate(el => getComputedStyle(el).fill)
    const centerFill      = await center.evaluate(el => getComputedStyle(el).fill)
    const retrogradeColor = await retrograde.count()
      ? await retrograde.evaluate(el => getComputedStyle(el).color)
      : ''
    const modalityStyles  = await modality.evaluate(el => {
      const styles = getComputedStyle(el)
      return {
        color:           styles.color,
        backgroundColor: styles.backgroundColor,
      }
    })
    expect(lightFill).not.toBe(darkFill)
    expect(centerFill).toBe('rgb(255, 255, 255)')
    if (retrogradeColor) expect(retrogradeColor).toBe('rgb(146, 64, 14)')
    expect(modalityStyles.color).toBe('rgb(146, 64, 14)')
    expect(modalityStyles.backgroundColor).toBe('rgba(254, 243, 199, 0.96)')

    await page.getByTestId('planet-hit-Sun').hover({ force: true })
    const summary = page.getByTestId('chart-selection-summary')
    await expect(summary).toBeVisible()
    await expect.poll(() => summary.evaluate(el => getComputedStyle(el).backgroundColor))
      .toBe('rgba(255, 255, 255, 0.94)')
  })

  test('keeps the chart wheel centered in the natal overview', async ({ page }) => {
    await page.goto('/#/natal')
    const centered = await page.getByTestId('chart-wheel').evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return Math.abs((rect.left + rect.width / 2) - window.innerWidth / 2)
    })

    expect(centered).toBeLessThan(72)
  })

  test('keeps the light sky background visible when enabled', async ({ page }) => {
    await page.addInitScript(() => {
      const settings = JSON.parse(localStorage.getItem('astrelio_settings'))
      localStorage.setItem('astrelio_settings', JSON.stringify({
        ...settings,
        skyEnabled: true,
        theme:      'light',
      }))
    })

    await page.goto('/#/natal')
    const sky = page.getByTestId('sky-bg')
    await expect(sky).toHaveAttribute('data-theme', 'light')

    const background = await sky.evaluate(el => getComputedStyle(el).backgroundImage)
    expect(background).toContain('rgb(238, 248, 255)')
  })
})
