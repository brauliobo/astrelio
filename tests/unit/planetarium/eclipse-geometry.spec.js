import { describe, expect, it } from 'vitest'
import { lunarShadowFrame, lunarShadowTrack, solarShadowPoint, solarShadowTrack } from '../../../src/lib/planetarium/eclipseGeometry.js'

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
})
