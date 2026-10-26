import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'
import AnalysisTabs from '../../../src/components/human-design/analysis/AnalysisTabs.vue'
import ModalityRouteSwitch from '../../../src/components/modalities/ModalityRouteSwitch.vue'
import ReadingDocumentView from '../../../src/components/readings/ReadingDocumentView.vue'
import HumanDesignPage from '../../../src/pages/HumanDesignPage.vue'
import { usePeopleStore } from '../../../src/stores/people.js'
import { useSessionStore } from '../../../src/stores/session.js'
import { referencePerson } from './reference-chart.js'

const mountPage = (props = {}, locale = 'en') => {
  const pinia = createPinia()
  setActivePinia(pinia)
  usePeopleStore().list = [{ ...referencePerson, createdAt: 1 }]
  useSessionStore().activePersonId = referencePerson.id

  return mount(HumanDesignPage, {
    props,
    global: {
      plugins: [pinia, createI18n({ legacy: false, locale, messages: { en, 'pt-BR': ptBR } })],
      stubs:   { RouterLink: true },
    },
  })
}

const text = (wrapper, testId) => wrapper.get(`[data-testid="${testId}"]`).text()

describe('Human Design workspace page', () => {
  beforeEach(() => document.body.replaceChildren())
  afterEach(() => vi.unstubAllGlobals())

  it('defaults to the chart view and retains the standalone modality switch', () => {
    const wrapper = mountPage()

    expect(wrapper.props()).toMatchObject({ workspace: false, workspaceView: 'chart' })
    expect(wrapper.findComponent(ModalityRouteSwitch).exists()).toBe(true)
    expect(wrapper.find('[data-testid="workspace-reference-chart"]').exists()).toBe(false)
  })

  it('summarizes the chart in eight facts that keep their test ids', () => {
    const wrapper = mountPage({ workspace: true })

    expect(wrapper.get('[data-testid="human-design-summary"]').element.children).toHaveLength(8)
    expect(text(wrapper, 'hd-type')).toBe('Generator')
    expect(text(wrapper, 'hd-strategy')).toBe('Wait to respond')
    expect(text(wrapper, 'hd-authority')).toBe('Emotional')
    expect(text(wrapper, 'hd-profile')).toBe('6 / 2')
    expect(text(wrapper, 'hd-definition')).toBe('Triple Split Definition')
    expect(text(wrapper, 'hd-cross')).toContain('Left Angle Cross')
    expect(text(wrapper, 'hd-signature')).toBe('Satisfaction')
    expect(text(wrapper, 'hd-not-self')).toBe('Frustration')
  })

  it('translates the facts and the shell', () => {
    const wrapper = mountPage({ workspace: true }, 'pt-BR')

    expect(text(wrapper, 'hd-type')).toBe('Gerador')
    expect(wrapper.get('[data-testid="human-design-summary"]').attributes('aria-label')).toBe('Resumo do mapa')
  })

  it('opens a chip explanation in the selection panel and releases it again', async () => {
    const wrapper = mountPage({ workspace: true })

    expect(wrapper.find('[data-testid="hd-detail-overview"]').exists()).toBe(true)
    await wrapper.get('[data-key="authority"]').trigger('click')
    expect(wrapper.get('[data-testid="hd-detail-authority"]').text()).toContain('Emotional')
    expect(wrapper.get('[data-key="authority"]').attributes('aria-pressed')).toBe('true')

    await wrapper.get('[data-key="authority"]').trigger('click')
    expect(wrapper.find('[data-testid="hd-detail-overview"]').exists()).toBe(true)
  })

  it('shares one selection between the bodygraph, the lists and the panel', async () => {
    const wrapper = mountPage({ workspace: true })

    await wrapper.get('[data-focus-id="gate:34"]').trigger('click')
    expect(wrapper.get('[data-testid="hd-detail-gate"]').text()).toContain('34')
    expect(wrapper.findAll('.hd-act[data-state="lit"]').map(row => row.attributes('data-gate'))).toEqual(['34', '10'])

    await wrapper.get('.hd-act[data-planet="Sun"][data-gate="49"]').trigger('click')
    expect(wrapper.get('[data-testid="hd-detail-gate"]').text()).toContain('49')
    expect(wrapper.get('[data-focus-id="gate:49"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-focus-id="gate:34"]').attributes('aria-pressed')).toBe('false')

    await wrapper.get('[data-testid="hd-selection-clear"]').trigger('click')
    expect(wrapper.find('[data-testid="hd-detail-overview"]').exists()).toBe(true)
    expect(wrapper.get('[data-focus-id="gate:49"]').attributes('aria-pressed')).toBe('false')
  })

  it('zooms a pinned center on small screens and keeps the pin when the zoom is reset', async () => {
    vi.stubGlobal('matchMedia', query => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }))
    const wrapper = mountPage({ workspace: true })
    const graph   = () => wrapper.get('[data-testid="bodygraph-svg"]')

    expect(wrapper.find('[data-testid="hd-zoom-reset"]').exists()).toBe(false)
    await wrapper.get('[data-focus-id="center:Sacral"]').trigger('click')
    expect(graph().attributes('data-zoomed')).toBe('true')

    await wrapper.get('[data-testid="hd-zoom-reset"]').trigger('click')
    expect(graph().attributes('data-zoomed')).toBe('false')
    expect(wrapper.find('[data-testid="hd-zoom-reset"]').exists()).toBe(false)
    expect(wrapper.get('[data-focus-id="center:Sacral"]').attributes('aria-pressed')).toBe('true')
  })

  it('does not zoom the bodygraph on wide screens', async () => {
    const wrapper = mountPage({ workspace: true })

    await wrapper.get('[data-focus-id="center:Sacral"]').trigger('click')
    expect(wrapper.get('[data-testid="bodygraph-svg"]').attributes('data-zoomed')).toBe('false')
  })

  it('lists both layers with 13 activations and swaps the bodygraph for the mandala', async () => {
    const wrapper = mountPage({ workspace: true })

    expect(wrapper.findAll('[data-testid="hd-list-design"] .hd-act')).toHaveLength(13)
    expect(wrapper.findAll('[data-testid="hd-list-personality"] .hd-act')).toHaveLength(13)

    await wrapper.get('[data-testid="hd-view-mandala"]').trigger('click')
    expect(wrapper.find('[data-testid="rave-mandala"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="mandala-gate-sector"]')).toHaveLength(64)
  })

  it('renders the reading document with the compact bodygraph as reference', () => {
    const wrapper = mountPage({ workspace: true, workspaceView: 'reading' })

    expect(wrapper.findComponent(ReadingDocumentView).exists()).toBe(true)
    expect(wrapper.get('[data-testid="workspace-reference-chart"] svg').attributes('data-size')).toBe('compact')
    expect(wrapper.findComponent(ModalityRouteSwitch).exists()).toBe(false)
  })

  it('mounts the analysis tabs in the data view with the shared selection', () => {
    const wrapper = mountPage({ workspace: true, workspaceView: 'data' })

    expect(wrapper.findComponent(AnalysisTabs).props('chart').type).toBe('Generator')
    expect(wrapper.find('[data-testid="human-design-summary"]').exists()).toBe(false)
  })
})
