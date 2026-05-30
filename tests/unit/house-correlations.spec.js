import { describe, expect, it } from 'vitest'
import {
  MODERN_SIGN_RULERS,
  combinedHouseCorrelations,
  natalHouseCorrelations,
  relationshipHouseCorrelations,
  timingHouseCorrelations,
} from '../../src/lib/astro/house-correlations.js'

const mk = (name, longitude, speed = 1) => ({ name, longitude, latitude: 0, speed, retrograde: speed < 0 })

const chart = {
  zodiac:    'tropical',
  ascendant: 0,
  mc:        90,
  cusps:     Array.from({ length: 12 }, (_, index) => index * 30),
  positions: [
    mk('Sun', 5),
    mk('Moon', 96),
    mk('Mercury', 214),
    mk('Pluto', 245),
    mk('Uranus', 315),
    mk('Neptune', 340),
  ],
}

const aspects = [
  { a: 'Sun', b: 'Moon', type: 'square', delta: 1, orb: 7, strength: 0.7 },
  { a: 'Mercury', b: 'Pluto', type: 'conjunction', delta: 0.4, orb: 8, strength: 0.95 },
]

describe('house correlations', () => {
  it('returns all houses and ranks occupied houses with aspect support', () => {
    const correlations = natalHouseCorrelations(chart, aspects)

    expect(correlations.houses).toHaveLength(12)
    const firstHouse = correlations.houses[0]
    expect(correlations.ranked.map(row => row.house)).toContain(1)
    expect(firstHouse.occupants).toEqual([
      expect.objectContaining({ planet: 'Sun', house: 1 }),
    ])
    expect(firstHouse.reasons.map(reason => reason.type)).toContain('occupant')
    expect(firstHouse.reasons.map(reason => reason.type)).toContain('aspect')
    expect(correlations.summary.topHouses).toHaveLength(5)
  })

  it('uses modern psychological rulers for Scorpio, Aquarius, and Pisces', () => {
    expect(MODERN_SIGN_RULERS[7]).toBe('Pluto')
    expect(MODERN_SIGN_RULERS[10]).toBe('Uranus')
    expect(MODERN_SIGN_RULERS[11]).toBe('Neptune')

    const correlations = natalHouseCorrelations(chart, [])

    expect(correlations.houses[7]).toMatchObject({
      house:      8,
      ruler:      'Pluto',
      rulerHouse: 9,
    })
    expect(correlations.houses[10]).toMatchObject({
      house:      11,
      ruler:      'Uranus',
      rulerHouse: 11,
    })
    expect(correlations.houses[11]).toMatchObject({
      house:      12,
      ruler:      'Neptune',
      rulerHouse: 12,
    })
  })

  it('scores timing overlay planets by natal house and timing aspects', () => {
    const transit = {
      ...chart,
      positions: [
        mk('Saturn', 8, 0.03),
        mk('Venus', 130),
      ],
    }
    const transitAspects = [
      { a: 'Sun', b: 'Saturn', type: 'conjunction', delta: 0.5, orb: 8, strength: 0.9 },
    ]

    const correlations = timingHouseCorrelations(chart, transit, transitAspects, 'transit')
    const firstHouse   = correlations.houses[0]

    expect(firstHouse.activators).toEqual([
      expect.objectContaining({ planet: 'Saturn', house: 1, mode: 'timing' }),
    ])
    expect(firstHouse.reasons.map(reason => reason.type)).toEqual(expect.arrayContaining(['timing', 'timing_aspect']))
    expect(correlations.summary.dominantMode).toBe('timing')
  })

  it('scores relationship overlay planets by base houses', () => {
    const partner = {
      ...chart,
      positions: [
        mk('Venus', 190),
        mk('Mars', 20),
      ],
    }
    const synastryAspects = [
      { a: 'Moon', b: 'Venus', type: 'square', delta: 1.1, orb: 7, strength: 0.75 },
    ]

    const correlations = relationshipHouseCorrelations(chart, partner, synastryAspects)
    const seventhHouse = correlations.houses[6]

    expect(seventhHouse.activators).toEqual([
      expect.objectContaining({ planet: 'Venus', house: 7, mode: 'relationship' }),
    ])
    expect(seventhHouse.reasons.map(reason => reason.type)).toContain('relationship')
    expect(correlations.summary.dominantMode).toBe('relationship')
  })

  it('handles missing charts and combines available modes without throwing', () => {
    expect(natalHouseCorrelations(null, []).houses).toHaveLength(12)
    expect(timingHouseCorrelations(null, null, []).ranked).toEqual([])
    expect(relationshipHouseCorrelations(null, null, []).ranked).toEqual([])

    const combined = combinedHouseCorrelations({
      natalChart:    chart,
      natalAspects:  aspects,
      timingChart:   { ...chart, positions: [mk('Saturn', 8)] },
      timingAspects: [{ a: 'Sun', b: 'Saturn', type: 'conjunction', delta: 1, orb: 8, strength: 0.8 }],
    })

    expect(combined.houses).toHaveLength(12)
    expect(combined.summary.modeTotals.natal).toBeGreaterThan(0)
    expect(combined.summary.modeTotals.timing).toBeGreaterThan(0)
  })
})
