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
    await expect(page.getByTestId('report-print')).toBeVisible()
  })
})
