import { describe, expect, it } from 'vitest'
import { lunarShadowFrame, lunarShadowTrack, solarShadowPoint, solarShadowTrack } from '../../../src/lib/planetarium/eclipseGeometry.js'
import { AU_KM, EARTH_RADIUS_KM, MOON_RADIUS_KM } from '../../../src/lib/planetarium/constants.js'
import { geoEcliptic, lengthAu } from '../../../src/lib/planetarium/ephemeris3d.js'
import { shadowFactorAt, shadowProjection, raySphere } from '../../../src/lib/planetarium/shadows.js'

describe('eclipse geometry', () => {
  it('puts the 2024-04-08 central shadow over northern Mexico', () => {
    const point = solarShadowPoint(new Date('2024-04-08T18:17:19Z'))
    expect(point.latitude).toBeCloseTo(25.29, 1)
    expect(point.longitude).toBeCloseTo(-104.14, 1)
  })

  it('puts the 2026-08-12 central shadow over Iceland', () => {
    const point = solarShadowPoint(new Date('2026-08-12T17:46:00Z'))
    expect(point.latitude).toBeCloseTo(65.0, 0)
    expect(point.longitude).toBeCloseTo(-25.6, 0)
  })

  it('has no central shadow on Earth away from an eclipse', () => {
    expect(solarShadowPoint(new Date('2025-06-15T00:00:00Z'))).toBeNull()
  })

  it('traces a ground track that moves eastward through maximum', () => {
    const track = solarShadowTrack(Date.parse('2024-04-08T18:17:19Z'), { spanMinutes: 120, stepMinutes: 20 })
    expect(track.length).toBeGreaterThan(4)
    expect(track.at(-1).longitude).toBeGreaterThan(track[0].longitude)
  })

  it('places the Moon fully inside the umbra at a total lunar eclipse', () => {
    const frame  = lunarShadowFrame(new Date('2025-03-14T06:58:42Z'))
    const offset = Math.hypot(frame.xKm, frame.yKm)

    expect(frame.umbraKm).toBeCloseTo(4510, -2)
    expect(frame.penumbraKm).toBeCloseTo(8266, -2)
    expect(offset + frame.moonRadiusKm).toBeLessThan(frame.umbraKm)
  })

  it('leaves the Moon mostly outside the umbra at a shallow partial eclipse', () => {
    const frame  = lunarShadowFrame(new Date('2024-09-18T02:44:11Z'))
    const offset = Math.hypot(frame.xKm, frame.yKm)

    expect(offset).toBeLessThan(frame.penumbraKm)
    expect(offset + frame.moonRadiusKm).toBeGreaterThan(frame.umbraKm)
  })

  it('samples a track that approaches and leaves the shadow centre', () => {
    const track    = lunarShadowTrack(Date.parse('2025-03-14T06:58:42Z'), { spanMinutes: 240, stepMinutes: 60 })
    const offsets  = track.map(frame => Math.hypot(frame.xKm, frame.yKm))
    const minimum  = Math.min(...offsets)

    expect(track).toHaveLength(5)
    expect(offsets.indexOf(minimum)).toBe(2)
  })

  it('puts the Moon\'s centre in Earth\'s umbra at a total lunar eclipse, not in sunlight', () => {
    const when = new Date('2025-03-14T06:58:42Z')
    const sun  = geoEcliptic('Sun', when)
    const moon = geoEcliptic('Moon', when)
    const factor = shadowFactorAt({
      point:         { x: moon.x * AU_KM, y: moon.y * AU_KM, z: moon.z * AU_KM },
      occultRadius:  EARTH_RADIUS_KM,
      sunDirection:  sun,
      sunDistance:   lengthAu(sun) * AU_KM,
    })
    expect(factor).toBe(1)
    expect(shadowFactorAt({
      point:         { x: 0, y: 0, z: AU_KM },
      occultRadius:  EARTH_RADIUS_KM,
      sunDirection:  { x: 1, y: 0, z: 0 },
      sunDistance:   AU_KM,
    })).toBe(0)
  })
})

describe('shadow intersection', () => {
  const hitAt = (date, caster) => {
    const when = new Date(date)
    const sun  = geoEcliptic('Sun', when)
    const moon = geoEcliptic('Moon', when)
    const moonKm = { x: moon.x * AU_KM, y: moon.y * AU_KM, z: moon.z * AU_KM }
    if (caster === 'Earth') {
      return shadowProjection({
        caster: { x: 0, y: 0, z: 0 }, casterRadius: EARTH_RADIUS_KM,
        target: moonKm, targetRadius: MOON_RADIUS_KM,
        sunDirection: sun, sunDistance: lengthAu(sun) * AU_KM,
      })
    }
    return shadowProjection({
      caster: moonKm, casterRadius: MOON_RADIUS_KM,
      target: { x: 0, y: 0, z: 0 }, targetRadius: EARTH_RADIUS_KM,
      sunDirection: sun, sunDistance: lengthAu(sun) * AU_KM,
    })
  }

  it('meets a sphere on the near side of a unit ray', () => {
    const hit = raySphere({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 2)
    expect(hit.tNear).toBeCloseTo(8)
    expect(hit.tFar).toBeCloseTo(12)
    expect(raySphere({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 10, y: 8, z: 0 }, 2)).toBeNull()
  })

  it('hits the Moon with Earth\'s umbra at a total lunar eclipse', () => {
    const hit = hitAt('2025-03-14T06:58:42Z', 'Earth')
    const moon = geoEcliptic('Moon', new Date('2025-03-14T06:58:42Z'))
    const dist = Math.hypot(moon.x, moon.y, moon.z) * AU_KM
    expect(hit.hits).toBe(true)
    expect(hit.umbra).toBe(true)
    expect(hit.stampAlong).toBeGreaterThan(dist - MOON_RADIUS_KM * 1.2)
    expect(hit.stampAlong).toBeLessThan(dist)
  })

  it('hits Earth with the Moon\'s umbra at a total solar eclipse', () => {
    const hit = hitAt('2024-04-08T18:17:19Z', 'Moon')
    const moon = geoEcliptic('Moon', new Date('2024-04-08T18:17:19Z'))
    const dist = Math.hypot(moon.x, moon.y, moon.z) * AU_KM
    expect(hit.hits).toBe(true)
    expect(hit.umbra).toBe(true)
    expect(hit.stampAlong).toBeGreaterThan(dist - EARTH_RADIUS_KM * 1.2)
    expect(hit.stampAlong).toBeLessThan(dist)
  })

  it('does not project a shadow when the bodies miss each other', () => {
    expect(hitAt('2025-06-15T00:00:00Z', 'Earth').hits).toBe(false)
    expect(hitAt('2025-06-15T00:00:00Z', 'Moon').hits).toBe(false)
  })
})
