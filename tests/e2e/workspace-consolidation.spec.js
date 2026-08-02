import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

const expectFloating = async (summary) => {
  const geometry = await summary.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      position: getComputedStyle(element).position,
      within:   rect.left >= 8 && rect.top >= 8 && rect.right <= window.innerWidth - 8 && rect.bottom <= window.innerHeight - 8,
    }
  })
  expect(geometry.position).toBe('fixed')
  expect(geometry.within).toBe(true)
  expect(geometry.overflow).toBeLessThanOrEqual(0)
}

test.describe('Workspace consolidation', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('preserves the workspace view while switching canonical modality routes', async ({ page }) => {
    await page.goto('/#/map/tropical/reading')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'astrology')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-workspace-view', 'reading')
    await expect(page.getByTestId('natal-page')).toBeVisible()
    await expect(page.locator('[data-testid="reading-reference-chart"] [data-testid="workspace-reference-chart"]')).toBeVisible()
    await expect(page.getByTestId('modality-switch')).toHaveCount(1)
    await expect(page.getByTestId('modality-report')).toHaveCount(0)

    await page.getByTestId('modality-vedic').click()
    await expect(page).toHaveURL(/\/map\/vedic\/reading$/)
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'vedic')
    await expect(page.getByTestId('vedic-page')).toBeVisible()
    await expect(page.locator('[data-testid="reading-reference-chart"] [data-testid="workspace-reference-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="workspace-reference-chart"] [data-testid="nakshatra-ring"]')).toHaveCount(0)
    await page.locator('[data-reading-keyword-id="body:Sun"]').first().hover()
    await expect(page.locator('[data-testid="workspace-reference-chart"] [data-testid="planet-glyph-Sun"]')).toHaveAttribute('data-highlight', 'active')
    const readingSummary = page.getByTestId('chart-selection-summary')
    await expect(readingSummary).toHaveAttribute('data-selection-summary-placement', 'floating')
    await expectFloating(readingSummary)

    await page.getByTestId('workspace-view-data').click()
    await expect(page).toHaveURL(/\/map\/vedic\/data$/)
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-workspace-view', 'data')
    await expect(page.locator('[data-testid="vedic-rasi-panel"] [data-testid="workspace-reference-chart"]')).toBeVisible()
    await page.getByTestId('vedic-position-Sun').hover()
    await expect(page.locator('[data-testid="vedic-rasi-panel"] [data-testid="planet-glyph-Sun"]')).toHaveAttribute('data-highlight', 'active')
    const dataSummary = page.getByTestId('chart-selection-summary')
    await expect(dataSummary).toHaveAttribute('data-selection-summary-placement', 'floating')
    await expectFloating(dataSummary)
  })

  test('supports Human Design aliases and keeps report separate from modalities', async ({ page }) => {
    await page.goto('/#/map/hd/chart')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'humanDesign')
    await expect(page.getByTestId('human-design-page')).toBeVisible()
    await expect(page.getByTestId('modality-switch').getByRole('link')).toHaveCount(3)

    await page.getByTestId('map-report-action').click()
    await expect(page).toHaveURL(/\/report\?modality=human-design$/)
    await expect(page.getByTestId('human-design-print-report')).toBeVisible()
    await expect(page.getByTestId('report-page')).toBeVisible()
  })

  test('opens the report for the canonical Vedic modality', async ({ page }) => {
    await page.goto('/#/map/sidereal/chart')

    await page.getByTestId('map-report-action').click()
    await expect(page).toHaveURL(/\/report\?modality=vedic$/)
    await expect(page.getByTestId('vedic-print-report')).toBeVisible()
  })

  test('embeds non-overflowing references in their owning reading and Data panels', async ({ page }) => {
    const measure = async (parentId, peerId) => page.getByTestId(parentId).evaluate((parent, peerTestId) => {
      const chart = parent.querySelector('[data-testid="workspace-reference-chart"]')
      const peer  = parent.querySelector(`[data-testid="${peerTestId}"]`)
      const parentRect = parent.getBoundingClientRect()
      const chartRect  = chart.getBoundingClientRect()
      const peerRect   = peer.getBoundingClientRect()
      return {
        viewportWidth: window.innerWidth,
        overflow:      document.documentElement.scrollWidth - document.documentElement.clientWidth,
        parentWidth:   parentRect.width,
        chartWidth:    chartRect.width,
        chartLeft:     chartRect.left,
        chartTop:      chartRect.top,
        peerRight:     peerRect.right,
        peerBottom:    peerRect.bottom,
      }
    }, peerId)

    await page.goto('/#/map/astrology/reading')
    const reading = await page.getByTestId('workspace-reference-chart').evaluate((chart) => {
      const section = chart.closest('[data-testid="reading-themes"], [data-testid="reading-prominence"], [data-testid^="reading-chapter-"]')
      return {
        width:    chart.getBoundingClientRect().width,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        section:  section?.dataset.testid || '',
      }
    })
    expect(reading.section).toMatch(/^reading-(?:themes|prominence|chapter-)/)
    expect(reading.width).toBeGreaterThanOrEqual(260)
    expect(reading.width).toBeLessThanOrEqual(300)
    expect(reading.overflow).toBeLessThanOrEqual(0)
    await expect(page.getByTestId('workspace-reference-panel')).toHaveCount(0)

    await page.goto('/#/map/astrology/data')
    const tropical = await measure('natal-aspect-matrix-panel', 'aspect-matrix')
    await expect(page.getByTestId('workspace-reference-panel')).toHaveCount(0)

    await page.goto('/#/map/vedic/data')
    const vedic = await measure('vedic-rasi-panel', 'vedic-position-table')

    for (const metrics of [tropical, vedic]) {
      expect(metrics.overflow).toBeLessThanOrEqual(0)
      expect(metrics.chartWidth).toBeLessThanOrEqual(320)
      expect(metrics.chartWidth).toBeLessThanOrEqual(metrics.parentWidth)
      if (metrics.viewportWidth >= 1024) {
        expect(metrics.chartWidth).toBeGreaterThanOrEqual(280)
        expect(metrics.chartLeft).toBeGreaterThanOrEqual(metrics.peerRight)
        expect(metrics.chartTop).toBeLessThan(metrics.peerBottom)
      } else {
        expect(metrics.chartWidth).toBeGreaterThanOrEqual(240)
        expect(metrics.chartTop).toBeGreaterThanOrEqual(metrics.peerBottom)
      }
    }
  })
})
