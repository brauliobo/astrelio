import { afterEach, describe, expect, it } from 'vitest'
import AnalysisTabs from '../../../src/components/human-design/analysis/AnalysisTabs.vue'
import { mountView } from './analysis-support.js'

let wrapper

const mountTabs = (props, locale) => (wrapper = mountView(AnalysisTabs, props, locale))
const tab       = id => wrapper.get(`[data-testid="analysis-tab-${id}"]`)
const flush     = async () => { await wrapper.vm.$nextTick(); await wrapper.vm.$nextTick() }

afterEach(() => wrapper?.unmount())

describe('AnalysisTabs', () => {
  it('lists six tabs with the first selected and a roving tabindex', () => {
    mountTabs()
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(6)
    expect(tabs.map(item => item.attributes('aria-selected'))).toEqual(['true', 'false', 'false', 'false', 'false', 'false'])
    expect(tabs.map(item => item.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1', '-1', '-1'])
    expect(wrapper.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe(tabs[0].attributes('id'))
  })

  it('moves between tabs with the arrow, Home and End keys', async () => {
    mountTabs()
    await tab('centers').trigger('keydown', { key: 'ArrowRight' })
    await flush()
    expect(tab('channels').attributes('aria-selected')).toBe('true')
    await tab('channels').trigger('keydown', { key: 'ArrowLeft' })
    await tab('centers').trigger('keydown', { key: 'ArrowLeft' })
    await flush()
    expect(tab('sensitivity').attributes('aria-selected')).toBe('true')
    await tab('sensitivity').trigger('keydown', { key: 'Home' })
    await flush()
    expect(tab('centers').attributes('aria-selected')).toBe('true')
  })

  it('computes cycles and sensitivity only when their tab opens', async () => {
    mountTabs()
    expect(wrapper.find('[data-testid="analysis-cycles-view"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="analysis-sensitivity"]').exists()).toBe(false)
    await tab('cycles').trigger('click')
    expect(wrapper.find('[data-testid="analysis-cycles-view"]').exists()).toBe(true)
    await tab('sensitivity').trigger('click')
    expect(wrapper.find('[data-testid="analysis-cycles-view"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="analysis-sensitivity"]').exists()).toBe(true)
  })

  it('opens the view that explains the pinned item and follows later pins', async () => {
    mountTabs({ pinned: { type: 'channel', value: '10-34' } })
    expect(tab('channels').attributes('aria-selected')).toBe('true')
    await wrapper.setProps({ pinned: { type: 'gate', value: 34 } })
    expect(tab('gates').attributes('aria-selected')).toBe('true')
    await wrapper.setProps({ pinned: { type: 'center', value: 'Sacral' } })
    expect(tab('centers').attributes('aria-selected')).toBe('true')
  })

  it('stays on the view when the pin comes from inside it and forwards the selection', async () => {
    mountTabs({ pinned: { type: 'center', value: 'Sacral' } })
    await wrapper.get('[data-testid="analysis-center-root"] button.hda-chip').trigger('click')
    expect(wrapper.emitted('select')[0][0]).toEqual({ type: 'gate', value: 19 })
    await wrapper.setProps({ pinned: { type: 'gate', value: 19 } })
    expect(tab('centers').attributes('aria-selected')).toBe('true')
  })

  it('renders in pt-BR', () => {
    mountTabs({}, 'pt-BR')
    expect(tab('channels').text()).toBe('Canais e circuitos')
    expect(wrapper.text()).toContain('Nove centros')
  })
})
