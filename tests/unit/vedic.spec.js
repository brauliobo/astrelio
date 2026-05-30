import { describe, expect, it } from 'vitest'
import { buildVedicChart } from '../../src/lib/vedic/chart.js'
import { nakshatraOf, navamsaSignIndex, vimshottariDashas } from '../../src/lib/vedic/derivations.js'

const REF = {
  id:              'ref',
  isoLocal:        '1986-02-12T18:10',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88,
}

describe('vedic astrology', () => {
  it('maps nakshatra and pada from sidereal longitude', () => {
    expect(nakshatraOf(0)).toMatchObject({ key: 'ashwini', pada: 1, lord: 'ketu' })
    expect(nakshatraOf(13.5)).toMatchObject({ key: 'bharani', pada: 1, lord: 'venus' })
    expect(nakshatraOf(359.9)).toMatchObject({ key: 'revati', pada: 4, lord: 'mercury' })
  })

  it('derives navamsa signs by rasi mode', () => {
    expect(navamsaSignIndex(0)).toBe(0)
    expect(navamsaSignIndex(30)).toBe(9)
    expect(navamsaSignIndex(60)).toBe(6)
  })

  it('builds a Swiss Ephemeris sidereal Vedic chart', async () => {
    const chart = await buildVedicChart(REF, {
      ayanamsha:            'lahiri',
      houseMode:            'whole_sign',
      nodeMode:             'mean',
      includeModernPlanets: false,
    })

    expect(chart.modality).toBe('vedic')
    expect(chart.positions.map(position => position.name)).toEqual([
      'Sun',
      'Moon',
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn',
      'NorthNode',
      'SouthNode',
    ])
    expect(chart.ayanamshaValue).toBeGreaterThan(23)
    expect(chart.ayanamshaValue).toBeLessThan(25)
    expect(chart.cusps).toHaveLength(12)
    expect(chart.navamsa).toHaveLength(9)
    expect(chart.dashas.active.mahadasha).toBeTruthy()
  })

  it('creates Vimshottari periods with active maha and antar dasha', () => {
    const dashas = vimshottariDashas(120, 2451545, 2451545 + 100)

    expect(dashas.mahadashas).toHaveLength(10)
    expect(dashas.active.mahadasha).toBeTruthy()
    expect(dashas.active.antardasha).toBeTruthy()
  })
})
