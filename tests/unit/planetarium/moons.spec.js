import { describe, expect, it } from 'vitest'
import { MOONS, MOON_BY_NAME, isApproximate, isMoon, moonOrbitPath, moonOrientation, moonPosition, moonsOf } from '../../../src/lib/planetarium/moons.js'
import { orientationBasis } from '../../../src/lib/planetarium/ephemeris3d.js'
import { AU_KM } from '../../../src/lib/planetarium/constants.js'

const WHEN = new Date('2025-01-01T00:00:00Z')

const dot    = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z
const length = v => Math.hypot(v.x, v.y, v.z)
const cross  = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x })
const distanceKm = (moon, date = WHEN) => length(moonPosition(moon, date)) * AU_KM

/** Sign of the orbital angular momentum along the parent's spin axis. */
const isProgradeAt = (moon, date = WHEN) => {
  const later = new Date(date.getTime() + (moon.periodDays * 86400000) / 16)
  const pole  = orientationBasis(moon.parent, date).z
  return dot(cross(moonPosition(moon, date), moonPosition(moon, later)), pole) > 0
}

describe('moon catalogue', () => {
  it('groups moons under their planets', () => {
    expect(moonsOf('Jupiter').map(moon => moon.name)).toEqual(['Io', 'Europa', 'Ganymede', 'Callisto'])
    expect(moonsOf('Neptune').map(moon => moon.name)).toEqual(['Triton'])
    expect(isMoon('Titan')).toBe(true)
    expect(isMoon('Jupiter')).toBe(false)
  })

  it('marks only the Galilean moons as ephemeris-backed', () => {
    const exact = MOONS.filter(moon => !isApproximate(moon.name)).map(moon => moon.name)
    expect(exact).toEqual(['Io', 'Europa', 'Ganymede', 'Callisto'])
  })
})

describe('moon positions', () => {
  it('places the Galilean moons at their real distances from the ephemeris', () => {
    expect(distanceKm(MOON_BY_NAME.get('Io'))).toBeCloseTo(421571, -3)
    expect(distanceKm(MOON_BY_NAME.get('Ganymede'))).toBeCloseTo(1068632, -4)
    expect(distanceKm(MOON_BY_NAME.get('Callisto'))).toBeCloseTo(1890705, -4)
  })

  it('keeps modelled moons at their mean orbital radius', () => {
    for (const name of ['Titan', 'Triton', 'Charon', 'Phobos', 'Iapetus']) {
      const moon = MOON_BY_NAME.get(name)
      expect(distanceKm(moon)).toBeCloseTo(moon.semiMajorKm, -1)
    }
  })

  it('returns to the same place after one orbit', () => {
    const moon  = MOON_BY_NAME.get('Titan')
    const start = moonPosition(moon, WHEN)
    const later = moonPosition(moon, new Date(WHEN.getTime() + moon.periodDays * 86400000))
    const drift = Math.hypot(start.x - later.x, start.y - later.y, start.z - later.z) * AU_KM

    expect(drift).toBeLessThan(moon.semiMajorKm * 0.01)
  })

  it('travels prograde except for Triton', () => {
    for (const moon of MOONS) {
      expect([moon.name, isProgradeAt(moon)]).toEqual([moon.name, moon.name !== 'Triton'])
    }
  })

  it('tilts Iapetus well out of Saturn\'s equator', () => {
    const moon     = MOON_BY_NAME.get('Iapetus')
    const pole     = orientationBasis('Saturn', WHEN).z
    const position = moonPosition(moon, WHEN)
    const latitude = (Math.asin(dot(position, pole) / length(position)) * 180) / Math.PI

    expect(Math.abs(latitude)).toBeGreaterThan(5)
    expect(Math.abs(latitude)).toBeLessThanOrEqual(moon.inclinationDeg + 0.5)
  })

  it('closes the orbit ring on itself', () => {
    const points = moonOrbitPath(MOON_BY_NAME.get('Europa'), WHEN)
    const gap    = Math.hypot(
      points[0].x - points.at(-1).x,
      points[0].y - points.at(-1).y,
      points[0].z - points.at(-1).z
    ) * AU_KM

    expect(points).toHaveLength(96)
    expect(gap).toBeLessThan(MOON_BY_NAME.get('Europa').semiMajorKm * 0.1)
  })
})

describe('moon orientation', () => {
  it('keeps every moon tidally locked, prime meridian towards its planet', () => {
    for (const name of ['Io', 'Titan', 'Charon', 'Triton', 'Phobos']) {
      const moon     = MOON_BY_NAME.get(name)
      const basis    = moonOrientation(moon, WHEN)
      const position = moonPosition(moon, WHEN)
      const toParent = { x: -position.x / length(position), y: -position.y / length(position), z: -position.z / length(position) }
      const longitude = (Math.atan2(dot(toParent, basis.y), dot(toParent, basis.x)) * 180) / Math.PI

      expect(longitude).toBeCloseTo(0, 6)
    }
  })

  it('returns an orthonormal basis', () => {
    const basis = moonOrientation(MOON_BY_NAME.get('Ganymede'), WHEN)
    expect(length(basis.x)).toBeCloseTo(1, 9)
    expect(length(basis.y)).toBeCloseTo(1, 9)
    expect(length(basis.z)).toBeCloseTo(1, 9)
    expect(dot(basis.x, basis.y)).toBeCloseTo(0, 9)
    expect(dot(basis.y, basis.z)).toBeCloseTo(0, 9)
  })
})
