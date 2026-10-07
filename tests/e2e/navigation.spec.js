import { expect, test } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

const TECHNIQUES = ['transits', 'progressions', 'solar-return', 'profections', 'solar-arc', 'lunar-return']

test.describe('Navigation redesign', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('map toolbar keeps the view when the lens changes and the lens when the view changes', async ({ page }) => {
    await page.goto('/#/map/astrology/reading')
    await expect(page.getByTestId('map-toolbar')).toBeVisible()
    await expect(page.getByTestId('context-system')).toBeVisible()

    await page.getByTestId('modality-vedic').click()
    await expect(page).toHaveURL(/\/map\/vedic\/reading$/)
    await page.getByTestId('modality-human-design').click()
    await expect(page).toHaveURL(/\/map\/human-design\/reading$/)
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-workspace-view', 'reading')

    await page.getByTestId('workspace-view-data').click()
    await expect(page).toHaveURL(/\/map\/human-design\/data$/)
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'humanDesign')

    await page.getByTestId('modality-astrology').click()
    await expect(page).toHaveURL(/\/map\/astrology\/data$/)
    await page.getByTestId('workspace-view-chart').click()
    await expect(page).toHaveURL(/\/map\/astrology\/chart$/)
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'astrology')
  })

  test('report tab round trip keeps the lens', async ({ page }) => {
    await page.goto('/#/map/vedic/chart')
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'vedic')

    await page.getByTestId('workspace-view-report').click()
    await expect(page).toHaveURL(/\/report\?modality=vedic$/)
    await expect(page.getByTestId('report-page')).toBeVisible()
    await expect(page.getByTestId('workspace-view-report')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('modality-vedic')).toHaveAttribute('aria-current', 'page')

    await page.getByTestId('workspace-view-chart').click()
    await expect(page).toHaveURL(/\/map\/vedic\/chart$/)
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'vedic')
    await expect(page.getByTestId('workspace-view-chart')).toHaveAttribute('aria-current', 'page')
  })

  test('the report lens switch stays on the report', async ({ page }) => {
    await page.goto('/#/report?modality=vedic')
    await page.getByTestId('modality-human-design').click()
    await expect(page).toHaveURL(/\/report\?modality=human-design$/)
    await expect(page.getByTestId('report-page')).toBeVisible()
  })

  test('technique tabs push canonical timing URLs', async ({ page }) => {
    await page.goto('/#/timing/transits')
    for (const technique of TECHNIQUES) {
      await page.getByTestId(`timing-technique-${technique}`).click()
      await expect(page).toHaveURL(new RegExp(`/timing/${technique}$`))
    }
  })

  test('legacy timing routes redirect to the canonical technique and keep the query', async ({ page }) => {
    for (const technique of TECHNIQUES) {
      await page.goto(`/#/${technique}?probe=1`)
      await expect(page).toHaveURL(new RegExp(`/timing/${technique}\\?probe=1$`))
      await expect(page.getByTestId('timing-page')).toBeVisible()
    }
  })

  test('standalone chart routes keep resolving', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('natal-page')).toBeVisible()
    await page.goto('/#/vedic')
    await expect(page.getByTestId('vedic-page')).toBeVisible()
    await page.goto('/#/human-design')
    await expect(page.getByTestId('human-design-page')).toBeVisible()
    await page.goto('/#/report')
    await expect(page.getByTestId('report-page')).toBeVisible()
  })
})
