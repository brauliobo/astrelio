import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import AspectTable from '../../../src/components/chart/AspectTable.vue'
import Wheel from '../../../src/components/chart/Wheel.vue'
import PlanetList from '../../../src/components/chart/PlanetList.vue'

vi.mock('../../../src/components/chart/DisplayMode.vue', () => ({
  default: {
    name: 'DisplayMode',
    render() {
      return h('div', { 'data-testid': 'chart-display-mode' }, this.$slots.default?.())
    },
  },
}))

const messages = {
  en: {
    common: { all: 'All' },
    chart: {
      asc: 'ASC',
      mc: 'MC',
      house_system: 'House',
      summary: 'Summary',
    },
    zodiac: {
      signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    },
    planets: {
      Sun: 'Sun',
      Moon: 'Moon',
      Mars: 'Mars',
      Fortune: 'Fortune',
    },
    aspects: {
      applying: 'Applying',
      aspect: 'Aspect',
      body_a: 'Body A',
      body_b: 'Body B',
      motion: 'Motion',
      none_for_filter: 'No aspects',
      orb: 'Orb',
      separating: 'Separating',
      sextile: 'Sextile',
      tight: 'Tight',
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

const aquariusSun = 300 + 23 + (49 / 60)

const chart = {
  ascendant: 120,
  mc: 210,
  cusps: [120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90],
  positions: [
    position('Sun', aquariusSun),
    position('Mars', 23 + (49 / 60)),
    position('Moon', 140),
  ],
}

const aspects = [
  {
    a: 'Sun',
    b: 'Mars',
    type: 'sextile',
    exact: 60,
    delta: 0.2,
    orb: 5,
    strength: 0.8,
    applying: true,
  },
]

const mountChartTools = () => mount({
  render: () => h('div', [
    h(Wheel, { natal: chart }),
    h(PlanetList, { chart }),
    h(AspectTable, { aspects }),
  ]),
}, {
  global: {
    plugins: [createI18n({ legacy: false, locale: 'en', messages })],
  },
})

describe('chart interactions', () => {
  it('shares planet hover state with glyphs and related aspect rows and lines', async () => {
    const wrapper = mountChartTools()

    await wrapper.get('[data-testid="planet-Sun"]').trigger('mouseenter')
    await nextTick()

    expect(wrapper.get('[data-testid="planet-Sun"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-aspect-row="Sun-Mars-sextile"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-aspect="Sun-Mars-sextile"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Moon"]').attributes('data-highlight')).toBe('dimmed')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').text()).toContain('Sun 23°49′ Aquarius · House 7')
  })

  it('pins and clears aspect highlight state from click', async () => {
    const wrapper = mountChartTools()
    const aspectRow = wrapper.get('[data-aspect-row="Sun-Mars-sextile"]')

    await aspectRow.trigger('click')
    await aspectRow.trigger('mouseleave')
    await nextTick()

    expect(aspectRow.attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Mars"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').attributes('data-selection-kind')).toBe('aspect')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').text()).toContain('Sun Sextile Mars')

    await aspectRow.trigger('click')
    await nextTick()

    expect(aspectRow.attributes('data-highlight')).toBe('idle')
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('idle')
    expect(wrapper.find('[data-testid="chart-selection-summary"]').exists()).toBe(false)
  })

  it('zooms the wheel with compact controls without resizing the chart frame', async () => {
    const wrapper = mount(Wheel, {
      props: { natal: chart },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })
    const stage = wrapper.get('[data-testid="chart-wheel"]').get('.chart-wheel-stage')
    const svg = wrapper.get('[data-testid="chart-wheel-svg"]')
    const initialViewBox = svg.attributes('viewBox')

    expect(stage.attributes('data-zoom')).toBe('1.00')
    expect(initialViewBox).toBe('60 60 400 400')
    expect(wrapper.get('[data-testid="chart-zoom-reset"]').text()).toBe('100%')

    await wrapper.get('[data-testid="chart-zoom-in"]').trigger('click')
    await nextTick()

    expect(stage.attributes('data-zoom')).toBe('1.15')
    expect(svg.attributes('viewBox')).not.toBe(initialViewBox)
    expect(wrapper.get('[data-testid="chart-zoom-reset"]').text()).toBe('115%')

    await wrapper.get('[data-testid="chart-zoom-out"]').trigger('click')
    await nextTick()

    expect(stage.attributes('data-zoom')).toBe('1.00')
    expect(svg.attributes('viewBox')).toBe(initialViewBox)

    await stage.trigger('keydown', { key: '+' })
    await nextTick()

    expect(stage.attributes('data-zoom')).toBe('1.15')

    await wrapper.get('[data-testid="chart-zoom-reset"]').trigger('click')
    await nextTick()

    expect(stage.attributes('data-zoom')).toBe('1.00')
    expect(svg.attributes('viewBox')).toBe(initialViewBox)
  })
})
