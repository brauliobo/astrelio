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

})
