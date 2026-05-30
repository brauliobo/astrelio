import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import ComparisonInsightPanel from '../../../src/components/chart/ComparisonInsightPanel.vue'

const mk = (name, longitude, speed = 1) => ({ name, longitude, latitude: 0, speed, retrograde: false })

const base = {
  zodiac: 'tropical',
  ascendant: 0,
  mc: 90,
  cusps: Array.from({ length: 12 }, (_, index) => index * 30),
  positions: [mk('Sun', 5), mk('Moon', 100), mk('Venus', 190)],
}

const comparison = {
  ...base,
  positions: [mk('Saturn', 8, 0.03), mk('Mars', 190)],
}

const messages = {
  en: {
    analysis: { house_n: 'House {house}' },
    houses: {
      numbered_name: 'House {house} · {name}',
      names: ['Identity', 'Resources', 'Communication', 'Home', 'Creativity', 'Work and health', 'Partnerships', 'Shared resources', 'Beliefs and travel', 'Career', 'Community', 'Retreat'],
    },
    planets: {
      Sun: 'Sun',
      Moon: 'Moon',
      Mercury: 'Mercury',
      Venus: 'Venus',
      Mars: 'Mars',
      Jupiter: 'Jupiter',
      Saturn: 'Saturn',
      Uranus: 'Uranus',
      Neptune: 'Neptune',
      Pluto: 'Pluto',
    },
    aspects: {
      applying: 'Applying',
      separating: 'Separating',
      conjunction: 'Conjunction',
      opposition: 'Opposition',
    },
    interpretations: {
      sentences: {
        transit_aspect: '{primary} activates {secondary}: {tone}.',
        synastry_aspect: '{primary} meets {secondary}: {tone}.',
      },
      variant_tones: {
        transit: {
          conjunction: 'direct focus',
          opposition: 'contrast',
        },
        synastry: {
          conjunction: 'fusion',
          opposition: 'polarity',
        },
      },
    },
    comparison_insights: {
      titles: {
        transit: 'Transit themes',
        progression: 'Progression themes',
        synastry: 'Synastry themes',
      },
      subtitles: {
        transit: 'Transit contacts.',
        progression: 'Progressed contacts.',
        synastry: 'Synastry contacts.',
      },
      theme_n: 'Theme {n}',
      dominant: '{aspect} emphasis · {count}',
      applying_count: '{count} applying',
      aspect_meta: '{a} {aspect} {b} · {orb}° · {motion}',
      transit_aspect_meta: '{a} {aspect} {b} · {orb}° · {motion} · house {house} activated',
      themes: {
        transit: {
          conjunction: '{b} activates natal {a}',
          opposition: '{b} mirrors natal {a}',
        },
        progression: {
          conjunction: 'Progressed {b} concentrates {a}',
          opposition: 'Progressed {b} tests {a}',
        },
        synastry: {
          conjunction: '{a} and {b} fuse quickly',
          opposition: '{a} and {b} polarize',
        },
      },
      empty: {
        transit: 'No transit aspects.',
        progression: 'No progression aspects.',
        synastry: 'No synastry aspects.',
      },
    },
    house_correlations: {
      title: 'House correlations',
      subtitle: 'Modern links.',
      all_houses: 'All 12 houses',
      empty: 'No house correlations.',
      occupants: 'Occupants',
      ruler: 'Ruler',
      in_house: 'in house {house}',
      activators: 'Activators',
      aspects: 'Aspects',
      modes: {
        natal: 'Natal pattern',
        timing: 'Timing activation',
        relationship: 'Relationship overlay',
      },
      topics: {
        1: 'Identity',
        2: 'Resources',
        3: 'Communication',
        4: 'Home',
        5: 'Creativity',
        6: 'Work',
        7: 'Partnerships',
        8: 'Shared resources',
        9: 'Beliefs',
        10: 'Career',
        11: 'Community',
        12: 'Retreat',
      },
      reasons: {
        ruler: '{ruler} rules this house.',
        ruler_placement: '{ruler} brings house {house} topics here.',
        timing: '{planet} currently activates this natal house.',
        timing_aspect: '{planet} aspects natal {partner} by {aspect}.',
        relationship: '{planet} from the other chart lands in this house.',
        relationship_aspect: '{planet} contacts {partner} by {aspect}.',
      },
    },
  },
}

const mountPanel = (props) => mount(ComparisonInsightPanel, {
  props,
  global: {
    plugins: [createI18n({ legacy: false, locale: 'en', messages })],
  },
})

describe('comparison house correlations', () => {
  it('renders timing house correlations from base and comparison charts', () => {
    const wrapper = mountPanel({
      base,
      comparison,
      mode: 'transit',
      aspects: [
        { a: 'Sun', b: 'Saturn', type: 'conjunction', delta: 0.4, orb: 8, strength: 0.95, applying: true },
      ],
    })

    expect(wrapper.get('[data-testid="house-correlation-panel"]').text()).toContain('House correlations')
    expect(wrapper.get('[data-testid="house-correlation-panel"]').text()).toContain('Saturn currently activates this natal house.')
  })

  it('renders synastry house correlations as relationship overlays', () => {
    const wrapper = mountPanel({
      base,
      comparison,
      mode: 'synastry',
      aspects: [
        { a: 'Venus', b: 'Mars', type: 'opposition', delta: 1, orb: 8, strength: 0.8, applying: false },
      ],
    })

    expect(wrapper.get('[data-testid="house-correlation-panel"]').text()).toContain('Relationship overlay')
    expect(wrapper.get('[data-testid="house-correlation-panel"]').text()).toContain('Mars from the other chart lands in this house.')
  })
})
