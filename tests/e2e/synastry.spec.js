import { test, expect } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Synastry', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('renders biwheel + cross-aspects', async ({ page }) => {
    await page.goto('/#/synastry')
    await expect(page.getByTestId('synastry-page')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-panel')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-row')).toHaveCount(3)
    await expect(page.getByTestId('biwheel')).toBeVisible()
    await expect(page.getByTestId('aspect-table')).toBeVisible()
  })

  test('compare-with select lists all saved people', async ({ page }) => {
    await page.goto('/#/synastry')
    const select = page.getByTestId('compare-select')
    await expect(select.locator('option')).toHaveCount(3) // empty + 2 people
  })

  test('shows relationship summaries across modalities', async ({ page }) => {
    await page.goto('/#/synastry')
    await expect(page.getByTestId('relationship-summary')).toBeVisible()
    await page.getByTestId('relationship-modality-human-design').click()
    await expect(page.getByTestId('relationship-summary')).toBeVisible()
    await expect(page.getByTestId('human-design-connection')).toBeVisible()
    await expect(page.getByTestId('human-design-team-disclosure')).toBeVisible()
    await expect(page.getByTestId('hd-team-panel')).toHaveCount(0)
    await page.getByTestId('human-design-team-toggle').click()
    await expect(page.getByTestId('hd-team-panel')).toBeVisible()
  })
})
