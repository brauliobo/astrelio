import { describe, expect, it } from 'vitest'
import { compressRadius, expandRadius, bodyRadiusUnits, compressedSunRadius, pickRadiusUnits, scalePosition, focusDistance, MERCURY_PERIHELION_AU } from '../../../src/lib/planetarium/scale.js'
import { earthShadow, moonShadow, penumbraCone, shadowRadiiAt } from '../../../src/lib/planetarium/shadows.js'
import { lunarOrbitPath, orbitExtremes, orbitPath, skyTrack } from '../../../src/lib/planetarium/orbits.js'
import { EARTH_RADIUS_KM, MOON_RADIUS_KM, SUN_RADIUS_KM } from '../../../src/lib/planetarium/constants.js'

const length = point => Math.hypot(point.x, point.y, point.z)

describe('distance scaling', () => {
  it('stays monotonic and invertible', () => {
    expect(compressRadius(0)).toBe(0)
    expect(compressRadius(30)).toBeGreaterThan(compressRadius(1))
    expect(expandRadius(compressRadius(9.58))).toBeCloseTo(9.58, 6)
  })

  it('keeps directions untouched while compressing radius', () => {
    const scaled = scalePosition({ x: 3, y: 0, z: 4 }, { mode: 'compressed' })
    expect(scaled.z / scaled.x).toBeCloseTo(4 / 3, 9)
    expect(length(scaled)).toBeCloseTo(compressRadius(5), 9)
  })

  it('leaves true scale untouched', () => {
    expect(scalePosition({ x: 3, y: 0, z: 4 }, { mode: 'true' })).toEqual({ x: 3, y: 0, z: 4 })
  })

  it('exaggerates body radii without going below the floor', () => {
    expect(bodyRadiusUnits(EARTH_RADIUS_KM, { unitsPerAu: 1, exaggeration: 1000 })).toBeCloseTo(0.0426, 3)
    expect(bodyRadiusUnits(EARTH_RADIUS_KM, { minUnits: 0.1 })).toBe(0.1)
  })

  it('keeps a far-away true-scale body clickable without enlarging it', () => {
    expect(pickRadiusUnits(0.00465, 150)).toBeCloseTo(1.5, 6)
    expect(pickRadiusUnits(0.00465, 0.05)).toBeCloseTo(0.00465, 6)
  })

  it('keeps the sun and Jupiter in real radius proportion', () => {
    const sun     = bodyRadiusUnits(SUN_RADIUS_KM, { exaggeration: 4000 })
    const jupiter = bodyRadiusUnits(69911, { exaggeration: 4000 })
    expect(sun / jupiter).toBeCloseTo(SUN_RADIUS_KM / 69911, 5)
  })

  it('caps the compressed sun inside Mercury\'s perihelion so the inner planets stay in view', () => {
    const sun     = compressedSunRadius(4000)
    const jupiter = bodyRadiusUnits(69911, { exaggeration: 4000 })
    expect(sun).toBeLessThan(compressRadius(MERCURY_PERIHELION_AU) * 0.55)
    expect(sun).toBeGreaterThan(jupiter)
    expect(compressedSunRadius(1)).toBeCloseTo(bodyRadiusUnits(SUN_RADIUS_KM), 8)
  })

  it('frames a true-scale planet by its disc, not a system-sized floor', () => {
    const earth = bodyRadiusUnits(EARTH_RADIUS_KM)
    const distance = focusDistance(earth, { trueScale: true, moonReach: 0.00257, fovDeg: 45 })
    expect(distance / earth).toBeGreaterThan(6)
    expect(distance / earth).toBeLessThan(12)
    expect(distance).toBeLessThan(0.01)
  })

  it('pulls back only in compressed mode so a moon system still fits', () => {
    expect(focusDistance(1.8, { moonReach: 8 })).toBeCloseTo(25.6)
    expect(focusDistance(1.8, { moonReach: 8, trueScale: true })).toBeLessThan(20)
  })
})

describe('shadow cones', () => {
  it('matches the published umbra lengths', () => {
    expect(earthShadow(1).lengthKm / 1e6).toBeCloseTo(1.383, 2)
    expect(moonShadow(1).lengthKm / 1e6).toBeCloseTo(0.375, 2)
  })

  it('matches the umbra and penumbra widths at lunar distance', () => {
    const radii = shadowRadiiAt(EARTH_RADIUS_KM, 149597870.7, 384400)
    expect(radii.umbraKm).toBeCloseTo(4600, -2)
    expect(radii.penumbraKm).toBeCloseTo(8175, -2)
  })

  it('doubles the body radius at the end of the umbra, as the geometry demands', () => {
    const cone = penumbraCone(MOON_RADIUS_KM, 149597870.7, moonShadow(1).lengthKm)
    expect(cone.tipRadiusKm / MOON_RADIUS_KM).toBeCloseTo(2, 1)
  })
})

describe('orbits', () => {
  it('samples the real Mercury ellipse', () => {
    const { perihelion, aphelion } = orbitExtremes(orbitPath('Mercury', new Date('2025-01-01T00:00:00Z')))
    expect(length(perihelion)).toBeCloseTo(0.3075, 2)
    expect(length(aphelion)).toBeCloseTo(0.4667, 2)
  })

  it('closes the orbit polyline on itself', () => {
    const points = orbitPath('Earth', new Date('2025-01-01T00:00:00Z'))
    const gap    = Math.hypot(points[0].x - points.at(-1).x, points[0].y - points.at(-1).y, points[0].z - points.at(-1).z)
    expect(gap).toBeLessThan(0.05)
  })

  it('shows the 5 degree tilt of the lunar orbit', () => {
    const tilt = Math.max(...lunarOrbitPath(new Date('2025-01-01T00:00:00Z'))
      .map(point => Math.abs((Math.asin(point.y / length(point)) * 180) / Math.PI)))
    expect(tilt).toBeGreaterThan(4.9)
    expect(tilt).toBeLessThan(5.4)
  })

  it('projects sky tracks onto the unit sphere', () => {
    const track = skyTrack('Mars', new Date('2025-01-01T00:00:00Z'), { spanDays: 60, stepDays: 10 })
    expect(track).toHaveLength(7)
    for (const point of track) expect(length(point)).toBeCloseTo(1, 9)
  })
})
