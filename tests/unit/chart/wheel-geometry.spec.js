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
import { evenlySpacedRadii, RADIAL_ALIGNMENT } from '../../../src/lib/chart/radialSpacing.js'

const mk         = (name, longitude, speed = 1) => ({ name, longitude, latitude: 0, speed, retrograde: false })
const closePoint = (actual, expected) => {
  expect(actual.x).toBeCloseTo(expected.x, 6)
  expect(actual.y).toBeCloseTo(expected.y, 6)
}
const expectEqualVisualGaps = (radii, inner, outer, itemSize) => {
  const sorted = [...radii].sort((a, b) => a - b)
  const gaps   = [sorted[0] - (itemSize / 2) - inner]
  for (let index = 1; index < sorted.length; index += 1) {
    gaps.push(sorted[index] - sorted[index - 1] - itemSize)
  }
  gaps.push(outer - sorted.at(-1) - (itemSize / 2))
  gaps.forEach(gap => expect(gap).toBeCloseTo(gaps[0], 6))
}

const placementSnapshot = (placements) =>
  Object.fromEntries(placements.map(item => [item.planet.name, {
    glyphLongitude: Number(item.glyphLongitude.toFixed(6)),
    labelAnchor:    item.labelAnchor,
    labelPoint:     {
      x: Number(item.labelPoint.x.toFixed(6)),
      y: Number(item.labelPoint.y.toFixed(6)),
    },
    radius:          item.radius,
    showDegreeLabel: item.showDegreeLabel,
    laneIndex:       item.laneIndex,
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

  it('shares centered and outer-anchored radial alignment modes', () => {
    const options = { inner: 88, outer: 156, itemSize: 22 }

    expect(evenlySpacedRadii(2, { ...options, alignment: RADIAL_ALIGNMENT.CENTERED })).toEqual([107, 137])
    expect(evenlySpacedRadii(2, { ...options, alignment: RADIAL_ALIGNMENT.OUTER })).toEqual([156, 134])
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
    const line       = naturalAspectLines(chart, 0, undefined, placements)[0]
    const sun        = placements.find(item => item.planet.name === 'Sun')

    expect(line.start.x).toBeCloseTo(sun.point.x, 6)
    expect(line.start.y).toBeCloseTo(sun.point.y, 6)
  })

  it('spaces crowded stellium glyphs evenly across the radial band on exact longitude rays', () => {
    const chart = {
      positions: [
        mk('Sun', 10),
        mk('Moon', 10.2),
        mk('Mercury', 10.4),
      ],
    }
    const placements = planetPlacements(chart, 15, planetBandFor({}, 0, 1))
    const sun        = placements.find(item => item.planet.name === 'Sun')

    expect(sun.longitude).toBeCloseTo(25)
    closePoint(sun.tick, polarPoint(152, 25))
    closePoint(sun.point, polarPoint(sun.radius, 25))
    expect(sun.glyphLongitude).toBeCloseTo(sun.longitude)
    expect(placements.every(item => item.isCrowded)).toBe(true)
    expect(placements.every(item => item.showDegreeLabel)).toBe(true)

    expect(new Set(placements.map(item => item.radius)).size).toBe(placements.length)
    expect(placements.map(item => item.radius)).toEqual([99.5, 122, 144.5])
    expectEqualVisualGaps(placements.map(item => item.radius), 88, 156, 22)
    expect(placements.every(item => item.longitude >= 25 && item.longitude <= 25.4)).toBe(true)
    expect(placements.every(item => item.glyphLongitude === item.longitude)).toBe(true)
  })

  it('places two close planets at opposite radial edges without changing longitude', () => {
    const placements = planetPlacements({
      positions: [
        mk('Mars', 20),
        mk('Saturn', 21),
      ],
    }, 0, planetBandFor({}, 0, 1))

    expect(placements.map(item => item.planet.name)).toEqual(['Mars', 'Saturn'])
    expect(placements.map(item => item.radius)).toEqual([107, 137])
    expectEqualVisualGaps(placements.map(item => item.radius), 88, 156, 22)
    expect(placements.every(item => item.glyphLongitude === item.longitude)).toBe(true)
  })

  it('radially separates visually overlapping transit glyphs', () => {
    const band = {
      inner:         188,
      outer:         232,
      defaultRadius: 214,
      tickRadius:    196,
      glyphPadding:  8,
      glyphSize:     20,
    }
    const placements = planetPlacements({
      positions: [
        mk('Sun', 40),
        mk('Moon', 45),
        mk('Mars', 82),
      ],
    }, 0, band)

    expect(placements.map(item => Number(item.radius.toFixed(6)))).toEqual([199.333333, 220.666667, 214])
    expect(placements.slice(0, 2).every(item => item.isCrowded)).toBe(true)
    expect(placements[2].isCrowded).toBe(false)
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
      inner:      88,
      outer:      156,
      tickRadius: 152,
    })
  })

  it('separates every crowded group in the reported 2014 chart and includes Fortune', () => {
    const chart = {
      ascendant: 297.73633148147826,
      fortune:   198.75805650458474,
      positions: [
        mk('Sun', 143.81478426286938),
        mk('Moon', 44.836509285975865),
        mk('Mercury', 152.04422209199515),
        mk('Venus', 125.46063161366371),
        mk('Mars', 222.1672997119659),
        mk('Jupiter', 126.92311406290419),
        mk('Saturn', 227.22831241993856),
        mk('Uranus', 16.24774262974616),
        mk('Neptune', 336.53363263223116),
        mk('Pluto', 281.325045982673),
        mk('NorthNode', 201.01604549987283),
        mk('SouthNode', 21.016045499872803),
        mk('Lilith', 138.4835741904149),
        mk('Chiron', 346.40656564240885),
      ],
    }
    const placements = planetPlacements(chart, 62.26366851852174, planetBandFor({}, 0, 1))
    const byName     = new Map(placements.map(item => [item.planet.name, item]))
    const groups     = [
      ['Uranus', 'SouthNode'],
      ['Venus', 'Jupiter'],
      ['Lilith', 'Sun', 'Mercury'],
      ['NorthNode', 'Fortune'],
      ['Mars', 'Saturn'],
      ['Neptune', 'Chiron'],
    ]

    expect(byName.has('Fortune')).toBe(true)
    groups.forEach((names) => {
      const radii = names.map(name => byName.get(name).radius)
      expect(new Set(radii).size).toBe(names.length)
      expectEqualVisualGaps(radii, 88, 156, 22)
    })
    expect(placements.every(item => item.glyphLongitude === item.longitude)).toBe(true)
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
    const first  = planetPlacements({ positions }, 0, { inner: 134, outer: 150 })
    const second = planetPlacements({ positions: [...positions].reverse() }, 0, { inner: 134, outer: 150 })

    expect(placementSnapshot(first)).toEqual(placementSnapshot(second))
  })
})
