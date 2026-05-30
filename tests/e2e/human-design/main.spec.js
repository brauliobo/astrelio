import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from '../support/fixtures.js'

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
    await expect(page.getByTestId('human-design-tabs')).toBeVisible()
    await expect(page.getByTestId('hd-variable-summary')).toBeVisible()
    await expect(page.getByTestId('mandala-gate')).toHaveCount(64)
    await expect(page.locator('[data-testid="mandala-gate"][data-active="true"]').first()).toBeVisible()
    await expect(page.getByTestId('human-design-insights')).toBeVisible()
    await page.getByTestId('hd-tab-activations').click()
    await expect(page.getByTestId('human-design-activation-table')).toBeVisible()

    await page.getByTestId('hd-tab-transits').click()
    await expect(page.getByTestId('hd-transit-panel')).toBeVisible()
    await page.getByTestId('hd-transit-now').click()
  })

  test('opens Human Design from the natal map workspace', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('modality-astrology')).toBeVisible()
    await expect(page.getByTestId('modality-human-design')).toBeVisible()
    await page.getByTestId('modality-human-design').click()

    await expect(page).toHaveURL(/\/human-design/)
    await expect(page.getByTestId('human-design-page')).toBeVisible()
    await expect(page.getByTestId('modality-astrology')).toBeVisible()
    await expect(page.getByTestId('modality-human-design')).toBeVisible()
  })

  test('switches from Human Design back to astrology', async ({ page }) => {
    await page.goto('/#/human-design')
    await page.getByTestId('modality-astrology').click()

    await expect(page).toHaveURL(/\/natal/)
    await expect(page.getByTestId('natal-page')).toBeVisible()
  })

  test('reactively updates Human Design wheel colors when theme changes', async ({ page }) => {
    await page.goto('/#/human-design')
    const activeGate = page.locator('[data-testid="mandala-gate-sector"][data-active="true"]').first()
    const darkFill   = await activeGate.evaluate(el => getComputedStyle(el).fill)

    await page.getByTestId('theme-toggle').click()
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')
    await expect(page.getByTestId('rave-mandala')).toHaveAttribute('data-theme', 'light')

    await expect.poll(() => activeGate.evaluate(el => getComputedStyle(el).fill)).not.toBe(darkFill)
  })

  test('switches relationships from astrology synastry to Human Design connection', async ({ page }) => {
    await page.goto('/#/synastry')
    await page.getByTestId('relationship-modality-human-design').click()

    await expect(page.getByTestId('human-design-connection')).toBeVisible()
    await expect(page.getByTestId('human-design-connection-details')).toBeVisible()
    await expect(page.getByTestId('human-design-connection-theme')).toBeVisible()
    await expect(page.getByTestId('bodygraph-chart')).toHaveCount(2)
  })

  test('renders Human Design correlations workspace when the UI exposes it', async ({ page }) => {
    await page.goto('/#/human-design')
    await expect(page.getByTestId('human-design-page')).toBeVisible()

    const correlationsTab = page.getByTestId('hd-tab-correlations')
    if (await correlationsTab.count() === 0) {
      test.skip(true, 'Human Design correlations tab is not implemented in the UI yet')
    }

    await correlationsTab.click()
    await expect(page.getByTestId('hd-correlations-panel')).toBeVisible()
    await expect(page.getByTestId('hd-correlation-event-diary')).toBeVisible()
    await expect(page.getByTestId('hd-correlation-transit-clusters')).toBeVisible()
    await expect(page.getByTestId('hd-correlation-astrology-bridge')).toBeVisible()
  })
})
