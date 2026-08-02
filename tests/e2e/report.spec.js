import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Report', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('opens printable natal report from the natal chart', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('open-report').click()

    await expect(page).toHaveURL(/\/report/)
    await expect(page.getByTestId('report-page')).toBeVisible()
    await expect(page.getByTestId('chart-insight')).toBeVisible()
    await expect(page.getByTestId('reading-document-view')).toBeVisible()
    await expect(page.getByTestId('report-print')).toBeVisible()
  })

  test('downloads the current chart images from the report', async ({ page }) => {
    await page.goto('/#/report')
    await expect(page.getByTestId('chart-wheel-svg')).toBeVisible()

    let downloadPromise = page.waitForEvent('download')
    await page.getByTestId('report-svg').click()
    let download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^astrelio-braulio-chart-.*\.svg$/)
    await expect(page.getByTestId('report-export-status')).toHaveText(/SVG/)

    downloadPromise = page.waitForEvent('download')
    await page.getByTestId('report-png').click()
    download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^astrelio-braulio-chart-.*\.png$/)
    await expect(page.getByTestId('report-export-status')).toHaveText(/PNG/)
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

  test('resolves Tropical report aliases to the existing report builder', async ({ page }) => {
    for (const alias of ['astrology', 'tropical']) {
      await page.goto(`/#/report?modality=${alias}`)
      await expect(page.locator('[data-modality="tropical"]')).toBeVisible()
      await expect(page.getByTestId('report-builder')).toBeVisible()
      await expect(page.getByTestId('reading-document-view')).toBeVisible()
    }
  })

  test('renders the async Vedic visual and normalized reading for sidereal aliases', async ({ page }) => {
    for (const alias of ['vedic', 'sidereal']) {
      await page.goto(`/#/report?modality=${alias}`)
      await expect(page.getByTestId('vedic-print-report')).toBeVisible()
      await expect(page.getByTestId('chart-wheel-svg')).toBeVisible()
      await expect(page.getByTestId('reading-document-view')).toBeVisible()
      await expect(page.getByTestId('report-print')).toBeVisible()
    }
  })

  test('renders the Human Design visual and normalized reading', async ({ page }) => {
    await page.goto('/#/report?modality=human-design')

    await expect(page.getByTestId('human-design-print-report')).toBeVisible()
    await expect(page.getByTestId('bodygraph-svg')).toBeVisible()
    await expect(page.getByTestId('reading-document-view')).toBeVisible()
    await expect(page.getByTestId('report-print')).toBeVisible()
  })
})
