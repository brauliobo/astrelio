import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

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
    await expect(page.getByTestId('modality-switch')).toHaveCount(1)
    await expect(page.getByTestId('modality-report')).toHaveCount(0)

    await page.getByTestId('modality-vedic').click()
    await expect(page).toHaveURL(/\/map\/vedic\/reading$/)
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-map-lens', 'vedic')
    await expect(page.getByTestId('vedic-page')).toBeVisible()

    await page.getByTestId('workspace-view-data').click()
    await expect(page).toHaveURL(/\/map\/vedic\/data$/)
    await expect(page.getByTestId('map-page')).toHaveAttribute('data-workspace-view', 'data')
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
})
