import { describe, expect, it } from 'vitest'
import {
  comparisonAspectInterpretations,
  natalAspectInterpretations,
  natalInterpretationSections,
  natalPlacementInterpretations,
} from '../../src/lib/astro/interpretations.js'

const mk = (name, longitude) => ({ name, longitude, latitude: 0, speed: 1, retrograde: false })

const chart = {
  cusps:     [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345],
  positions: [
    mk('Mars', 190),
    mk('Sun', 10),
    mk('Moon', 132),
  ],
}

const aspects = [
  { a: 'Sun', b: 'Moon', type: 'square', delta: 0.5, strength: 0.2 },
  { a: 'Sun', b: 'Mars', type: 'trine', delta: 1.5, strength: 0.8 },
]

describe('interpretations', () => {
  it('builds planet-in-sign and planet-in-house placement keys', () => {
    const [sun] = natalPlacementInterpretations(chart, { limit: 1 })

    expect(sun.planet).toBe('Sun')
    expect(sun.signIndex).toBe(0)
    expect(sun.house).toBe(12)
    expect(sun.signToneKey).toBe('interpretations.sign_tones.0')
    expect(sun.houseAreaKey).toBe('interpretations.house_areas.12')
  })

  it('ranks natal aspect interpretation rows by strength', () => {
    const [row] = natalAspectInterpretations(aspects, { limit: 1 })

    expect(row.aspect.type).toBe('trine')
    expect(row.toneKey).toBe('interpretations.aspect_tones.trine')
  })

  it('returns populated natal sections only', () => {
    const sections = natalInterpretationSections(chart, aspects, { placementLimit: 1, aspectLimit: 1 })

    expect(sections.map(section => section.key)).toEqual(['placements', 'aspects'])
    expect(sections[0].items).toHaveLength(1)
    expect(sections[1].items).toHaveLength(1)
  })

  it('uses overlay planets as transit and progression actors', () => {
    const [row] = comparisonAspectInterpretations(aspects, 'transit', { limit: 1 })

    expect(row.primaryPlanet).toBe('Mars')
    expect(row.secondaryPlanet).toBe('Sun')
    expect(row.textKey).toBe('interpretations.sentences.transit_aspect')
  })

  it('uses chart context to rank transit contacts beyond raw orb strength', () => {
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
      positions: [
        { ...mk('Moon', 5), speed: 13 },
        { ...mk('Saturn', 6), speed: 0.03 },
      ],
    }
    const transitAspects = [
      { a: 'Sun', b: 'Moon', type: 'conjunction', delta: 0.1, orb: 8, strength: 0.99, applying: false },
      { a: 'Sun', b: 'Saturn', type: 'conjunction', delta: 1.8, orb: 8, strength: 0.77, applying: true },
    ]

    const [row] = comparisonAspectInterpretations(transitAspects, 'transit', {
      limit:           1,
      baseChart:       natal,
      comparisonChart: transit,
    })

    expect(row.primaryPlanet).toBe('Saturn')
    expect(row.aspect.rank.transitHouse).toBe(1)
    expect(row.aspect.rank.natalImportance).toBeGreaterThan(0.9)
  })

  it('groups exact slow-planet progression self contacts behind meaningful contacts', () => {
    const progressionAspects = [
      { a: 'Uranus', b: 'Uranus', type: 'conjunction', delta: 0, strength: 1 },
      { a: 'Neptune', b: 'Neptune', type: 'conjunction', delta: 0, strength: 0.99 },
      { a: 'Pluto', b: 'Pluto', type: 'conjunction', delta: 0, strength: 0.98 },
      { a: 'Sun', b: 'Mars', type: 'trine', delta: 0.4, strength: 0.5 },
    ]

    const rows = comparisonAspectInterpretations(progressionAspects, 'progression', { limit: 3 })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      kind:            'progression',
      primaryPlanet:   'Mars',
      secondaryPlanet: 'Sun',
      aspect:          expect.objectContaining({ a: 'Sun', b: 'Mars', type: 'trine' }),
    })
    expect(rows[1]).toMatchObject({
      kind:     'group',
      groupKey: 'progression_slow_self',
      titleKey: 'comparison_insights.groups.progression_slow_self.title',
      aspects:  [
        expect.objectContaining({ a: 'Uranus', b: 'Uranus' }),
        expect.objectContaining({ a: 'Neptune', b: 'Neptune' }),
        expect.objectContaining({ a: 'Pluto', b: 'Pluto' }),
      ],
    })
  })

  it('keeps synastry planets in chart order', () => {
    const [row] = comparisonAspectInterpretations(aspects, 'synastry', { limit: 1 })

    expect(row.primaryPlanet).toBe('Sun')
    expect(row.secondaryPlanet).toBe('Mars')
    expect(row.textKey).toBe('interpretations.sentences.synastry_aspect')
  })
})
