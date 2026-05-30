import { describe, expect, it } from 'vitest'
import {
  CENTER,
  clusteredPlanets,
  midpointLongitude,
  naturalAspectLines,
  planetPlacements,
  planetBandFor,
  polarPoint,
  ringSectorPath,
} from '../../../src/components/chart/wheel/geometry.js'

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

  it('stacks crowded stellium glyphs radially on their exact longitude rays', () => {
    const chart = {
      positions: [
        mk('Sun', 10),
        mk('Moon', 10.2),
        mk('Mercury', 10.4),
        mk('Venus', 10.6),
        mk('Mars', 10.8),
      ],
    }
    const placements = planetPlacements(chart, 15, planetBandFor({}, 0, 1))
    const sun = placements.find(item => item.planet.name === 'Sun')

    expect(sun.longitude).toBeCloseTo(25)
    closePoint(sun.tick, polarPoint(152, 25))
    closePoint(sun.point, polarPoint(sun.radius, 25))
    expect(sun.glyphLongitude).toBeCloseTo(sun.longitude)
    closePoint(sun.glyphPoint, sun.point)
    expect(placements.every(item => item.isCrowded)).toBe(true)
    expect(placements.every(item => item.showDegreeLabel)).toBe(true)

    expect(new Set(placements.map(item => item.radius)).size).toBe(placements.length)
    expect(Math.min(...placements.map(item => item.radius))).toBeGreaterThan(78)
    expect(Math.max(...placements.map(item => item.radius))).toBeLessThan(150)
    expect(placements.map(item => Number(item.radius.toFixed(2)))).toEqual([92.84, 102.96, 113.08, 123.2, 133.32])
    expect(placements.every(item => item.longitude >= 25 && item.longitude <= 25.8)).toBe(true)
    expect(placements.every(item => item.glyphLongitude === item.longitude)).toBe(true)
  })

  it('keeps two close planets on nearby predictable lanes', () => {
    const placements = planetPlacements({
      positions: [
        mk('Mars', 20),
        mk('Saturn', 21),
      ],
    }, 0, planetBandFor({}, 0, 1))

    expect(placements.map(item => item.planet.name)).toEqual(['Mars', 'Saturn'])
    expect(placements.map(item => Number(item.radius.toFixed(2)))).toEqual([106.68, 128.68])
    expect(placements[1].radius - placements[0].radius).toBeGreaterThan(18)
    expect(placements[1].radius - placements[0].radius).toBeLessThan(24)
    expect(placements.every(item => item.glyphLongitude === item.longitude)).toBe(true)
  })

  it('places every degree label at the bottom-right of its glyph', () => {
    const placements = planetPlacements({
      positions: [
        mk('Moon', 118),
        mk('Chiron', 126),
        mk('Mars', 214),
      ],
    }, 0, planetBandFor({}, 0, 1))

    for (const placement of placements) {
      expect(placement.labelAnchor).toBe('start')
      expect(placement.labelSide).toBe('bottom-right')
      expect(placement.labelPoint.x - placement.glyphPoint.x).toBe(7)
      expect(placement.labelPoint.y - placement.glyphPoint.y).toBe(8)
    }
  })

  it('keeps the default single-chart planet band away from ring borders', () => {
    expect(planetBandFor({}, 0, 1)).toEqual({
      inner: 78,
      outer: 150,
      tickRadius: 152,
    })
  })

  it('keeps degree labels consistent across single and crowded placements', () => {
    const placements = planetPlacements({
      positions: [
        mk('Sun', 12),
        mk('Moon', 14),
        mk('Mercury', 16),
        mk('Mars', 80),
      ],
    }, 0, { inner: 134, outer: 150 })

    expect(placements.find(item => item.planet.name === 'Sun').showDegreeLabel).toBe(true)
    expect(placements.find(item => item.planet.name === 'Moon').showDegreeLabel).toBe(true)
    expect(placements.find(item => item.planet.name === 'Mercury').showDegreeLabel).toBe(true)
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
