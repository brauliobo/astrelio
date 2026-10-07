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
    await expect(page.getByTestId('synastry-insights-section')).toHaveAttribute('open', '')
    await expect(page.getByTestId('comparison-insight-panel')).toBeVisible()
    await expect(page.getByTestId('comparison-insight-row')).toHaveCount(3)
    await expect(page.getByTestId('biwheel')).toBeVisible()
  })

  test('keeps the aspect table collapsed until its section is opened', async ({ page }) => {
    await page.goto('/#/synastry')
    await expect(page.getByTestId('biwheel')).toBeVisible()
    await expect(page.getByTestId('synastry-aspects-section')).not.toHaveAttribute('open', '')
    await expect(page.getByTestId('aspect-table')).toBeHidden()

    await page.getByTestId('synastry-aspects-section').locator('summary').click()
    await expect(page.getByTestId('aspect-table')).toBeVisible()
  })

  test('compare-with select lists all saved people', async ({ page }) => {
    await page.goto('/#/synastry')
    await expect(page.getByTestId('synastry-pair-bar')).toBeVisible()
    await expect(page.getByTestId('compare-select').locator('option')).toHaveCount(3) // empty + 2 people
    await expect(page.getByTestId('synastry-person-a').locator('option')).toHaveCount(2)
    await expect(page.getByTestId('synastry-person-a')).toHaveValue(REF_PERSON.id)
    await expect(page.getByTestId('compare-select')).toHaveValue(SECOND_PERSON.id)
  })

  test('puts the biwheel above the fold', async ({ page }) => {
    await page.goto('/#/synastry')
    const biwheel = page.getByTestId('biwheel')
    await expect(biwheel).toBeVisible()

    const mobile = (page.viewportSize()?.width ?? 1280) < 700
    const { y }  = await biwheel.boundingBox()
    expect(y + await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(mobile ? 330 : 200)
  })

  test('swaps person A and person B', async ({ page }) => {
    await page.goto('/#/synastry')
    await page.getByTestId('synastry-swap').click()

    await expect(page.getByTestId('synastry-person-a')).toHaveValue(SECOND_PERSON.id)
    await expect(page.getByTestId('compare-select')).toHaveValue(REF_PERSON.id)

    await page.getByTestId('synastry-swap').click()
    await expect(page.getByTestId('synastry-person-a')).toHaveValue(REF_PERSON.id)
    await expect(page.getByTestId('compare-select')).toHaveValue(SECOND_PERSON.id)
  })

  test('shows relationship summaries across modalities', async ({ page }) => {
    await page.goto('/#/synastry')
    await expect(page.getByTestId('relationship-summary')).toBeVisible()
    await page.getByTestId('relationship-modality-human-design').click()
    await expect(page.getByTestId('relationship-summary')).toBeVisible()
    await expect(page.getByTestId('human-design-connection')).toBeVisible()
    await expect(page.getByTestId('human-design-connection-details')).toHaveAttribute('open', '')
    await expect(page.getByTestId('human-design-team-disclosure')).toBeVisible()
    await expect(page.getByTestId('hd-team-panel')).toHaveCount(0)
    await page.getByTestId('human-design-team-toggle').click()
    await expect(page.getByTestId('hd-team-panel')).toBeVisible()
  })
})

test.describe('Synastry without a pair', () => {
  test('invites the user to add a second chart', async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)

    await page.goto('/#/synastry')
    await expect(page.getByTestId('synastry-empty')).toBeVisible()
    await expect(page.getByTestId('synastry-pair-bar')).toHaveCount(0)
    await expect(page.getByTestId('synastry-empty-cta')).toBeVisible()
  })
})
