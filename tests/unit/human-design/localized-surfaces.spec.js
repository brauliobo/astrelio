import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import CorrelationPanel from '../../../src/components/human-design/CorrelationPanel.vue'
import GateDetailTable from '../../../src/components/human-design/GateDetailTable.vue'
import GateExplorer from '../../../src/components/human-design/GateExplorer.vue'
import MandalaPrecisionPanel from '../../../src/components/human-design/MandalaPrecisionPanel.vue'
import TransitPanel from '../../../src/components/human-design/TransitPanel.vue'
import { humanDesignInterpretationSections } from '../../../src/lib/human-design/interpretations.js'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'

const i18n = locale => createI18n({
  legacy: false,
  locale,
  messages: { en, 'pt-BR': ptBR },
})

const gate = {
  gate:                49,
  name:                'Principles',
  center:              'Solar Plexus',
  activations:         [{ planet: 'Sun', layer: 'personality', line: 1, gate: 49, color: 1, tone: 1, base: 1, code: '49.1.1.1.1' }],
  lines:               [],
  harmonicGates:       [19],
  harmonicSuggestions: [{ gate: 19, channel: '19-49' }],
  library:             { streams: ['Sensing'], circuitGroups: ['Tribal'] },
  isHanging:           true,
}

describe('Human Design localized detail surfaces', () => {
  it('localizes interpretation values and excludes source gate prose in pt-BR', () => {
    const translator = i18n('pt-BR').global.t
    const sections   = humanDesignInterpretationSections({
      type:             'Generator',
      authority:        'Emotional',
      profile:          '1 / 3',
      strategy:         'Wait to respond',
      definition:       'Single Definition',
      centers:          ['Solar Plexus'],
      undefinedCenters: ['Head'],
      channels:         ['19-49'],
      circuits:         ['Tribal'],
      personalityGates: [49],
      designGates:      [],
      incarnationCross: {
        geometry: 'Right Angle',
        name:     'Right Angle Cross of Revolution',
        gates:    [49, 4, 14, 8],
        quarter:  { name: 'Initiation' },
      },
      variables: [{ id: 'digestion', label: 'Digestion', orientation: 'left', color: 1, colorLabel: 'Appetite', tone: 2, base: 3 }],
      details: {
        circuits: [{ circuit: 'Tribal', streams: ['Sensing'], channels: ['19-49'] }],
        gates:    [{ ...gate, summary: 'Raw English gate interpretation.' }],
      },
    }, translator)
    const items = sections.flatMap(section => section.items)

    expect(items.find(item => item.key === 'strategy').text).toContain('Esperar para responder')
    expect(items.find(item => item.key === 'circuits').text).toContain('Sentir')
    expect(items.find(item => item.key === 'incarnation-cross')).toMatchObject({
      title: 'Cruz de Ângulo Direito de Revolução',
      text:  expect.stringContaining('Iniciação'),
    })
    expect(items.find(item => item.key === 'variable-digestion').title).toBe('Digestão: Apetite')
    expect(items.find(item => item.key === 'gate-49').title).toContain('Princípios')
    expect(items.find(item => item.key === 'gate-49').text).not.toContain('Raw English')
  })

  it('uses translated fallback line metadata and planet labels in Gate Explorer', () => {
    const wrapper = mount(GateExplorer, {
      props:  { chart: { details: { gates: [gate] } } },
      global: { plugins: [i18n('pt-BR')] },
    })

    expect(wrapper.text()).toContain('Sol')
    expect(wrapper.text()).toContain('Fundação')
    expect(wrapper.text()).toContain('investigação')
    expect(wrapper.text()).toContain('Síntese')
    expect(wrapper.text()).not.toContain('Investigates the base pattern')
    expect(wrapper.text()).not.toContain('Principles')
  })

  it.each([
    ['en', 'Sun', 'Synthesis'],
    ['pt-BR', 'Sol', 'Síntese'],
  ])('formats transit dates and domain labels with the %s locale', (locale, planet, channel) => {
    const dateMs  = Date.UTC(2026, 0, 2, 15, 4)
    const wrapper = mount(TransitPanel, {
      props: {
        dateInput: '2026-01-02T15:04',
        connection: {
          activationWatch:    gate.activations,
          completedChannels:  ['19-49'],
          activatedNatalGates: [49],
          nextChanges:         [{ planet: 'Sun', dateMs, fromCode: '49.1.1.1.1', toCode: '49.2.1.1.1' }],
        },
      },
      global: { plugins: [i18n(locale)] },
    })

    expect(wrapper.text()).toContain(planet)
    expect(wrapper.text()).toContain(channel)
    expect(wrapper.text()).toContain(new Date(dateMs).toLocaleString(locale))
  })

  it('does not prioritize raw engine summaries over translated generated correlation rows', () => {
    const wrapper = mount(CorrelationPanel, {
      props: {
        chart: {
          gates:               [49],
          variables:           [],
          correlationAnalysis: { linePattern: ['Raw English engine summary.'] },
          details:             { gates: [gate], channels: [], centers: [], activations: gate.activations },
        },
      },
      global: { plugins: [i18n('pt-BR')] },
    })

    expect(wrapper.get('[data-correlation="lines"]').text()).toContain('Linha 1: 1 ativação(ões), portões 49.')
    expect(wrapper.text()).toContain('Sol: portão 49.1')
    expect(wrapper.text()).not.toContain('Raw English engine summary')
  })

  it('localizes planet labels in gate and precision tables', () => {
    const chart = { details: { gates: [gate], activations: [{ ...gate.activations[0], center: 'Solar Plexus', longitude: 323.36, progress: 0.5 }] } }
    const options = { props: { chart }, global: { plugins: [i18n('pt-BR')] } }
    const gateTable = mount(GateDetailTable, options)
    const precision = mount(MandalaPrecisionPanel, options)

    expect(gateTable.text()).toContain('Sol')
    expect(gateTable.text()).not.toContain('Sun')
    expect(precision.text()).toContain('Sol')
    expect(precision.text()).toContain('Plexo Solar')
  })
})
