import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import Wheel from '../../../src/components/chart/Wheel.vue'
import { CENTER, WHEEL_RADII } from '../../../src/components/chart/wheel/geometry.js'

const messages = {
  en: {
    chart: {
      display_mode:  'Display',
      transit_orbit: 'Transits',
      display_modes: {
        clean:    'Clean',
        aspects:  'Aspects',
        detailed: 'Detailed',
        print:    'Print',
      },
    },
    zodiac: {
      signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    },
    aspects: {
      sextile: 'Sextile',
    },
  },
}

const position = (name, longitude, speed = 1) => ({
  name,
  longitude,
  latitude: 0,
  speed,
  retrograde: false,
})

const chart = {
  ascendant: 120,
  mc:        210,
  cusps:     [120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90],
  positions: [
    position('Sun', 300 + 23 + (49 / 60)),
    position('Venus', 28),
    position('Mars', 23 + (49 / 60)),
    position('Moon', 140),
  ],
}

const mountWheel = (props = {}) => mount(Wheel, {
  props:  { natal: chart, ...props },
  global: {
    plugins: [createI18n({ legacy: false, locale: 'en', messages })],
  },
})

const markerPoints = (path) => [...path.matchAll(/-?\d+(?:\.\d+)?/g)]
  .map(match => Number(match[0]))
  .reduce((points, value, index, values) => {
    if (index % 2 === 0) points.push({ x: value, y: values[index + 1] })
    return points
  }, [])

const distanceFromCenter = ({ x, y }) => Math.hypot(Number(x) - CENTER, Number(y) - CENTER)

