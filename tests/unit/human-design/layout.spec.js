import { describe, expect, it } from 'vitest'
import {
  BODYGRAPH_VIEWBOX,
  CENTER_GATES,
  CENTER_LAYOUT,
  CHANNELS_BY_GATE,
  CHANNEL_LAYOUT,
  GATE_LAYOUT,
  SILHOUETTE_PATH,
} from '../../../src/lib/human-design/layout.js'

const CANON = {
  Head:           [64, 61, 63],
  Ajna:           [47, 24, 4, 17, 43, 11],
  Throat:         [62, 23, 56, 16, 35, 20, 12, 45, 31, 8, 33],
  G:              [1, 7, 13, 10, 25, 15, 46, 2],
  Ego:            [21, 51, 26, 40],
  'Solar Plexus': [36, 22, 37, 6, 49, 55, 30],
  Spleen:         [48, 57, 44, 50, 32, 28, 18],
  Sacral:         [5, 14, 29, 34, 59, 27, 42, 3, 9],
  Root:           [53, 60, 52, 54, 19, 38, 39, 58, 41],
}

const canonCenter = Object.fromEntries(Object.entries(CANON).flatMap(([center, gates]) => gates.map(gate => [gate, center])))

const LANE_MARGIN = 2

// Samples the traced center outlines (absolute M/L and relative l/c commands).
const outline = (d) => {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g)
  const points = []
  let index    = 0
  let command  = ''
  let [x, y]   = [0, 0]
  const next   = () => Number(tokens[index++])

  while (index < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[index])) command = tokens[index++]
    if (command === 'z') continue
    if (command === 'M' || command === 'L') {
      ;[x, y] = [next(), next()]
      points.push([x, y])
    } else if (command === 'l') {
      ;[x, y] = [x + next(), y + next()]
      points.push([x, y])
    } else {
      const [p1, p2, p3] = [0, 1, 2].map(() => [x + next(), y + next()])
      const p0           = [x, y]
      for (let step = 1; step <= 24; step++) {
        const t = step / 24
        const u = 1 - t
        points.push([0, 1].map(k => u ** 3 * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t ** 3 * p3[k]))
      }
      ;[x, y] = p3
    }
  }
  return points
}

const segmentDistance = ([px, py], [ax, ay], [bx, by]) => {
  const [dx, dy] = [bx - ax, by - ay]
  const t        = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

const distance = (point, shape) => Math.min(...shape.map((vertex, i) => segmentDistance(point, vertex, shape[(i + 1) % shape.length])))

const contains = ([px, py], shape) => shape.reduce((inside, [ax, ay], i) => {
  const [bx, by] = shape[(i + shape.length - 1) % shape.length]
  return (ay > py) !== (by > py) && px < (bx - ax) * (py - ay) / (by - ay) + ax ? !inside : inside
}, false)

const ends = (d) => {
  const numbers = d.match(/-?\d*\.?\d+/g).map(Number)
  return [numbers.slice(0, 2), numbers.slice(-2)]
}

describe('Human Design bodygraph layout', () => {
  it('shares one viewBox per size', () => {
    expect(BODYGRAPH_VIEWBOX.full).toEqual([0, -112, 536, 936])
    expect(BODYGRAPH_VIEWBOX.compact).toEqual([8, -72, 520, 840])
  })

  it('places each of the 64 gates once on its canonical center', () => {
    const gates = Object.keys(GATE_LAYOUT).map(Number)
    expect(new Set(gates).size).toBe(64)
    expect(CENTER_GATES).toEqual(CANON)
    gates.forEach(gate => expect(GATE_LAYOUT[gate].center).toBe(canonCenter[gate]))
  })

  it('keeps every marker inside its own center bounds', () => {
    Object.values(GATE_LAYOUT).forEach(({ gate, x, y, center }) => {
      const [bx, by, bw, bh] = CENTER_LAYOUT[center].bbox
      expect(x, `gate ${gate} x`).toBeGreaterThanOrEqual(bx - LANE_MARGIN)
      expect(x, `gate ${gate} x`).toBeLessThanOrEqual(bx + bw + LANE_MARGIN)
      expect(y, `gate ${gate} y`).toBeGreaterThanOrEqual(by - LANE_MARGIN)
      expect(y, `gate ${gate} y`).toBeLessThanOrEqual(by + bh + LANE_MARGIN)
    })
  })

  it('never lets two markers overlap', () => {
    const markers = Object.values(GATE_LAYOUT)
    markers.forEach((a, i) => markers.slice(i + 1).forEach((b) => {
      expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.gate} vs ${b.gate}`).toBeGreaterThanOrEqual(2 * 10)
    }))
  })

  it('defines 36 channels between two different centers', () => {
    const channels = Object.values(CHANNEL_LAYOUT)
    expect(channels).toHaveLength(36)
    channels.forEach(({ id, gates, centers }) => {
      expect(id).toBe(gates.join('-'))
      expect(centers).toEqual(gates.map(gate => canonCenter[gate]))
      expect(centers[0]).not.toBe(centers[1])
    })
    Object.keys(GATE_LAYOUT).forEach(gate => expect(CHANNELS_BY_GATE[gate]?.length, `gate ${gate}`).toBeGreaterThan(0))
  })

  it('tucks every channel end under the edge of its two centers', () => {
    Object.values(CHANNEL_LAYOUT).forEach(({ id, d, centers }) => {
      ends(d).forEach((point, side) => {
        const shape = outline(CENTER_LAYOUT[centers[side]].d)
        expect(contains(point, shape), `${id} end ${side} inside`).toBe(true)
        expect(distance(point, shape), `${id} end ${side} depth`).toBeLessThan(7)
      })
    })
  })

  it('exposes the silhouette as a closed path', () => {
    expect(SILHOUETTE_PATH.startsWith('M')).toBe(true)
    expect(SILHOUETTE_PATH.endsWith('Z')).toBe(true)
  })
})
