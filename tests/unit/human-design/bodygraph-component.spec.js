import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import Bodygraph from '../../../src/components/human-design/bodygraph/Bodygraph.vue'
import { neighbourCenter, relatedTo } from '../../../src/components/human-design/bodygraph/bodygraphSelection.js'
import { zoomViewBox } from '../../../src/components/human-design/bodygraph/bodygraphZoom.js'
import { BODYGRAPH_VIEWBOX, GATE_LAYOUT } from '../../../src/lib/human-design/layout.js'
import { buildHumanDesignChart } from '../../../src/lib/human-design/bodygraph.js'
import en from '../../../src/i18n/en.json'

const person = {
  id:              'ref-person',
  name:            'Reference',
  isoLocal:        '1986-02-12T18:10',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88,
}

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

let chart
let wrapper

const mountGraph = (props = {}) => {
  wrapper = mount(Bodygraph, { props: { chart, ...props }, global: { plugins: [i18n] }, attachTo: document.body })
  return wrapper
}

const hit  = (type, value) => wrapper.get(`[data-focus-id="${type}:${value}"]`)
const keys = async (key) => {
  document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
}

beforeAll(() => { chart = buildHumanDesignChart(person) })
afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals() })

describe('Bodygraph component', () => {
  it('keeps the test ids the sky scene relies on', () => {
    mountGraph()
    expect(wrapper.get('svg[data-testid="bodygraph-svg"]').exists()).toBe(true)
    expect(wrapper.get('g[data-testid="bodygraph-chart"]').attributes('data-compact')).toBe('false')
    mountGraph({ size: 'compact' })
    expect(wrapper.get('g[data-testid="bodygraph-chart"]').attributes('data-compact')).toBe('true')
    expect(wrapper.get('svg').attributes('viewBox')).toBe('8 -72 520 840')
  })

  it('marks defined and open centers from the chart', () => {
    mountGraph()
    expect(wrapper.findAll('[data-testid="bodygraph-defined-center"]')).toHaveLength(chart.centers.length)
    expect(wrapper.findAll('[data-testid="bodygraph-open-center"]')).toHaveLength(9 - chart.centers.length)
    chart.centers.forEach((center) => {
      expect(wrapper.get(`g.center[data-center="${center}"]`).classes()).toContain('is-defined')
    })
  })

  it('marks defined channels and hanging gates', () => {
    mountGraph()
    chart.channels.forEach((id) => {
      expect(wrapper.get(`g.channel[data-layer="color"][data-channel="${id}"][data-status="defined"]`).exists()).toBe(true)
      expect(wrapper.get(`path.hit[data-channel="${id}"]`).attributes('data-status')).toBe('defined')
    })
    expect(wrapper.findAll('path.hit[data-status="defined"]')).toHaveLength(chart.channels.length)
    expect(wrapper.findAll('path.hit[data-status="hanging"]').length).toBeGreaterThan(0)
    expect(wrapper.findAll('[data-layer="flow"] .flow')).toHaveLength(chart.channels.length)
  })

  it('paints each gate by the layer that activates it', () => {
    mountGraph()
    const design      = new Set(Object.values(chart.design).map(({ gate }) => gate))
    const personality = new Set(Object.values(chart.personality).map(({ gate }) => gate))
    const stateOf     = gate => wrapper.get(`g.gate[data-gate="${gate}"]`).attributes('data-state')

    design.forEach(gate => expect(stateOf(gate)).toBe(personality.has(gate) ? 'both' : 'design'))
    personality.forEach(gate => !design.has(gate) && expect(stateOf(gate)).toBe('personality'))
    expect(stateOf([...Array(64).keys()].map(i => i + 1).find(gate => !design.has(gate) && !personality.has(gate)))).toBe('inactive')
  })

  it('filters activations by layer', () => {
    mountGraph({ layers: 'design' })
    const personalityOnly = Object.values(chart.personality).map(({ gate }) => gate)
      .find(gate => !Object.values(chart.design).some(activation => activation.gate === gate))
    expect(wrapper.get(`g.gate[data-gate="${personalityOnly}"]`).attributes('data-state')).toBe('inactive')
  })

  it('emits hover and dims what is not related', async () => {
    mountGraph()
    await hit('center', 'G').trigger('pointerenter')
    expect(wrapper.emitted('hover')[0]).toEqual([{ type: 'center', value: 'G' }])
    expect(wrapper.get('g.center[data-center="G"]').attributes('data-emphasis')).toBe('lit')
    expect(wrapper.get('g.center[data-center="Head"]').attributes('data-emphasis')).toBe('dim')
    await hit('center', 'G').trigger('pointerleave')
    expect(wrapper.emitted('hover')[1]).toEqual([null])
    expect(wrapper.findAll('[data-emphasis="dim"]')).toHaveLength(0)
  })

  it('pins on select and clears on a second click', async () => {
    mountGraph()
    await hit('gate', 10).trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual([{ type: 'gate', value: 10 }])
    expect(hit('gate', 10).attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('g.channel[data-channel="10-20"][data-layer="track"]').attributes('data-emphasis')).toBe('lit')
    await hit('gate', 10).trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(hit('gate', 10).attributes('aria-pressed')).toBe('false')
  })

  it('respects an external highlight', () => {
    mountGraph({ highlight: { channels: ['20-34'] } })
    expect(wrapper.get('g.channel[data-channel="20-34"][data-layer="track"]').attributes('data-emphasis')).toBe('lit')
    expect(wrapper.get('g.channel[data-channel="1-8"][data-layer="track"]').attributes('data-emphasis')).toBe('dim')
  })

  it('uses a roving tabindex with one tab stop', () => {
    mountGraph()
    const stops = wrapper.findAll('[tabindex="0"]')
    expect(stops).toHaveLength(1)
    expect(stops[0].attributes('data-focus-id')).toBe('center:Head')
  })

  it('moves between centers with arrow keys, drills into gates with Enter and steps back with Escape', async () => {
    mountGraph()
    hit('center', 'Head').element.focus()
    await keys('ArrowDown')
    expect(document.activeElement.dataset.focusId).toBe('center:Ajna')

    await keys('Enter')
    expect(wrapper.emitted('select')[0]).toEqual([{ type: 'center', value: 'Ajna' }])
    expect(document.activeElement.dataset.focusId).toMatch(/^gate:/)

    await keys('ArrowRight')
    expect(document.activeElement.dataset.focusId).toMatch(/^gate:/)

    await keys('c')
    expect(document.activeElement.dataset.focusId).toMatch(/^channel:/)

    await keys('Escape')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(document.activeElement.dataset.focusId).toBe('center:Ajna')
  })

  it('labels items for assistive tech', () => {
    mountGraph()
    expect(hit('center', 'G').attributes('aria-label')).toMatch(/G center/)
    expect(hit('gate', 34).attributes('aria-label')).toMatch(/^Gate 34, /)
    expect(hit('channel', '10-34').attributes('aria-label')).toMatch(/^Channel 10-34/)
  })
})

