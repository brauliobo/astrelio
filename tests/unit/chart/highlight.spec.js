import { describe, expect, it, vi } from 'vitest'
import {
  CHART_HIGHLIGHT_EVENT,
  aspectKey,
  broadcastChartHighlight,
  hasHighlight,
  humanDesignHighlight,
  normalizeHighlight,
  sameHighlight,
} from '../../../src/lib/chart/highlight.js'

describe('chart highlight contract', () => {
  it('normalizes empty payloads as no highlight', () => {
    expect(normalizeHighlight()).toEqual({
      bodies:    [],
      aspectKey: '',
      aspect:    null,
      hd:        null,
    })
    expect(hasHighlight(normalizeHighlight())).toBe(false)
  })

  it('normalizes astrology aspect payloads and compares by body set plus aspect key', () => {
    const aspect = { a: 'Sun', b: 'Mars', type: 'sextile', delta: 0.2 }
    const key    = aspectKey(aspect)

    const normalized = normalizeHighlight({
      bodies: ['Sun', 'Mars', 'Sun'],
      aspectKey: key,
      aspect,
    })

    expect(key).toBe('Sun-Mars-sextile')
    expect(normalized).toEqual({
      bodies:    ['Sun', 'Mars'],
      aspectKey: 'Sun-Mars-sextile',
      aspect,
      hd:        null,
    })
    expect(hasHighlight(normalized)).toBe(true)
    expect(sameHighlight(normalized, {
      bodies:    ['Mars', 'Sun'],
      aspectKey: 'Sun-Mars-sextile',
      aspect:    { delta: 99 },
    })).toBe(true)
    expect(sameHighlight(normalized, {
      bodies:    ['Mars', 'Sun'],
      aspectKey: 'Mars-Sun-sextile',
    })).toBe(false)
  })

  it('builds and compares Human Design payloads independently from astrology fields', () => {
    const gate = humanDesignHighlight('gate', 49, { line: 6, planet: 'Sun' })

    expect(gate).toEqual({
      bodies:    [],
      aspectKey: '',
      hd:        { type: 'gate', value: 49, line: 6, planet: 'Sun' },
    })
    expect(normalizeHighlight(gate)).toEqual({
      bodies:    [],
      aspectKey: '',
      aspect:    null,
      hd:        { type: 'gate', value: 49, line: 6, planet: 'Sun' },
    })
    expect(hasHighlight(gate)).toBe(true)
    expect(sameHighlight(gate, humanDesignHighlight('gate', 49, { line: 6, planet: 'Sun' }))).toBe(true)
    expect(sameHighlight(gate, humanDesignHighlight('gate', 49, { line: 5, planet: 'Sun' }))).toBe(false)
    expect(sameHighlight(gate, humanDesignHighlight('channel', '19-49'))).toBe(false)
  })

  it('broadcasts chart highlight events with the expected detail contract', () => {
    const listener  = vi.fn()
    const chart     = { positions: [{ name: 'Sun' }] }
    const highlight = humanDesignHighlight('center', 'Sacral')

    window.addEventListener(CHART_HIGHLIGHT_EVENT, listener)

    try {
      broadcastChartHighlight({ chart, pinned: true, highlight })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener.mock.calls[0][0].detail).toEqual({
        chart,
        pinned: true,
        highlight,
      })
    } finally {
      window.removeEventListener(CHART_HIGHLIGHT_EVENT, listener)
    }
  })
})
