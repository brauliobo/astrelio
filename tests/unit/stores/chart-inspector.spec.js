import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { humanDesignHighlight } from '../../../src/lib/chart/highlight.js'
import { useChartInspectorStore } from '../../../src/stores/chartInspector.js'

const chart = {
  positions: [
    { name: 'Sun', longitude: 300 },
  ],
}

describe('chartInspector store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('tracks hover selections without opening the drawer', () => {
    const inspector = useChartInspectorStore()

    inspector.receiveHighlightEvent({
      chart,
      highlight: { bodies: ['Sun', 'Sun'], aspectKey: '' },
    })

    expect(inspector.activeBodies).toEqual(['Sun'])
    expect(inspector.hasSelection).toBe(true)
    expect(inspector.drawerOpen).toBe(false)
    expect(inspector.sourceChart).toBe(chart)
  })

  it('opens and clears pinned selections', () => {
    const inspector = useChartInspectorStore()

    inspector.receiveHighlightEvent({
      chart,
      pinned:    true,
      highlight: { bodies: ['Sun', 'Mars'], aspectKey: 'Sun-Mars-sextile' },
    })

    expect(inspector.selectionKind).toBe('aspect')
    expect(inspector.activeAspectKey).toBe('Sun-Mars-sextile')
    expect(inspector.drawerOpen).toBe(true)

    inspector.receiveHighlightEvent({ pinned: true, highlight: null })

    expect(inspector.hasSelection).toBe(false)
    expect(inspector.drawerOpen).toBe(false)
  })

  it('tracks pinned count and restores the last selection when reopened', () => {
    const inspector = useChartInspectorStore()

    inspector.setPinnedHighlight({ bodies: ['Sun'], aspectKey: '' }, chart)
    inspector.setPinnedHighlight({ bodies: ['Mars'], aspectKey: '' }, chart)

    expect(inspector.pinnedCount).toBe(2)
    expect(inspector.canOpenDrawer).toBe(true)

    inspector.closeDrawer()
    inspector.openDrawer()

    expect(inspector.drawerOpen).toBe(true)
    expect(inspector.activeBodies).toEqual(['Mars'])

    inspector.clearPinnedHighlights()

    expect(inspector.pinnedCount).toBe(0)
    expect(inspector.drawerOpen).toBe(false)
    expect(inspector.canOpenDrawer).toBe(true)
  })

  it('tracks Human Design pinned selections without astrology carryover', () => {
    const inspector = useChartInspectorStore()
    const hdChart   = { type: 'Generator', details: { gates: [{ gate: 49 }] } }

    inspector.setPinnedHighlight({ bodies: ['Sun', 'Mars'], aspectKey: 'Sun-Mars-sextile' }, chart)
    inspector.receiveHighlightEvent({
      chart:     hdChart,
      pinned:    true,
      highlight: humanDesignHighlight('gate', 49, { line: 6 }),
    })

    expect(inspector.selectionKind).toBe('gate')
    expect(inspector.activeHumanDesign).toEqual({ type: 'gate', value: 49, line: 6 })
    expect(inspector.activeBodies).toEqual([])
    expect(inspector.activeAspectKey).toBe('')
    expect(inspector.drawerOpen).toBe(true)
    expect(inspector.sourceChart).toBe(hdChart)
    expect(inspector.pinnedCount).toBe(2)

    inspector.receiveHighlightEvent({
      chart:     hdChart,
      pinned:    true,
      highlight: humanDesignHighlight('gate', 49, { line: 6 }),
    })

    expect(inspector.pinnedCount).toBe(2)
  })

  it('loads pinned selections by active chart key', () => {
    const inspector = useChartInspectorStore()

    inspector.setActiveChartKey('person:ada')
    inspector.setPinnedHighlight({ bodies: ['Sun'], aspectKey: '' }, chart)

    inspector.setActiveChartKey('person:marie')
    expect(inspector.pinnedCount).toBe(0)
    expect(inspector.canOpenDrawer).toBe(false)

    inspector.setPinnedHighlight({ bodies: ['Mars'], aspectKey: '' }, chart)
    inspector.setActiveChartKey('person:ada')

    expect(inspector.pinnedCount).toBe(1)
    expect(inspector.activeBodies).toEqual(['Sun'])
  })
})
