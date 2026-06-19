import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
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
})
