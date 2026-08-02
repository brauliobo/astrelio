import { describe, expect, it } from 'vitest'
import { normalizeReportModality, reportModalitySlug } from '../../../src/lib/reports/modality.js'

describe('report modality', () => {
  it.each([
    [undefined, 'astrology'],
    ['astrology', 'astrology'],
    ['tropical', 'astrology'],
    ['vedic', 'vedic'],
    ['sidereal', 'vedic'],
    ['human-design', 'humanDesign'],
    ['human_design', 'humanDesign'],
    ['humanDesign', 'humanDesign'],
    [['SIDEREAL', 'tropical'], 'vedic'],
    ['unsupported', 'astrology'],
  ])('normalizes %j to %s', (value, expected) => {
    expect(normalizeReportModality(value)).toBe(expected)
  })

  it('provides stable URL and test slugs', () => {
    expect(reportModalitySlug('astrology')).toBe('tropical')
    expect(reportModalitySlug('vedic')).toBe('vedic')
    expect(reportModalitySlug('humanDesign')).toBe('human-design')
  })
})
