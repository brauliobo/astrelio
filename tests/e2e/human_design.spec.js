import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Human Design', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('renders bodygraph, mandala, activations, and interpretation for the active chart', async ({ page }) => {
    await page.goto('/#/human-design')

    await expect(page.getByTestId('human-design-page')).toBeVisible()
    await expect(page.getByTestId('hd-type')).toBeVisible()
    await expect(page.getByTestId('hd-authority')).toBeVisible()
    await expect(page.getByTestId('hd-profile')).toBeVisible()
    await expect(page.getByTestId('bodygraph-chart')).toBeVisible()
    await expect(page.getByTestId('rave-mandala')).toBeVisible()
    await expect(page.getByTestId('mandala-gate')).toHaveCount(64)
    await expect(page.locator('[data-testid="mandala-gate"][data-active="true"]').first()).toBeVisible()
    await expect(page.getByTestId('human-design-insights')).toBeVisible()
    await expect(page.getByTestId('human-design-activation-table')).toBeVisible()
  })

  test('opens Human Design from the natal map workspace', async ({ page }) => {
    await page.goto('/#/natal')
    await page.getByTestId('open-human-design').click()

    await expect(page).toHaveURL(/\/human-design/)
    await expect(page.getByTestId('human-design-page')).toBeVisible()
  })

  test('switches relationships from astrology synastry to Human Design connection', async ({ page }) => {
    await page.goto('/#/synastry')
    await page.getByTestId('relationship-modality-human-design').click()

    await expect(page.getByTestId('human-design-connection')).toBeVisible()
    await expect(page.getByTestId('human-design-connection-details')).toBeVisible()
    await expect(page.getByTestId('bodygraph-chart')).toHaveCount(2)
  })
})
