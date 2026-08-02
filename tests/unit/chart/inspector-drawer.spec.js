import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ChartInspectorDrawer from '../../../src/components/chart/ChartInspectorDrawer.vue'
import { useChartInspectorStore } from '../../../src/stores/chartInspector.js'
import en from '../../../src/i18n/en.json'

const position = (name, longitude, speed = 1) => ({
  name,
  longitude,
  latitude:    0,
  speed,
  retrograde: speed < 0,
})

const chart = {
  cusps:     [120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90],
  positions: [
    position('Sun', 300 + 23 + (49 / 60)),
    position('Mars', 23 + (49 / 60), -1),
    position('Venus', 190),
  ],
}

const mountDrawer = () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const wrapper = mount(ChartInspectorDrawer, {
    props: {
      chart,
      person:      { name: 'Ada' },
      systemLabel: 'Tropical / Placidus',
    },
    global: {
      plugins: [pinia, createI18n({ legacy: false, locale: 'en', messages: { en } })],
    },
  })

  return { wrapper, inspector: useChartInspectorStore() }
}

describe('ChartInspectorDrawer', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders pinned aspect placement details', async () => {
    const { inspector } = mountDrawer()

    inspector.receiveHighlightEvent({
      chart,
      pinned:    true,
      highlight: { bodies: ['Sun', 'Mars'], aspectKey: 'Sun-Mars-sextile' },
    })
    await nextTick()

    const drawer = document.body.querySelector('[data-testid="chart-inspector-drawer"]')

    expect(drawer).not.toBeNull()
    expect(drawer.textContent).toContain('Sun Sextile Mars')
    expect(drawer.textContent).toContain('Ada')
    const marsBody = document.body.querySelector('[data-testid="chart-inspector-body-Mars"]')

    expect(drawer.textContent).toContain('Tropical / Placidus')
    expect(drawer.textContent).toContain('Aquarius')
    expect(marsBody.textContent).toContain('R')
  })

  it('closes without clearing the pinned selection', async () => {
    const { inspector } = mountDrawer()

    inspector.setPinnedHighlight({ bodies: ['Sun'], aspectKey: '' }, chart)
    await nextTick()
    await nextTick()

    document.body.querySelector('[data-testid="chart-inspector-close"]').click()
    await nextTick()

    expect(inspector.hasSelection).toBe(true)
    expect(inspector.drawerOpen).toBe(false)
  })

  it('renders a wheel-only sign axis and a meaningful pinned title', async () => {
    const { inspector } = mountDrawer()

    inspector.setPinnedHighlight({
      bodies:    [],
      aspectKey: '',
      wheel: {
        kind:              'sign',
        id:                'sign-0',
        signIndex:         0,
        oppositeSignIndex: 6,
        axisId:            'aries_libra',
      },
    }, chart)
    await nextTick()

    const drawer  = document.body.querySelector('[data-testid="chart-inspector-drawer"]')
    const axis    = document.body.querySelector('[data-testid="chart-inspector-sign-axis"]')
    const pin     = document.body.querySelector('[data-testid="chart-inspector-pin"]')
    const content = drawer.textContent

    expect(drawer.querySelector('#chart-inspector-title').textContent).toBe('Aries ↔ Libra')
    expect(pin.textContent).toBe('Aries ↔ Libra')
    expect(axis.textContent).toContain('AxisInitiative and reciprocity')
    expect(axis.textContent).toContain('Selected signAries')
    expect(axis.textContent).toContain('Complementary signLibra')
    expect(axis.textContent).toContain('Fire + Air')
    expect(axis.textContent).toContain('Cardinal')
    expect(axis.textContent).toContain('Yang')
    expect(axis.textContent).toContain('Aries occupantsMars')
    expect(axis.textContent).toContain('Libra occupantsVenus')
    expect(content).not.toContain('Bodies')
    expect(content).not.toContain('Select from a chart wheel')
  })

  it('keeps a generic sign wheel selection out of complementary-axis UI', async () => {
    const { inspector } = mountDrawer()

    inspector.setPinnedHighlight({
      wheel: {
        kind:      'sign',
        id:        'sign-0',
        signIndex: 0,
        symbol:    '♈',
        title:     'Unlocalized title',
        details:   [{ label: 'Span', value: '0° to 30°' }],
      },
    }, chart)
    await nextTick()

    const drawer = document.body.querySelector('[data-testid="chart-inspector-drawer"]')

    expect(drawer.querySelector('#chart-inspector-title').textContent).toBe('Aries ♈')
    expect(drawer.querySelector('[data-testid="chart-inspector-sign-axis"]')).toBeNull()
    expect(drawer.querySelector('[data-testid="chart-inspector-wheel-details"]').textContent).toContain('Span0° to 30°')
    expect(drawer.textContent).not.toContain('Bodies')
  })

  it('shows pinned count and clears saved pins separately', async () => {
    const { inspector } = mountDrawer()

    inspector.setPinnedHighlight({ bodies: ['Sun'], aspectKey: '' }, chart)
    inspector.setPinnedHighlight({ bodies: ['Mars'], aspectKey: '' }, chart)
    await nextTick()

    expect(document.body.querySelector('[data-testid="chart-inspector-pin-count"]').textContent).toContain('2')
    expect(document.body.querySelectorAll('[data-testid="chart-inspector-pin"]')).toHaveLength(2)

    document.body.querySelector('[data-testid="chart-inspector-clear-pins"]').click()
    await nextTick()

    expect(inspector.pinnedCount).toBe(0)
    expect(document.body.querySelector('[data-testid="chart-inspector-drawer"]')).toBeNull()
  })

  it('uses dialog semantics, closes with Escape, and returns focus', async () => {
    const returnButton = document.createElement('button')
    returnButton.dataset.testid = 'return-focus'
    document.body.append(returnButton)
    returnButton.focus()

    const { inspector } = mountDrawer()

    inspector.setPinnedHighlight({ bodies: ['Sun'], aspectKey: '' }, chart)
    await nextTick()

    const drawer = document.body.querySelector('[data-testid="chart-inspector-drawer"]')

    expect(drawer.getAttribute('role')).toBe('dialog')
    expect(drawer.getAttribute('aria-modal')).toBe('true')

    drawer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    await nextTick()

    expect(inspector.drawerOpen).toBe(false)
    expect(returnButton).toBe(document.activeElement)
  })
})
