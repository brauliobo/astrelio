import { expect, test } from '@playwright/test'
import { REF_PERSON, seedPeople, seedSession, seedSettings } from '../support/fixtures.js'

const revealWheel = async (page) => {
  await page.evaluate(() => {
    const header = document.querySelector('.app-header')
    const stage  = document.querySelector('[data-testid="chart-wheel-stage"]')
    if (!stage) return
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0
    const extra        = headerBottom - stage.getBoundingClientRect().top + 16
    if (extra > 0) window.scrollBy(0, extra)
  })
}

const hoverPainted = async (locator) => {
  const point = await locator.evaluate((element) => {
    const svg = element.ownerSVGElement
    const fallback = () => {
      const rect = element.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }
    const toScreen = (x, y) => {
      if (!svg?.createSVGPoint || !element.getScreenCTM) return fallback()
      const point = svg.createSVGPoint()
      point.x = x
      point.y = y
      const mapped = point.matrixTransform(element.getScreenCTM())
      return { x: mapped.x, y: mapped.y }
    }
    if (typeof element.getTotalLength === 'function' && element.getTotalLength() > 0) {
      const along = element.getPointAtLength(element.getTotalLength() / 2)
      return toScreen(along.x, along.y)
    }
    if (element instanceof SVGCircleElement) {
      return toScreen(element.cx.baseVal.value, element.cy.baseVal.value)
    }
    return fallback()
  })
  await locator.page().mouse.move(point.x, point.y)
}

const hitAt = (locator) => locator.evaluate((element) => {
  const rect = element.getBoundingClientRect()
  const node = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
  return {
    planet:    node?.closest('[data-planet]')?.getAttribute('data-planet') || '',
    wheelKind: node?.closest('[data-wheel-kind]')?.getAttribute('data-wheel-kind') || '',
  }
})

const expectSummary = async (page, kind, text) => {
  const summary = page.getByTestId('chart-selection-summary')
  await expect(summary).toBeVisible()
  await expect(summary).toHaveAttribute('data-selection-kind', kind)
  await expect(summary).toContainText(text)
  await expect(summary).not.toContainText(/Marca de|tick/i)
}

test.describe('Chart selection hover', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page)
    await seedPeople(page, [REF_PERSON])
    await seedSession(page, REF_PERSON.id)
  })

  test('inspects planets, signs, houses, aspects, and angles without a stuck degree-mark overlay', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/#/map/astrology/chart')
    await expect(page.getByTestId('chart-wheel-svg')).toBeVisible()
    await revealWheel(page)

    const tickRing = page.getByTestId('tick-ring')
    await expect(tickRing).toHaveAttribute('pointer-events', 'none')
    await expect(tickRing.locator('[role="button"]')).toHaveCount(0)
    await expect(page.locator('[data-wheel-kind="tick"]')).toHaveCount(0)

    const rimHit = await hitAt(page.getByTestId('planet-hit-Jupiter'))
    expect(rimHit.wheelKind).not.toBe('tick')

    await hoverPainted(page.getByTestId('planet-hit-Moon'))
    await expectSummary(page, 'planet', /Lua|Moon/)
    await expect.poll(() => page.getByTestId('chart-selection-summary').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none')

    await hoverPainted(page.getByTestId('planet-hit-Sun'))
    await expectSummary(page, 'planet', /Sol|Sun/)

    await hoverPainted(page.locator('[data-wheel-id="sign-0"] .segment-ring-sector__label'))
    await expect(page.locator('[data-wheel-id="sign-0"]')).toHaveAttribute('data-highlight', 'active')
    await expectSummary(page, 'sign', /Áries|Aries/)

    await hoverPainted(page.locator('[data-house-number="1"]'))
    await expectSummary(page, 'house', /Casa 1|House 1/)

    await hoverPainted(page.locator('[data-aspect="Sun-Uranus-sextile"]'))
    await expectSummary(page, 'aspect', /Sol|Sun/)
    await expect(page.getByTestId('chart-selection-summary')).toContainText(/Urano|Uranus/)

    await hoverPainted(page.getByTestId('angle-label-asc'))
    await expectSummary(page, 'angle', /AS|Asc/)

    await page.mouse.move(8, 8)
    await expect(page.getByTestId('chart-selection-summary')).toHaveCount(0)
  })
})
