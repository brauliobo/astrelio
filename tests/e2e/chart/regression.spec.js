import { test, expect } from '@playwright/test'
import { seedPeople, seedSession, seedSettings } from '../support/fixtures.js'

const BRAULIO_LEGACY_TZ = {
  id:              'braulio-vega-plus',
  name:            'Bráulio Oliveira',
  isoLocal:        '1986-02-12T18:10',
  tzOffsetMinutes: -180,
  lat:             -23.18,
  lon:             -45.88,
  placeLabel:      'São José dos Campos, SP - Brasil',
  createdAt:       1234567890
}

test.describe('Chart regressions', () => {
  test('matches the VegaPlus reference for Bráulio with historical Brazil DST', async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [BRAULIO_LEGACY_TZ])
    await seedSession(page, BRAULIO_LEGACY_TZ.id)

    await page.goto('/#/natal')

    await expect(page.getByTestId('asc-sign')).toContainText(/C[âa]ncer 27° 5[0-1]'/)
    await expect(page.getByTestId('mc-sign')).toContainText(/Touro 11° 3[6-8]'/)
    await expect(page.getByTestId('planet-Sun')).toContainText(/Sol\s*Aqu[áa]rio\s*23° 49'\s*7/)
    await expect(page.getByTestId('planet-Moon')).toContainText(/Lua\s*[ÁA]ries\s*9° 5[2-3]'\s*8/)
    await expect(page.getByTestId('planet-Mercury')).toContainText(/Merc[úu]rio\s*Peixes\s*2° 5[6-7]'\s*7/)
    await expect(page.getByTestId('planet-Jupiter')).toContainText(/J[úu]piter\s*Aqu[áa]rio\s*28° 07'\s*7/)
    await expect(page.getByTestId('planet-Saturn')).toContainText(/Saturno\s*Sagit[áa]rio\s*8° 4[2-3]'\s*5/)
  })

  test('stores IANA timezone and date-aware offset when creating the reference chart', async ({ page }) => {
    await seedSettings(page)

    await page.goto('/')
    await page.getByTestId('btn-new').click()
    await page.getByTestId('input-name').fill('Bráulio Oliveira')
    await page.getByTestId('input-date').fill('1986-02-12')
    await page.getByTestId('input-time').fill('18:10')
    await page.getByTestId('city-input').fill('São José dos Campos')
    await page.getByTestId('city-São José dos Campos, SP - Brasil').click()
    await page.getByTestId('btn-submit').click()

    await expect(page).toHaveURL(/\/natal/)
    await expect(page.getByTestId('asc-sign')).toContainText(/C[âa]ncer 27°/)

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('astrelio_people')).list[0])
    expect(saved.ianaZone).toBe('America/Sao_Paulo')
    expect(saved.tzOffsetMinutes).toBe(-120)
  })

  test('draws aspect lines underneath planet glyphs instead of stopping at the inner ring', async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [BRAULIO_LEGACY_TZ])
    await seedSession(page, BRAULIO_LEGACY_TZ.id)

    await page.goto('/#/natal')
    await page.getByTestId('chart-mode-aspects').click()
    await expect(page.getByTestId('aspect-lines')).toBeVisible()

    const reachesGlyph = await page.evaluate(() => {
      const svg     = document.querySelector('[data-testid="chart-wheel"] svg')
      const line    = svg.querySelector('[data-aspect="Sun-Uranus-sextile"]')
      const symbol  = svg.querySelector('g[data-planet="Sun"] [data-role="symbol"]')
      const sunBox  = symbol.getBBox()
      const matrix  = symbol.transform.baseVal.consolidate().matrix
      const corners = [
        new DOMPoint(sunBox.x, sunBox.y),
        new DOMPoint(sunBox.x + sunBox.width, sunBox.y),
        new DOMPoint(sunBox.x, sunBox.y + sunBox.height),
        new DOMPoint(sunBox.x + sunBox.width, sunBox.y + sunBox.height),
      ].map(point => point.matrixTransform(matrix))
      const sun = {
        x:      Math.min(...corners.map(point => point.x)),
        y:      Math.min(...corners.map(point => point.y)),
        width:  Math.max(...corners.map(point => point.x)) - Math.min(...corners.map(point => point.x)),
        height: Math.max(...corners.map(point => point.y)) - Math.min(...corners.map(point => point.y)),
      }
      const x1 = Number(line.getAttribute('x1'))
      const y1 = Number(line.getAttribute('y1'))
      return x1 >= sun.x && x1 <= sun.x + sun.width && y1 >= sun.y && y1 <= sun.y + sun.height
    })

    expect(reachesGlyph).toBe(true)
  })
})
