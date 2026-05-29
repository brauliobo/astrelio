import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import AspectTable from '../../src/components/chart/AspectTable.vue'
import ChartWheel from '../../src/components/chart/ChartWheel.vue'
import PlanetList from '../../src/components/chart/PlanetList.vue'

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

const chart = {
  ascendant: 0,
  mc: 90,
  cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  positions: [
    position('Sun', 0),
    position('Mars', 60),
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
    h(ChartWheel, { natal: chart }),
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

    await aspectRow.trigger('click')
    await nextTick()

    expect(aspectRow.attributes('data-highlight')).toBe('idle')
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('idle')
  })
})
