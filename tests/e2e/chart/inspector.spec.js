import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from '../support/fixtures.js'

test.describe('Chart inspector', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('opens astrology and Human Design drawers from chart selections', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/data')
    await page.locator('[data-aspect-row]').first().click()
    await expect(page.getByTestId('chart-inspector-drawer')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-aspect')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-pin-count')).toContainText('1')

    await page.getByTestId('chart-inspector-clear-pins').click()
    await expect(page.getByTestId('chart-inspector-drawer')).toBeHidden()

    await page.goto('/astrelio/map/human-design/chart')
    await page.locator('[data-testid="mandala-gate"][data-active="true"]').first().click({ force: true })
    await expect(page.getByTestId('chart-inspector-drawer')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-human-design')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-aspect')).toBeHidden()
  })

  test('shows the complementary sign axis beside the Tropical wheel', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/chart')

    const selected = page.locator('[data-wheel-id="sign-0"]')
    const opposite = page.locator('[data-wheel-id="sign-6"]')
    const stage    = page.getByTestId('chart-wheel-stage')
    const summary  = page.getByTestId('chart-selection-summary')

    await selected.hover()
    await expect(selected).toHaveAttribute('data-highlight', 'active')
    await expect(opposite).toHaveAttribute('data-highlight', 'related')
    await expect(page.getByTestId('sign-axis-guide')).toBeVisible()
    await expect(summary).toContainText('Áries ↔ Libra')
    await expect(summary).toContainText('Eixo Iniciativa e reciprocidade')
    await expect(summary).toContainText('Signo oposto Libra')

    const stageBox   = await stage.boundingBox()
    const summaryBox = await summary.boundingBox()
    if (page.viewportSize().width >= 640)
      expect(summaryBox.x).toBeGreaterThan(stageBox.x + stageBox.width / 2)
    else
      expect(summaryBox.y).toBeGreaterThan(stageBox.y + stageBox.height / 2)

    await selected.click()
    await expect(page.getByTestId('chart-inspector-sign-axis')).toContainText('Iniciativa e reciprocidade')
  })

  test('closes with Escape and returns focus to the context trigger', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/data')
    await page.locator('[data-aspect-row]').first().click()
    await expect(page.getByTestId('chart-inspector-close')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('chart-inspector-drawer')).toBeHidden()
    await page.getByTestId('context-open-inspector').click()
    await expect(page.getByTestId('chart-inspector-close')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('context-open-inspector')).toBeFocused()
  })

  test('navigates pinned selections with the keyboard', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/data')
    await page.locator('[data-aspect-row]').nth(0).click()
    await page.getByTestId('chart-inspector-close').click()
    await page.locator('[data-aspect-row]').nth(1).click()
    await expect(page.getByTestId('chart-inspector-pin')).toHaveCount(2)

    const pins = page.getByTestId('chart-inspector-pin')
    await pins.first().focus()
    await page.keyboard.press('ArrowRight')
    await expect(pins.nth(1)).toBeFocused()
    await page.keyboard.press('Space')
    await expect(pins.nth(1)).toHaveClass(/active/)
  })

  test('persists pinned selections per active chart across reload', async ({ page }) => {
    await page.goto('/astrelio/map/astrology/data')
    await page.locator('[data-aspect-row]').first().click()
    await expect(page.getByTestId('chart-inspector-pin-count')).toContainText('1')

    await page.reload()
    await expect(page.getByTestId('context-open-inspector')).toContainText('(1)')
    await page.getByTestId('context-open-inspector').click()
    await expect(page.getByTestId('chart-inspector-aspect')).toBeVisible()

    await page.getByTestId('chart-inspector-clear-pins').click()
    await page.goto('/astrelio/person/second-person')
    await page.goto('/astrelio/map/astrology/data')
    await expect(page.getByTestId('context-open-inspector')).toBeHidden()
  })
})
