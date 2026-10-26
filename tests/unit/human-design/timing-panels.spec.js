import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeAll, describe, expect, it } from 'vitest'
import TransitPanel from '../../../src/components/human-design/TransitPanel.vue'
import { buildHumanDesignTransitContext } from '../../../src/composables/useHumanDesignTransitContext.js'
import { GATE_CENTER } from '../../../src/lib/human-design/layout.js'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'
import { referenceChart, referencePerson } from './reference-chart.js'

const dateMs = Date.UTC(2026, 0, 2, 15, 4)
const i18n   = locale => createI18n({ legacy: false, locale, messages: { en, 'pt-BR': ptBR } })

let chart
let context

const mountPanel = (locale = 'en') => mount(TransitPanel, {
  props:  { chart, transitChart: context.transitChart, connection: context.connection, dateInput: '2026-01-02T15:04' },
  global: { plugins: [i18n(locale)] },
})

beforeAll(() => {
  chart   = referenceChart()
  context = buildHumanDesignTransitContext({ natalChart: chart, dateMs, lat: referencePerson.lat, lon: referencePerson.lon })
})

describe('Human Design transit panel', () => {
  it('layers the transit on the natal bodygraph and lists one card per planet', () => {
    const wrapper = mountPanel()

    expect(wrapper.find('[data-testid="hd-transit-bodygraph"] svg[data-testid="bodygraph-svg"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="hd-transit-activations"] button')).toHaveLength(context.connection.activationWatch.length)
    context.connection.completedChannels.forEach(channel => expect(wrapper.get('[data-testid="hd-transit-hits"]').text()).toContain(channel))
  })

  it('names the open centers that receive transit gates', () => {
    const received = new Set(context.transitChart.gates.map(gate => GATE_CENTER[gate]))
    const open     = chart.centerStates.filter(state => state.white && received.has(state.id))
    const wrapper  = mountPanel()

    expect(wrapper.findAll('[data-testid="hd-transit-conditioning"] button')).toHaveLength(open.length)
  })

  it.each([['en', 'Sun'], ['pt-BR', 'Sol']])('formats planets and dates with the %s locale', (locale, planet) => {
    const wrapper = mountPanel(locale)

    expect(wrapper.get('[data-testid="hd-transit-activations"]').text()).toContain(planet)
    expect(wrapper.get('[data-testid="hd-transit-next-changes"]').text()).toContain(
      new Date(context.connection.nextLineChanges.map(change => change.dateMs).sort((a, b) => a - b)[0]).toLocaleString(locale)
    )
  })

  it('highlights a gate on the bodygraph when its planet card is pressed', async () => {
    const wrapper = mountPanel()
    const card    = wrapper.get('[data-testid="hd-transit-activations"] button')
    const gate    = context.connection.activationWatch[0].gate

    await card.trigger('click')

    expect(card.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get(`g.gate[data-gate="${gate}"]`).attributes('data-emphasis')).toBe('lit')
  })
})
