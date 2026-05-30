import { describe, expect, it } from 'vitest'
import { chartSignature, placementFor, rankTransitAspects, topAspects } from '../../src/lib/astro/analysis.js'

const mk = (name, longitude, speed = 1) => ({ name, longitude, latitude: 0, speed, retrograde: speed < 0 })

const chart = {
  zodiac:    'tropical',
  ascendant: 15,
  mc:        100,
  cusps:     [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345],
  positions: [
    mk('Sun', 10),
    mk('Moon', 132),
    mk('Mercury', 92, -1),
    mk('Mars', 190),
  ],
}

describe('chart analysis', () => {
  it('returns placements with sign and house context', () => {
    const sun = placementFor(chart, 'Sun')
    expect(sun.signIndex).toBe(0)
    expect(sun.house).toBe(12)
  })

  it('weights sign traits and angular planets', () => {
    const signature = chartSignature(chart)
    expect(signature.elements[0].key).toBe('fire')
    expect(signature.angularPlanets.map(item => item.name)).toContain('Sun')
    expect(signature.retrogrades).toEqual(['Mercury'])
  })

  it('adds tropical chart ruler, house ruler, sect, hemisphere, and dignity diagnostics', () => {
    const signature = chartSignature(chart)

    expect(signature.tropical.chartRuler).toMatchObject({
      planet:       'Mars',
      ascSignIndex: 0,
      signIndex:    6,
      house:        6,
    })
    expect(signature.tropical.houseRulers[0]).toMatchObject({
      house:      1,
      signIndex:  0,
      ruler:      'Mars',
      rulerHouse: 6,
    })
    expect(signature.tropical.sect).toMatchObject({
      type:    'day',
      light:   'Sun',
      benefic: 'Jupiter',
    })
    expect(signature.hemisphereEmphasis.horizontal.key).toBe('east')
    expect(signature.tropical.dignityBasics).toEqual(expect.arrayContaining([
      expect.objectContaining({ planet: 'Sun', dignities: ['exaltation'] }),
      expect.objectContaining({ planet: 'Mars', dignities: ['detriment'] }),
    ]))
  })

  it('does not apply tropical diagnostics to sidereal charts', () => {
    expect(chartSignature({ ...chart, zodiac: 'sidereal' }).tropical).toBeNull()
  })

  it('sorts aspects by computed strength before orb', () => {
    const aspects = [
      { type: 'square', delta: 0.5, strength: 0.2 },
      { type: 'trine', delta: 1.5, strength: 0.8 },
    ]
    expect(topAspects(aspects, 1)[0].type).toBe('trine')
  })

  it('ranks transit aspects by exactness, applying motion, speed, houses, and natal importance', () => {
    const natal = {
      zodiac:    'tropical',
      ascendant: 0,
      mc:        90,
      cusps:     Array.from({ length: 12 }, (_, index) => index * 30),
      positions: [mk('Sun', 5), mk('Moon', 100)],
    }
    const transit = {
      zodiac:    'tropical',
      ascendant: 0,
      mc:        90,
      cusps:     natal.cusps,
      positions: [mk('Moon', 5, 13), mk('Saturn', 6, 0.03)],
    }
    const aspects = [
      { a: 'Sun', b: 'Moon', type: 'conjunction', delta: 0.1, orb: 8, strength: 0.99, applying: false },
      { a: 'Sun', b: 'Saturn', type: 'conjunction', delta: 1.8, orb: 8, strength: 0.77, applying: true },
    ]

    const [ranked] = rankTransitAspects(aspects, natal, transit, 1)

    expect(ranked.b).toBe('Saturn')
    expect(ranked.rank).toMatchObject({
      applying:     true,
      transitHouse: 1,
      natalHouse:   1,
    })
    expect(ranked.rank.speed).toBeGreaterThan(0.85)
  })
})