describe('Bodygraph selection model', () => {
  it('relates a gate to its channels, partner gates and centers', () => {
    const related = relatedTo({ type: 'gate', value: 10 })
    expect([...related.channels].sort()).toEqual(['10-20', '10-34', '10-57'])
    expect([...related.gates].sort((a, b) => a - b)).toEqual([10, 20, 34, 57])
    expect([...related.centers].sort()).toEqual(['G', 'Sacral', 'Spleen', 'Throat'])
  })

  it('relates a center to its gates and channels', () => {
    const related = relatedTo({ type: 'center', value: 'Head' })
    expect([...related.gates].sort()).toEqual([61, 63, 64])
    expect([...related.channels].sort()).toEqual(['4-63', '24-61', '47-64'].sort())
  })

  it('picks the nearest center in the pressed direction', () => {
    expect(neighbourCenter('Throat', 'ArrowDown')).toBe('G')
    expect(neighbourCenter('Sacral', 'ArrowRight')).toBe('Solar Plexus')
    expect(neighbourCenter('Head', 'ArrowUp')).toBeUndefined()
  })
  describe('zoom', () => {
    const base = BODYGRAPH_VIEWBOX.full
    const box  = selection => zoomViewBox(base, selection)

    it('frames the center of a center, gate or channel selection inside the figure', () => {
      const [x, y, w, h] = box({ type: 'center', value: 'Sacral' })

      expect(w).toBeLessThan(base[2] / 2)
      expect(h).toBeLessThan(base[3] / 3)
      expect(x).toBeGreaterThanOrEqual(base[0])
      expect(y + h).toBeLessThanOrEqual(base[1] + base[3])
      expect(box({ type: 'gate', value: 34 })).toEqual([x, y, w, h])
      expect(box({ type: 'channel', value: '10-34' })[3]).toBeGreaterThan(h)
    })

    it('keeps every gate of the zoomed center at least 24px wide on a 320px screen', () => {
      const [, , w] = box({ type: 'center', value: 'Sacral' })
      const radius  = GATE_LAYOUT[34].radius + 0.5

      expect((2 * radius * 320) / w).toBeGreaterThanOrEqual(24)
    })

    it('zooms the viewBox to the selection and back without animating under reduced motion', async () => {
      vi.stubGlobal('matchMedia', query => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
      mountGraph()
      await wrapper.setProps({ zoom: { type: 'center', value: 'Sacral' } })
      expect(wrapper.get('svg').attributes('viewBox')).toBe(box({ type: 'center', value: 'Sacral' }).join(' '))
      expect(wrapper.get('svg').attributes('data-zoomed')).toBe('true')

      await wrapper.setProps({ zoom: null })
      expect(wrapper.get('svg').attributes('viewBox')).toBe(base.join(' '))
      expect(wrapper.get('svg').attributes('data-zoomed')).toBe('false')
    })
  })
})
