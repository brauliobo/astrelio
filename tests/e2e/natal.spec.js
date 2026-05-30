import { test, expect } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from './support/fixtures.js'

test.describe('Natal chart', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('renders chart wheel and planet table for the reference person', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('natal-page')).toBeVisible()
    await expect(page.getByTestId('chart-wheel')).toBeVisible()
    await expect(page.getByTestId('planet-list')).toBeVisible()
    await expect(page.locator('[data-testid="chart-insight"][data-panel="left"]')).toBeVisible()
    await expect(page.locator('[data-testid="chart-insight"][data-panel="right"]')).toBeVisible()

    // SVG produced by @astrodraw/astrochart
    await expect(page.locator('[data-testid="chart-wheel"] svg')).toBeVisible()
  })

  test('displays Aquarius for Sun (1986-02-12 reference)', async ({ page }) => {
    await page.goto('/#/natal')
    const sun = page.getByTestId('planet-Sun')
    await expect(sun).toBeVisible()
    await expect(sun).toContainText(/Aqu[áa]rio|Aquarius/)
  })

  test('displays Cancer for Ascendant', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('asc-sign')).toContainText(/C[âa]ncer|Cancer/)
  })

  test('displays Taurus for Midheaven', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('mc-sign')).toContainText(/Touro|Taurus/)
  })

  test('shows moon phase label', async ({ page }) => {
    await page.goto('/#/natal')
    await expect(page.getByTestId('moon-phase')).toBeVisible()
  })

  test('reactively updates chart wheel colors when theme changes', async ({ page }) => {
    await page.goto('/#/natal')
    const sign       = page.locator('[data-testid="zodiac-ring"] text').first()
    const center     = page.locator('[data-testid="wheel-frame"] circle').nth(4)
    const retrograde = page.locator('.insight-retrograde-chip').first()
    const modality   = page.getByTestId('modality-astrology')
    const darkFill   = await sign.evaluate(el => getComputedStyle(el).fill)

    await page.getByTestId('theme-toggle').click()
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')

    const lightFill       = await sign.evaluate(el => getComputedStyle(el).fill)
    const centerFill      = await center.evaluate(el => getComputedStyle(el).fill)
    const retrogradeColor = await retrograde.evaluate(el => getComputedStyle(el).color)
    const modalityStyles  = await modality.evaluate(el => {
      const styles = getComputedStyle(el)
      return {
        color:           styles.color,
        backgroundColor: styles.backgroundColor,
      }
    })
    expect(lightFill).not.toBe(darkFill)
    expect(centerFill).toBe('rgb(255, 255, 255)')
    expect(retrogradeColor).toBe('rgb(146, 64, 14)')
    expect(modalityStyles.color).toBe('rgb(146, 64, 14)')
    expect(modalityStyles.backgroundColor).toBe('rgba(254, 243, 199, 0.96)')

    await page.getByTestId('planet-hit-Sun').hover({ force: true })
    const summary = page.getByTestId('chart-selection-summary')
    await expect(summary).toBeVisible()
    await expect.poll(() => summary.evaluate(el => getComputedStyle(el).backgroundColor))
      .toBe('rgba(255, 255, 255, 0.94)')
  })

  test('keeps the chart wheel centered in the natal overview', async ({ page }) => {
    await page.goto('/#/natal')
    const centered = await page.getByTestId('chart-wheel').evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return Math.abs((rect.left + rect.width / 2) - window.innerWidth / 2)
    })

    expect(centered).toBeLessThan(72)
  })

  test('keeps the light sky background visible when enabled', async ({ page }) => {
    await page.addInitScript(() => {
      const settings = JSON.parse(localStorage.getItem('astrelio_settings'))
      localStorage.setItem('astrelio_settings', JSON.stringify({
        ...settings,
        skyEnabled: true,
        theme:      'light',
      }))
    })

    await page.goto('/#/natal')
    const sky = page.getByTestId('sky-bg')
    await expect(sky).toHaveAttribute('data-theme', 'light')

    const background = await sky.evaluate(el => getComputedStyle(el).backgroundImage)
    expect(background).toContain('rgb(238, 248, 255)')
  })
})
