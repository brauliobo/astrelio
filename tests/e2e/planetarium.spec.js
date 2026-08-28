import { test, expect } from '@playwright/test'
import { seedSettings } from './support/fixtures.js'

const openPlanetarium = async (page, view = '') => {
  await page.goto(`/astrelio/planetarium/${view}`)
  await expect(page.getByTestId('planetarium-page')).toBeVisible()
}

test.describe('Planetarium', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page) })

  test('renders the 3D stage and the four views', async ({ page }) => {
    await openPlanetarium(page)
    await expect(page.getByTestId('planetarium-canvas-surface')).toBeVisible()
    await expect(page.getByTestId('planetarium-views').locator('button')).toHaveCount(4)
    await expect(page.getByTestId('planetarium-view-orrery')).toHaveAttribute('aria-pressed', 'true')
  })

  test('switching a view updates the route', async ({ page }) => {
    await openPlanetarium(page)
    await page.getByTestId('planetarium-view-retrograde').click()
    await expect(page).toHaveURL(/\/planetarium\/retrograde$/)
    await expect(page.getByTestId('planetarium-trail-body')).toBeVisible()

    await page.getByTestId('planetarium-view-eclipses').click()
    await expect(page).toHaveURL(/\/planetarium\/eclipses$/)
  })

  test('deep links restore the view from the route', async ({ page }) => {
    await openPlanetarium(page, 'moon')
    await expect(page.getByTestId('planetarium-view-moon')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('planetarium-inset-caption')).toBeVisible()
  })

  test('seeking the date moves the simulated instant', async ({ page }) => {
    await openPlanetarium(page)
    await page.getByTestId('planetarium-date').fill('2024-04-08T18:17')
    await page.getByTestId('planetarium-date').dispatchEvent('change')
    await expect(page.getByTestId('planetarium-stamp')).toHaveText(/2024-04-08 18:17/)
  })

  // Seeking outside the loaded window triggers a fresh multi-year ephemeris search.
  test('lists eclipses and opens one in 3D with its diagram', async ({ page }) => {
    test.setTimeout(120_000)
    await openPlanetarium(page, 'eclipses')
    await page.getByTestId('planetarium-date').fill('2024-04-01T00:00')
    await page.getByTestId('planetarium-date').dispatchEvent('change')

    const eclipse = page.getByTestId('planetarium-event-solar_eclipse').filter({ hasText: '2024-04-08' })
    await expect(eclipse).toBeVisible({ timeout: 30000 })
    await eclipse.click()

    await expect(page.getByTestId('planetarium-event-details')).toBeVisible()
    await expect(page.getByTestId('planetarium-eclipse-diagram')).toBeVisible()
    await page.getByTestId('planetarium-view-event').click()
    await expect(page.getByTestId('planetarium-stamp')).toHaveText(/2024-04-08/)
  })

  test('toggles display options', async ({ page }) => {
    await openPlanetarium(page)
    const orbits = page.getByTestId('planetarium-toggle-orbits')
    await expect(orbits).toHaveAttribute('aria-pressed', 'true')
    await orbits.click()
    await expect(orbits).toHaveAttribute('aria-pressed', 'false')

    const trueScale = page.getByTestId('planetarium-true-scale')
    await trueScale.click()
    await expect(trueScale).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('planetarium-size')).toBeHidden()
    await expect(page.getByTestId('planetarium-scale-note')).toBeVisible()
  })

  test('shows a planet\'s moons and their real orbital data', async ({ page }) => {
    await openPlanetarium(page)
    await page.getByTestId('planetarium-focus-body').selectOption('Io')

    const panel = page.getByTestId('planetarium-body-info')
    await expect(panel).toContainText('Júpiter')
    await expect(panel).toContainText('1.769')
    await expect(page.getByTestId('planetarium-moon-approximate')).toBeHidden()

    await page.getByTestId('planetarium-focus-body').selectOption('Titan')
    await expect(panel).toContainText('15.945')
    await expect(page.getByTestId('planetarium-moon-approximate')).toBeVisible()
  })

  test('can hide the moons', async ({ page }) => {
    await openPlanetarium(page)
    const moons = page.getByTestId('planetarium-toggle-moons')
    await expect(moons).toHaveAttribute('aria-pressed', 'true')
    await moons.click()
    await expect(moons).toHaveAttribute('aria-pressed', 'false')
  })

  test('flies to a body picked by name, at true scale too', async ({ page }) => {
    await openPlanetarium(page)
    await page.getByTestId('planetarium-true-scale').click()
    await page.getByTestId('planetarium-focus-body').selectOption('Earth')

    await expect(page.getByTestId('planetarium-body-info')).toBeVisible()
    await expect(page.getByTestId('planetarium-body-info')).toContainText(/6[.,]371 km/)
  })

  test('plays and pauses the simulated clock', async ({ page }) => {
    await openPlanetarium(page)
    const play = page.getByTestId('planetarium-play')
    const stamp = page.getByTestId('planetarium-stamp')
    const before = await stamp.textContent()

    await play.click()
    await expect(play).toHaveAttribute('aria-pressed', 'true')
    await expect(stamp).not.toHaveText(before)
    await play.click()
    await expect(play).toHaveAttribute('aria-pressed', 'false')
  })
})
