import { describe, expect, it } from 'vitest'
import {
  CENTER,
  clusteredPlanets,
  midpointLongitude,
  naturalAspectLines,
  planetPlacements,
  polarPoint,
  ringSectorPath,
} from '../../src/components/chart/wheel/geometry.js'

const mk = (name, longitude, speed = 1) => ({ name, longitude, latitude: 0, speed, retrograde: false })
const closePoint = (actual, expected) => {
  expect(actual.x).toBeCloseTo(expected.x, 6)
  expect(actual.y).toBeCloseTo(expected.y, 6)
}

const placementSnapshot = (placements) =>
  Object.fromEntries(placements.map(item => [item.planet.name, {
    glyphLongitude: Number(item.glyphLongitude.toFixed(6)),
    labelAnchor: item.labelAnchor,
    labelPoint: {
      x: Number(item.labelPoint.x.toFixed(6)),
      y: Number(item.labelPoint.y.toFixed(6)),
    },
    radius: item.radius,
    showDegreeLabel: item.showDegreeLabel,
    laneIndex: item.laneIndex,
  }]))

describe('chart wheel geometry', () => {
  it('converts ecliptic longitudes into SVG polar points', () => {
    expect(polarPoint(10, 0)).toEqual({ x: CENTER - 10, y: CENTER })
    expect(polarPoint(10, 180).x).toBeCloseTo(CENTER + 10, 6)
  })

  it('finds midpoint longitude across Aries wraparound', () => {
    expect(midpointLongitude(350, 20)).toBeCloseTo(5)
  })

  it('builds a closed ring sector path', () => {
    const path = ringSectorPath(100, 120, 350, 20)
    expect(path.startsWith('M ')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
  })

  it('clusters planets across the zero-degree wraparound', () => {
    const clusters = clusteredPlanets([mk('Sun', 358), mk('Moon', 2), mk('Mars', 45)])
    expect(clusters[0].map(planet => planet.name).sort()).toEqual(['Moon', 'Sun'])
  })

  it('draws aspect endpoints at exact placed points when placements are supplied', () => {
    const chart = {
      positions: [mk('Sun', 0), mk('Mars', 60)],
    }
    const placements = planetPlacements(chart, 0, { inner: 134, outer: 150 })
    const line = naturalAspectLines(chart, 0, undefined, placements)[0]
    const sun = placements.find(item => item.planet.name === 'Sun')

    expect(line.start.x).toBeCloseTo(sun.point.x, 6)
    expect(line.start.y).toBeCloseTo(sun.point.y, 6)
  })

  it('stacks crowded stellium glyphs on their exact longitude rays', () => {
    const chart = {
      positions: [
        mk('Sun', 10),
        mk('Moon', 10.2),
        mk('Mercury', 10.4),
        mk('Venus', 10.6),
        mk('Mars', 10.8),
      ],
    }
    const placements = planetPlacements(chart, 15, { inner: 134, outer: 150 })
    const sun = placements.find(item => item.planet.name === 'Sun')

    expect(sun.longitude).toBeCloseTo(25)
    closePoint(sun.tick, polarPoint(152, 25))
    closePoint(sun.point, polarPoint(sun.radius, 25))
    expect(sun.glyphLongitude).toBeCloseTo(sun.longitude)
    closePoint(sun.glyphPoint, sun.point)
    expect(placements.every(item => item.isCrowded)).toBe(true)
    expect(placements.every(item => item.showDegreeLabel)).toBe(false)

    expect(new Set(placements.map(item => item.radius)).size).toBe(placements.length)
    expect(placements.every(item => item.glyphLongitude === item.longitude)).toBe(true)
  })

  it('keeps degree labels always visible only outside crowded clusters', () => {
    const placements = planetPlacements({
      positions: [
        mk('Sun', 12),
        mk('Moon', 14),
        mk('Mercury', 16),
        mk('Mars', 80),
      ],
    }, 0, { inner: 134, outer: 150 })

    expect(placements.find(item => item.planet.name === 'Sun').showDegreeLabel).toBe(false)
    expect(placements.find(item => item.planet.name === 'Moon').showDegreeLabel).toBe(false)
    expect(placements.find(item => item.planet.name === 'Mercury').showDegreeLabel).toBe(false)
    expect(placements.find(item => item.planet.name === 'Mars').showDegreeLabel).toBe(true)
  })

  it('assigns crowded glyph and label placements deterministically', () => {
    const positions = [
      mk('Mars', 42),
      mk('Moon', 42),
      mk('Venus', 42),
      mk('Sun', 42),
      mk('Mercury', 42),
    ]
    const first = planetPlacements({ positions }, 0, { inner: 134, outer: 150 })
    const second = planetPlacements({ positions: [...positions].reverse() }, 0, { inner: 134, outer: 150 })

    expect(placementSnapshot(first)).toEqual(placementSnapshot(second))
  })
})
