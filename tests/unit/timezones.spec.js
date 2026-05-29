import { describe, expect, it } from 'vitest'
import { ianaOffsetMinutes, inferIanaZone, localToUtcMs, offsetMinutesForPerson } from '../../src/lib/astro/timezones.js'

describe('timezones', () => {
  it('resolves historical Brazil DST with IANA data', () => {
    expect(ianaOffsetMinutes('1986-02-12T18:10', 'America/Sao_Paulo')).toBe(-120)
  })

  it('resolves locations outside the Sao Paulo fallback', () => {
    expect(inferIanaZone('Manaus, AM - Brasil')).toBe('America/Manaus')
    expect(offsetMinutesForPerson({
      isoLocal: '2024-07-01T12:00',
      placeLabel: 'Manaus, AM - Brasil',
      tzOffsetMinutes: -180,
    })).toBe(-240)
  })

  it('throws instead of silently using UTC for invalid IANA zones', () => {
    expect(() => ianaOffsetMinutes('2024-01-01T12:00', 'America/Not_A_Zone')).toThrow(/invalid IANA timezone/)
  })

  it('converts local civil time and numeric offset to UTC milliseconds', () => {
    expect(new Date(localToUtcMs('2024-01-01T09:30', -180)).toISOString()).toBe('2024-01-01T12:30:00.000Z')
  })
})
