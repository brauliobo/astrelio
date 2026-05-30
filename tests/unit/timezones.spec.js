import { describe, expect, it } from 'vitest'
import {
  ianaOffsetMinutes,
  inferIanaZone,
  formatUtcOffset,
  localToUtcMs,
  offsetMinutesForPerson,
  resolveIanaLocalTime,
  timezoneLabelForPerson,
} from '../../src/lib/astro/timezones.js'

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

  it('throws for invalid ISO local times', () => {
    expect(() => ianaOffsetMinutes('not-a-date', 'America/New_York')).toThrow(/invalid ISO/)
  })

  it('rejects nonexistent local times during spring-forward gaps', () => {
    expect(() => ianaOffsetMinutes('2024-03-10T02:30', 'America/New_York')).toThrow(/nonexistent local time/)
  })

  it('handles ambiguous local times during fall-back overlaps explicitly', () => {
    expect(ianaOffsetMinutes('2024-11-03T01:30', 'America/New_York')).toBe(-240)
    expect(ianaOffsetMinutes('2024-11-03T01:30', 'America/New_York', { disambiguation: 'later' })).toBe(-300)
    expect(() => {
      resolveIanaLocalTime('2024-11-03T01:30', 'America/New_York', { disambiguation: 'reject' })
    }).toThrow(/ambiguous local time/)
  })

  it('resolves half-hour IANA zones', () => {
    expect(ianaOffsetMinutes('2024-07-01T12:00', 'Asia/Kolkata')).toBe(330)
    expect(ianaOffsetMinutes('2024-07-01T12:00', 'Australia/Adelaide')).toBe(570)
  })

  it('formats reusable timezone labels for chart headers', () => {
    expect(formatUtcOffset(-120)).toBe('UTC-02:00')
    expect(formatUtcOffset(330)).toBe('UTC+05:30')
    expect(timezoneLabelForPerson({
      isoLocal: '1986-02-12T18:10',
      placeLabel: 'São José dos Campos, SP - Brasil',
      tzOffsetMinutes: -180,
    })).toBe('America/Sao_Paulo · UTC-02:00')
  })

  it('converts local civil time and numeric offset to UTC milliseconds', () => {
    expect(new Date(localToUtcMs('2024-01-01T09:30', -180)).toISOString()).toBe('2024-01-01T12:30:00.000Z')
  })
})
