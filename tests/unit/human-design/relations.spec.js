import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeAll, describe, expect, it } from 'vitest'
import RelationBodygraphs from '../../../src/components/human-design/relations/RelationBodygraphs.vue'
import RelationCards from '../../../src/components/human-design/relations/RelationCards.vue'
import CenterClassification from '../../../src/components/human-design/relations/CenterClassification.vue'
import { buildHumanDesignChart } from '../../../src/lib/human-design/bodygraph.js'
import { humanDesignConnection } from '../../../src/lib/human-design/connections.js'
import { channelHighlight, centerHighlight, RELATIONS, relationRows } from '../../../src/lib/human-design/relations.js'
import en from '../../../src/i18n/en.json'

const people = [
  { id: 'a', name: 'Ana', isoLocal: '1986-02-12T18:10', tzOffsetMinutes: -120, lat: -23.18, lon: -45.88 },
  { id: 'b', name: 'Beto', isoLocal: '1990-07-15T08:30', tzOffsetMinutes: -180, lat: -23.55, lon: -46.63 },
]

const global = { plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })] }

let charts
let connection

beforeAll(() => {
  charts     = people.map(buildHumanDesignChart)
  connection = humanDesignConnection(...charts)
})

describe('Human Design relations', () => {
  it('builds highlights from channel and center layout', () => {
    expect(channelHighlight('1-8')).toEqual({ centers: ['G', 'Throat'], channels: ['1-8'], gates: [1, 8] })
    expect(centerHighlight('Head').gates).toEqual([64, 61, 63])
    expect(RELATIONS.flatMap(relation => relationRows(connection, relation)).length).toBe(connection.channelRelations.length)
  })

  it('renders both charts and the composite overlay as bodygraphs', () => {
    const wrapper = mount(RelationBodygraphs, {
      props: { chartA: charts[0], chartB: charts[1], nameA: 'Ana', nameB: 'Beto', composite: connection.composite },
      global,
    })

    expect(wrapper.findAll('[data-testid="bodygraph-svg"]')).toHaveLength(3)
    expect(wrapper.get('[data-testid="hd-composite-bodygraph"]').text()).toContain('Beto')
  })

  it('lists channels per relation with their owner and emits a channel highlight', async () => {
    const owners  = { a: 'Ana', b: 'Beto' }
    const wrapper = mount(RelationCards, { props: { connection, owners }, global })

    expect(wrapper.findAll('[data-relation]')).toHaveLength(4)
    expect(wrapper.get('[data-relation="electromagnetic"]').text()).toContain('Electromagnetic')
    expect(wrapper.get('[data-relation="dominance"]').text()).toContain('holds the whole channel')

    const [button] = wrapper.get('[data-relation="electromagnetic"]').findAll('button')
    await button.trigger('pointerenter')
    expect(wrapper.emitted('highlight')[0][0].channels).toEqual([button.attributes('data-channel')])
  })

  it('classifies the nine centers', () => {
    const wrapper = mount(CenterClassification, { props: { dynamics: connection.centerDynamics, names: { a: 'Ana', b: 'Beto' } }, global })

    expect(wrapper.findAll('li')).toHaveLength(9)
    expect(wrapper.findAll('[data-status]').map(item => item.attributes('data-status'))).toEqual(connection.centerDynamics.map(item => item.status))
  })
})
