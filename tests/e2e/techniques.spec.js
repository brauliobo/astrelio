import { expect, test } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Timing techniques', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('persists solar arc dates and shows timing context chips', async ({ page }) => {
    await page.goto('/#/solar-arc')
    await page.getByTestId('solar-arc-date').fill('2032-04-05')
    await page.reload()
    await expect(page.getByTestId('solar-arc-date')).toHaveValue('2032-04-05')
    await expect(page.getByTestId('timing-context-chips')).toContainText('2032-04-05')
  })

  test('owns Human Design transits and correlations behind the modality switch', async ({ page }) => {
    await page.goto('/#/transits')
    await expect(page.getByTestId('timing-technique-transits')).toBeVisible()
    await expect(page.getByTestId('human-design-timing-tools')).toHaveCount(0)

    await page.getByTestId('timing-modality-human-design').click()

    await expect(page.getByTestId('human-design-timing-tools')).toBeVisible()
    await expect(page.getByTestId('hd-transit-date')).toBeVisible()
    await expect(page.getByTestId('hd-transit-panel')).toBeVisible()
    await expect(page.getByTestId('hd-correlations-panel')).toBeVisible()
  })
})
