import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from '../support/fixtures.js'

test.describe('Human Design', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('organizes the active chart into Chart, Reading, and Data views', async ({ page }) => {
    await page.goto('/#/map/human-design/chart')

    await expect(page.getByTestId('human-design-page')).toBeVisible()
    await expect(page.getByTestId('workspace-view-switch')).toBeVisible()
    await expect(page.getByTestId('workspace-view-chart')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('modality-switch')).toHaveCount(1)
    await expect(page.getByTestId('hd-type')).toBeVisible()
    await expect(page.getByTestId('hd-authority')).toBeVisible()
    await expect(page.getByTestId('hd-profile')).toBeVisible()
    await expect(page.getByTestId('bodygraph-chart')).toBeVisible()
    await expect(page.getByTestId('rave-mandala')).toBeVisible()
    await expect(page.getByTestId('hd-variable-summary')).toBeVisible()
    await expect(page.getByTestId('mandala-gate')).toHaveCount(64)
    await expect(page.locator('[data-testid="mandala-gate"][data-active="true"]').first()).toBeVisible()
    await expect(page.getByTestId('human-design-insights')).toBeVisible()

    await page.getByTestId('workspace-view-reading').click()
    await expect(page).toHaveURL(/\/map\/human-design\/reading$/)
    await expect(page.getByTestId('reading-document-view')).toBeVisible()

    await page.getByTestId('workspace-view-data').click()
    await expect(page).toHaveURL(/\/map\/human-design\/data$/)
    await expect(page.getByTestId('human-design-data')).toBeVisible()
    await page.getByTestId('hd-data-toggle-activations').click()
    await expect(page.getByTestId('human-design-activation-table')).toBeVisible()

    await expect(page.getByTestId('hd-data-section-transits')).toHaveCount(0)
    await expect(page.getByTestId('hd-data-section-correlations')).toHaveCount(0)
    await expect(page.getByTestId('hd-data-section-team')).toHaveCount(0)
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

    await expect(page).toHaveURL(/\/map\/astrology\/chart$/)
    await expect(page.getByTestId('natal-page')).toBeVisible()
  })

  test('reactively updates Human Design wheel colors when theme changes', async ({ page }) => {
    await page.goto('/#/human-design')
    const activeGate = page.locator('[data-testid="mandala-gate-sector"][data-active="true"]').first()
    const darkFill   = await activeGate.evaluate(el => getComputedStyle(el).fill)

    await page.getByTestId('utility-menu-summary').click()
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

  test('renders Human Design correlations in Timing', async ({ page }) => {
    await page.goto('/#/transits')
    await page.getByTestId('timing-modality-human-design').click()
    await expect(page.getByTestId('hd-correlations-panel')).toBeVisible()
    await expect(page.getByTestId('hd-correlation-event-diary')).toBeVisible()
    await expect(page.getByTestId('hd-correlation-transit-clusters')).toBeVisible()
    await expect(page.getByTestId('hd-correlation-astrology-bridge')).toBeVisible()
  })
})
