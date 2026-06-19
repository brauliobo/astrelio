import { expect, test } from '@playwright/test'
import { REF_PERSON, SECOND_PERSON, seedPeople, seedSession, seedSettings } from '../support/fixtures.js'

test.describe('Chart inspector', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON, SECOND_PERSON])
    await seedSession(page, REF_PERSON.id, SECOND_PERSON.id)
  })

  test('opens astrology and Human Design drawers from chart selections', async ({ page }) => {
    await page.goto('/#/natal')
    await page.locator('[data-aspect-row]').first().click()
    await expect(page.getByTestId('chart-inspector-drawer')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-aspect')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-pin-count')).toContainText('1')

    await page.getByTestId('chart-inspector-clear-pins').click()
    await expect(page.getByTestId('chart-inspector-drawer')).toBeHidden()

    await page.goto('/#/human-design')
    await page.locator('[data-testid="mandala-gate"][data-active="true"]').first().click({ force: true })
    await expect(page.getByTestId('chart-inspector-drawer')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-human-design')).toBeVisible()
    await expect(page.getByTestId('chart-inspector-aspect')).toBeHidden()
  })

  test('closes with Escape and returns focus to the context trigger', async ({ page }) => {
    await page.goto('/#/natal')
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
    await page.goto('/#/natal')
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
    await page.goto('/#/natal')
    await page.locator('[data-aspect-row]').first().click()
    await expect(page.getByTestId('chart-inspector-pin-count')).toContainText('1')

    await page.reload()
    await expect(page.getByTestId('context-open-inspector')).toContainText('(1)')
    await page.getByTestId('context-open-inspector').click()
    await expect(page.getByTestId('chart-inspector-aspect')).toBeVisible()

    await page.getByTestId('chart-inspector-clear-pins').click()
    await page.goto('/#/person/second-person')
    await page.goto('/#/natal')
    await expect(page.getByTestId('context-open-inspector')).toBeHidden()
  })
})