describe('chart display modes', () => {
  it('switches degrees, aspects, and point detail visibility by mode', async () => {
    const wrapper = mountWheel()

    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('detailed')
    expect(wrapper.find('[data-testid="aspect-lines"]').exists()).toBe(true)

    await wrapper.get('[data-testid="chart-mode-clean"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('clean')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-degrees')).toBe('false')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-point-details')).toBe('false')
    expect(wrapper.find('[data-testid="aspect-lines"]').exists()).toBe(false)

    await wrapper.get('[data-testid="chart-mode-aspects"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('aspects')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-degrees')).toBe('false')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-point-details')).toBe('true')
    expect(wrapper.find('[data-testid="aspect-lines"]').exists()).toBe(true)

    await wrapper.get('[data-testid="chart-mode-print"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('print')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-degrees')).toBe('true')
    expect(wrapper.find('[data-testid="aspect-lines"]').exists()).toBe(false)
  })

  it('places zoom controls before the display mode options', () => {
    const wrapper     = mountWheel()
    const toolbarText = wrapper.get('[data-testid="chart-display-mode"]').text()

    expect(toolbarText.indexOf('100%')).toBeLessThan(toolbarText.indexOf('Clean'))
  })

  it('allows wider default framing for wheels with an outer nakshatra ring', () => {
    const wrapper = mountWheel({
      defaultZoomBase:   1.2,
      showNakshatraRing: true,
    })

    expect(wrapper.get('[data-testid="chart-wheel-svg"]').attributes('viewBox')).toBe('43.333 43.333 433.333 433.333')
  })

  it('keeps transit overlays hidden by default and shows them on a wider exterior orbit', async () => {
    const wrapper = mountWheel({
      overlay: {
        ...chart,
        positions: [
          position('Sun', 60),
          position('Moon', 120),
        ],
      },
    })

    expect(wrapper.get('[data-testid="chart-toggle-transit-orbit"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('[data-testid="chart-wheel-svg"]').attributes('viewBox')).toBe('60 60 400 400')
    expect(wrapper.find('[data-testid="transit-orbit-frame"]').exists()).toBe(false)
    expect(wrapper.find('[data-chart-map="overlay"]').exists()).toBe(false)

    await wrapper.get('[data-testid="chart-toggle-transit-orbit"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="chart-wheel-svg"]').attributes('viewBox')).toBe('19.259 19.259 481.481 481.481')
    expect(wrapper.get('[data-testid="transit-orbit-frame"]').exists()).toBe(true)
    expect(wrapper.get('[data-chart-map="overlay"] [data-testid="planet-glyph-Sun"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="transit-orbit-frame"] circle:nth-child(2)').attributes('r')).toBe(String(WHEEL_RADII.zodiacOuter))
  })

  it('toggles the exterior transit orbit and resizes back to the natal frame', async () => {
    const wrapper = mountWheel({
      overlay: {
        ...chart,
        positions: [
          position('Sun', 60),
          position('Moon', 120),
        ],
      },
    })

    const toggle         = wrapper.get('[data-testid="chart-toggle-transit-orbit"]')
    const natalSunBefore = wrapper.get('[data-chart-map="natal"] [data-testid="planet-hit-Sun"]').attributes()
    expect(toggle.attributes('aria-pressed')).toBe('false')

    await toggle.trigger('click')
    await nextTick()

    const natalSunAfter = wrapper.get('[data-chart-map="natal"] [data-testid="planet-hit-Sun"]').attributes()
    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="chart-wheel-svg"]').attributes('viewBox')).toBe('19.259 19.259 481.481 481.481')
    expect(wrapper.get('[data-testid="transit-orbit-frame"]').exists()).toBe(true)
    expect(natalSunAfter.cx).toBe(natalSunBefore.cx)
    expect(natalSunAfter.cy).toBe(natalSunBefore.cy)
    expect(distanceFromCenter(markerPoints(wrapper.get('[data-testid="angle-arrow-asc"]').attributes('d'))[0])).toBeCloseTo(WHEEL_RADII.transitOuter + 15, 4)

    await toggle.trigger('click')
    await nextTick()

    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('[data-testid="chart-wheel-svg"]').attributes('viewBox')).toBe('60 60 400 400')
    expect(wrapper.find('[data-testid="transit-orbit-frame"]').exists()).toBe(false)
  })

  it('defaults simple charts to clean mode on small screens', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia        = vi.fn(() => ({
      matches:             true,
      addEventListener:    vi.fn(),
      removeEventListener: vi.fn(),
      addListener:         vi.fn(),
      removeListener:      vi.fn(),
    }))

    try {
      const wrapper = mountWheel()
      await nextTick()

      expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('clean')
      wrapper.unmount()
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('uses CSS variables for chart wheel colors so root theme changes cascade', () => {
    const wrapper     = mountWheel()
    const frame       = wrapper.get('[data-testid="wheel-frame"]')
    const zodiacText  = wrapper.get('[data-testid="zodiac-ring"] text')
    const houseSector = wrapper.get('[data-testid="house-cusps"] path')
    const planetLabel = wrapper.get('[data-testid="planet-glyph-Moon"] [data-role="symbol"]')

    expect(frame.findAll('circle')[1].attributes('fill')).toBe('var(--chart-zodiac-fill-b)')
    expect(zodiacText.attributes('fill')).toBe('var(--chart-zodiac-text)')
    expect(houseSector.attributes('fill')).toBe('var(--chart-house-fill-a)')
    expect(wrapper.get('[data-testid="house-cusp-1"]').attributes('stroke')).toBe('var(--chart-angle-asc, var(--chart-angle-accent))')
    expect(wrapper.get('[data-testid="house-cusp-10"]').attributes('stroke')).toBe('var(--chart-angle-mc, var(--chart-angle-accent))')
    expect(planetLabel.attributes('style')).toContain('color: var(--chart-ink)')
  })

  it('keeps house labels visually secondary to planet positions', () => {
    const wrapper      = mountWheel()
    const houseNumbers = wrapper.get('[data-testid="house-numbers"]')
    const planetDegree = wrapper.get('[data-testid="planet-glyph-Moon"] .planet-degree-label')

    expect(houseNumbers.attributes('font-size')).toBe('7.5')
    expect(houseNumbers.attributes('opacity')).toBe('var(--chart-house-number-opacity)')
    expect(houseNumbers.find('circle').exists()).toBe(false)
    expect(Number(planetDegree.attributes('font-size'))).toBeGreaterThan(Number(houseNumbers.attributes('font-size')))
  })

  it('renders ascendant and midheaven as compact arrow markers', () => {
    const wrapper = mountWheel()
    const markers = wrapper.get('[data-testid="angle-markers"]')

    expect(markers.findAll('[data-testid^="angle-arrow-"]')).toHaveLength(2)
    expect(markers.get('[data-testid="angle-arrow-asc"]').attributes('fill')).toBe('var(--chart-angle-asc, var(--chart-angle-accent))')
    expect(markers.get('[data-testid="angle-arrow-mc"]').attributes('fill')).toBe('var(--chart-angle-mc, var(--chart-angle-accent))')
    for (const marker of markers.findAll('[data-testid^="angle-arrow-"]')) {
      const [tip, baseA, baseB] = markerPoints(marker.attributes('d'))
      const baseDistance = (distanceFromCenter(baseA) + distanceFromCenter(baseB)) / 2

      expect(distanceFromCenter(tip)).toBeCloseTo(WHEEL_RADII.zodiacOuter + 15, 4)
      expect(distanceFromCenter(tip)).toBeGreaterThan(baseDistance)
    }
    expect(markers.findAll('circle')).toHaveLength(0)
  })

  it('uses shared SVG glyph sizing with planet-specific optical normalization', () => {
    const wrapper = mountWheel()
    const sun     = wrapper.get('[data-testid="planet-glyph-Sun"] [data-role="symbol"]')
    const venus   = wrapper.get('[data-testid="planet-glyph-Venus"] [data-role="symbol"]')
    const mars    = wrapper.get('[data-testid="planet-glyph-Mars"] [data-role="symbol"]')

    expect(sun.find('path').exists()).toBe(true)
    expect(venus.find('path').exists()).toBe(true)
    expect(mars.find('path').exists()).toBe(true)
    expect(sun.attributes('transform')).toContain('scale(1.8333333333333333 1.8333333333333333)')
    expect(venus.attributes('transform')).toContain('scale(2.0533333333333332 1.8333333333333333)')
    expect(mars.attributes('transform')).toContain('scale(1.7416666666666665 1.7416666666666665)')
  })

  it('renders planet positions without exact-point leader marks', () => {
    const wrapper = mountWheel()
    const sun     = wrapper.get('[data-testid="planet-glyph-Sun"]')

    expect(sun.find('line').exists()).toBe(false)
    expect(sun.findAll('circle')).toHaveLength(1)
    expect(sun.get('circle').classes()).toContain('planet-hit-target')
  })

  it('extends aspect lines to the rendered planet glyph lane', () => {
    const wrapper          = mountWheel()
    const aspectLine       = wrapper.get('[data-aspect="Sun-Mars-sextile"]')
    const endpointDistance = (x, y) =>
      Math.hypot(Number(x) - CENTER, Number(y) - CENTER)

    expect(endpointDistance(aspectLine.attributes('x1'), aspectLine.attributes('y1'))).toBeGreaterThan(WHEEL_RADII.aspect)
    expect(endpointDistance(aspectLine.attributes('x2'), aspectLine.attributes('y2'))).toBeGreaterThan(WHEEL_RADII.aspect)
    expect(endpointDistance(aspectLine.attributes('x1'), aspectLine.attributes('y1'))).toBeLessThan(WHEEL_RADII.houseOuter)
    expect(endpointDistance(aspectLine.attributes('x2'), aspectLine.attributes('y2'))).toBeLessThan(WHEEL_RADII.houseOuter)
  })
})
