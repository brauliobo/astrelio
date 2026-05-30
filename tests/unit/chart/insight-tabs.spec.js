import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import Insight from '../../../src/components/chart/Insight.vue'

const mk = (name, longitude, speed = 1) => ({ name, longitude, latitude: 0, speed, retrograde: speed < 0 })

const chart = {
  zodiac: 'tropical',
  ascendant: 0,
  mc: 90,
  cusps: Array.from({ length: 12 }, (_, index) => index * 30),
  positions: [
    mk('Sun', 5),
    mk('Moon', 96),
    mk('Mars', 190),
  ],
}

const aspects = [
  { a: 'Sun', b: 'Moon', type: 'square', delta: 1, orb: 7, strength: 0.7 },
]

const messages = {
  en: {
    chart: {
      asc: 'ASC',
      mc: 'MC',
    },
    zodiac: {
      tropical: 'Tropical',
      signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
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
      square: 'Square',
    },
    houses: {
      numbered_name: 'House {house} · {name}',
      names: ['Identity', 'Resources', 'Communication', 'Home', 'Creativity', 'Work and health', 'Partnerships', 'Shared resources', 'Beliefs and travel', 'Career', 'Community', 'Retreat'],
    },
    analysis: {
      title: 'Chart intelligence',
      subtitle: 'Patterns.',
      sun: 'Sun',
      moon: 'Moon',
      horizon: 'Horizon',
      meridian: 'Meridian',
      house_n: 'House {house}',
      detail_tabs: {
        label: 'Insight sections',
        patterns: 'Patterns',
        factors: 'Factors',
        houses: 'Houses',
      },
      element_balance: 'Element balance',
      modality_balance: 'Modality rhythm',
      house_emphasis: 'House emphasis',
      chart_ruler: 'Chart ruler',
      ruler_of_asc: 'Ruler of {sign} rising',
      sect_hemispheres: 'Sect + emphasis',
      sect_detail: 'Sect favors {benefic}; {malefic} carries the active malefic role.',
      house_rulers: 'House rulers',
      angularity: 'Angularity',
      dignity_basics: 'Dignity basics',
      retrogrades: 'Retrogrades',
      top_aspects: 'Strongest aspects',
      no_angular: 'No angular planets.',
      no_retrogrades: 'No retrogrades.',
      elements: { fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water' },
      modalities: { cardinal: 'Cardinal', fixed: 'Fixed', mutable: 'Mutable' },
      hemispheres: { east: 'Eastern', west: 'Western', north: 'Northern', south: 'Southern' },
      sect_types: { day: 'Day chart', night: 'Night chart' },
      dignities: { domicile: 'domicile', exaltation: 'exaltation', detriment: 'detriment', fall: 'fall' },
      angles: { asc: 'ASC', mc: 'MC', desc: 'DESC', ic: 'IC' },
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
        occupant: '{planet} occupies this house.',
        ruler: '{ruler} rules this house.',
        ruler_placement: '{ruler} brings house {house} topics here.',
        aspect: '{planet} links with {partner} by {aspect}.',
      },
    },
  },
}

describe('Insight detail tabs', () => {
  it('tabs the right panel details into patterns, factors, and houses', async () => {
    const wrapper = mount(Insight, {
      props: { chart, aspects, panel: 'right' },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })

    expect(wrapper.get('[data-testid="insight-detail-tabs"]').text()).toContain('Patterns')
    expect(wrapper.text()).toContain('House emphasis')
    expect(wrapper.find('[data-testid="house-correlation-panel"]').exists()).toBe(false)

    await wrapper.get('[data-testid="insight-tab-houses"]').trigger('click')

    expect(wrapper.get('[data-testid="house-correlation-panel"]').text()).toContain('House correlations')
    expect(wrapper.text()).not.toContain('House emphasis')

    await wrapper.get('[data-testid="insight-tab-factors"]').trigger('click')

    expect(wrapper.text()).toContain('Strongest aspects')
    expect(wrapper.find('[data-testid="house-correlation-panel"]').exists()).toBe(false)
  })

  it('keeps full panels untabbed for reports and return views', () => {
    const wrapper = mount(Insight, {
      props: { chart, aspects, panel: 'full' },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })

    expect(wrapper.find('[data-testid="insight-detail-tabs"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="house-correlation-panel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Strongest aspects')
  })
})
