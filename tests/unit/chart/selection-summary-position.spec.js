import { describe, expect, it } from 'vitest'
import { positionSelectionSummary } from '../../../src/lib/chart/selectionSummaryPosition.js'

const position = (anchor, viewport = { width: 1000, height: 700 }, tooltip = { width: 200, height: 100 }) =>
  positionSelectionSummary({ anchor, viewport, tooltip })

describe('selection summary positioning', () => {
  it('prefers right, then left, below, and above when each earlier side cannot fit', () => {
    expect(position({ left: 100, top: 200, right: 150, bottom: 230, width: 50, height: 30 }).side).toBe('right')
    expect(position({ left: 800, top: 200, right: 850, bottom: 230, width: 50, height: 30 }).side).toBe('left')

    const wideAnchor = { left: 20, top: 200, right: 980, bottom: 230, width: 960, height: 30 }
    expect(position(wideAnchor).side).toBe('below')
    expect(position({ ...wideAnchor, top: 570, bottom: 600 }).side).toBe('above')
  })

  it('uses vertical placement on mobile and clamps every edge to viewport padding', () => {
    const result = position(
      { left: 290, top: 10, right: 310, bottom: 30, width: 20, height: 20 },
      { width: 320, height: 480 },
      { width: 300, height: 460 },
    )

    expect(result.side).toBe('below')
    expect(result.left).toBe(10)
    expect(result.top).toBe(10)
    expect(result.left + 300).toBeLessThanOrEqual(310)
    expect(result.top + 460).toBeLessThanOrEqual(470)
  })
})
