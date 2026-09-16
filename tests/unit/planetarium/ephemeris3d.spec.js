import { describe, expect, it } from 'vitest'
import {
  constellationOf,
  geoEcliptic,
  helioEcliptic,
  lengthAu,
  librationOf,
  orientationBasis,
  sunwardOf,
} from '../../../src/lib/planetarium/ephemeris3d.js'

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z
const unit = (v) => {
  const length = lengthAu(v)
  return { x: v.x / length, y: v.y / length, z: v.z / length }
}

describe('planetarium ephemeris', () => {
  it('places Earth near perihelion at the start of January', () => {
    expect(lengthAu(helioEcliptic('Earth', new Date('2025-01-04T00:00:00Z')))).toBeCloseTo(0.9833, 3)
  })

  it('keeps Earth in the ecliptic plane', () => {
    const earth = helioEcliptic('Earth', new Date('2025-06-01T00:00:00Z'))
    expect(Math.abs(earth.y) / lengthAu(earth)).toBeLessThan(1e-4)
  })

  it('tilts the Earth axis by the real obliquity', () => {
    const north = orientationBasis('Earth', new Date('2025-01-01T00:00:00Z')).z
    expect((Math.acos(north.y) * 180) / Math.PI).toBeCloseTo(23.44, 1)
  })

  it('puts the sub-solar point where the Sun actually stands overhead', () => {
    const when  = new Date('2025-01-01T12:00:00Z')
    const basis = orientationBasis('Earth', when)
    const sun   = unit(geoEcliptic('Sun', when))
    expect((Math.atan2(dot(sun, basis.y), dot(sun, basis.x)) * 180) / Math.PI).toBeCloseTo(0.92, 1)
    expect((Math.asin(dot(sun, basis.z)) * 180) / Math.PI).toBeCloseTo(-22.96, 1)
  })

  it('reproduces lunar libration from the body orientation alone', () => {
    const when      = new Date('2025-01-01T12:00:00Z')
    const basis     = orientationBasis('Moon', when)
    const moon      = geoEcliptic('Moon', when)
    const toEarth   = unit({ x: -moon.x, y: -moon.y, z: -moon.z })
    const libration = librationOf(when)

    expect((Math.atan2(dot(toEarth, basis.y), dot(toEarth, basis.x)) * 180) / Math.PI).toBeCloseTo(libration.longitudeDeg, 1)
    expect((Math.asin(dot(toEarth, basis.z)) * 180) / Math.PI).toBeCloseTo(libration.latitudeDeg, 1)
  })

  it('points sunward back at the origin from a heliocentric body', () => {
    const earth   = helioEcliptic('Earth', new Date('2025-01-04T00:00:00Z'))
    const sunward = sunwardOf(earth)
    expect(sunward.x * earth.x + sunward.y * earth.y + sunward.z * earth.z).toBeCloseTo(-lengthAu(earth), 9)
    expect(lengthAu(sunward)).toBeCloseTo(1, 9)
    expect(sunwardOf({ x: 0, y: 0, z: 0 })).toEqual({ x: 1, y: 0, z: 0 })
  })

  it('reports the constellation a body stands in', () => {
    expect(constellationOf('Mars', new Date('2025-01-01T00:00:00Z'))).toBe('Cancer')
  })
})
