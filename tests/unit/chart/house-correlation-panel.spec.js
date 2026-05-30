import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import HouseCorrelationPanel from '../../../src/components/chart/HouseCorrelationPanel.vue'

const correlations = {
  houses: Array.from({ length: 12 }, (_, index) => ({
    house: index + 1,
    score: index === 6 ? 12 : 0,
    share: index === 6 ? 1 : 0,
    topicsKey: `house_correlations.topics.${index + 1}`,
    occupants: index === 6 ? [{ planet: 'Venus', house: 7 }] : [],
    ruler: index === 6 ? 'Venus' : null,
    rulerHouse: index === 6 ? 7 : null,
    activators: index === 6 ? [{ planet: 'Mars', house: 7, mode: 'relationship' }] : [],
    aspects: index === 6 ? [{ a: 'Moon', b: 'Venus', type: 'trine', delta: 1 }] : [],
    reasons: index === 6
      ? [
          { type: 'occupant', mode: 'natal', planet: 'Venus', house: 7 },
          { type: 'relationship', mode: 'relationship', planet: 'Mars', house: 7 },
        ]
      : [],
  })),
  ranked: [],
  summary: {
    topHouses: [],
    modeTotals: { natal: 0.5, timing: 0, relationship: 0.5 },
    dominantMode: 'relationship',
  },
}
correlations.ranked = correlations.houses.filter(row => row.score > 0)
correlations.summary.topHouses = correlations.ranked

const messages = {
  'pt-BR': {
    analysis: { house_n: 'Casa {house}' },
    houses: {
      numbered_name: 'Casa {house} · {name}',
      names: ['Identidade', 'Recursos', 'Comunicação', 'Lar', 'Criatividade', 'Trabalho e saúde', 'Parcerias', 'Compartilhado', 'Crenças', 'Carreira', 'Comunidade', 'Recolhimento'],
    },
    planets: {
      Venus: 'Vênus',
      Mars: 'Marte',
      Moon: 'Lua',
    },
    aspects: {
      trine: 'trígono',
    },
    house_correlations: {
      title: 'Correlações das casas',
      subtitle: 'Vínculos psicológicos modernos.',
      all_houses: 'Todas as 12 casas',
      empty: 'Nenhuma correlação.',
      occupants: 'Ocupantes',
      ruler: 'Regente',
      in_house: 'na casa {house}',
      activators: 'Ativadores',
      aspects: 'Aspectos',
      modes: {
        natal: 'Padrão natal',
        timing: 'Ativação temporal',
        relationship: 'Sobreposição relacional',
      },
      topics: {
        1: 'Identidade',
        2: 'Recursos',
        3: 'Comunicação',
        4: 'Lar',
        5: 'Criatividade',
        6: 'Trabalho',
        7: 'Parcerias, acordos e espelhos diretos.',
        8: 'Compartilhado',
        9: 'Crenças',
        10: 'Carreira',
        11: 'Comunidade',
        12: 'Recolhimento',
      },
      reasons: {
        occupant: '{planet} ocupa esta casa.',
        relationship: '{planet} do outro mapa cai nesta casa.',
      },
    },
  },
}

describe('HouseCorrelationPanel', () => {
  it('renders ranked houses and localized Portuguese reasons', () => {
    const wrapper = mount(HouseCorrelationPanel, {
      props: { correlations },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'pt-BR', messages })],
      },
    })

    expect(wrapper.get('[data-testid="house-correlation-panel"]').text()).toContain('Correlações das casas')
    expect(wrapper.get('[data-testid="house-correlation-row"]').text()).toContain('Casa 7 · Parcerias')
    expect(wrapper.get('[data-testid="house-correlation-row"]').text()).toContain('Vênus ocupa esta casa.')
    expect(wrapper.get('[data-testid="house-correlation-row"]').text()).toContain('Marte do outro mapa cai nesta casa.')
    expect(wrapper.get('[data-testid="house-correlation-details"]').exists()).toBe(true)
  })
})
