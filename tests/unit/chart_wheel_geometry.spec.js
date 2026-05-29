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

  it('draws aspect endpoints at placed glyph points when placements are supplied', () => {
    const chart = {
      positions: [mk('Sun', 0), mk('Mars', 60)],
    }
    const placements = planetPlacements(chart, 0, { inner: 134, outer: 150 })
    const line = naturalAspectLines(chart, 0, undefined, placements)[0]
    const sun = placements.find(item => item.planet.name === 'Sun')

    expect(line.start.x).toBeCloseTo(sun.point.x, 6)
    expect(line.start.y).toBeCloseTo(sun.point.y, 6)
  })
})
