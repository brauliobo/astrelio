import { describe, expect, it } from 'vitest'
import {
  TROPICAL_READING_CHAPTERS,
  TROPICAL_READING_SCHEMA_VERSION,
  tropicalReadingDocument,
} from '../../../src/lib/astro/interpretations.js'
import { elementForSign } from '../../../src/lib/astro/elements.js'

const mk = (name, longitude, options = {}) => ({
  name,
  longitude,
  latitude:   0,
  speed:      options.speed ?? 1,
  retrograde: options.retrograde ?? false,
})

const chart = {
  zodiac:    'tropical',
  ascendant: 0,
  mc:        90,
  cusps:     Array.from({ length: 12 }, (_, index) => index * 30),
  positions: [
    mk('Sun', 5),
    mk('Moon', 185),
    mk('Mercury', 20),
    mk('Venus', 140),
    mk('Mars', 95),
    mk('Jupiter', 260),
    mk('Saturn', 300, { retrograde: true, speed: -0.1 }),
    mk('Uranus', 45),
    mk('Neptune', 75),
    mk('Pluto', 210),
    mk('NorthNode', 160),
    mk('SouthNode', 340),
    mk('Chiron', 225),
    mk('Lilith', 275),
  ],
}

const aspects = [
  { a: 'Sun',     b: 'Moon',    type: 'opposition', delta: 0.2, strength: 0.91, applying: true },
  { a: 'Sun',     b: 'Mars',    type: 'square',     delta: 0.4, strength: 0.84, applying: false },
  { a: 'Moon',    b: 'Mars',    type: 'square',     delta: 0.5, strength: 0.82, applying: true },
  { a: 'Mercury', b: 'Venus',  type: 'trine',      delta: 0.3, strength: 0.79, applying: true },
  { a: 'Mercury', b: 'Jupiter', type: 'trine',     delta: 0.7, strength: 0.73, applying: false },
  { a: 'Venus',   b: 'Jupiter', type: 'trine',     delta: 0.8, strength: 0.71, applying: true },
]

const traceableRows = document => [
  ...document.summary.themes,
  ...document.chapters.flatMap(chapter => chapter.items),
  ...document.prominence,
  ...document.strengths,
  ...document.challenges,
  ...document.practices,
]

const axisThemes = document => document.summary.themes.filter(row => row.id.startsWith('theme:sign-axis:'))
const axisEvidence = document => document.evidence.filter(row => row.kind === 'sign_axis')

describe('Tropical psychological reading document', () => {
  it('returns a normalized schema with stable psychological chapters and supported factors', () => {
    const document = tropicalReadingDocument(chart, aspects)

    expect(document).toMatchObject({
      schemaVersion: TROPICAL_READING_SCHEMA_VERSION,
      id:            'tropical-psychological',
      modality:      'astrology',
      tradition:     'tropical',
      kind:          'psychological',
      title:         { key: 'readings.tropical.document.title', params: {} },
    })
    expect(document.chapters.map(chapter => chapter.id)).toEqual(TROPICAL_READING_CHAPTERS)
    expect(document.evidence.filter(row => row.kind === 'placement')).toHaveLength(14)
    expect(document.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'chart-ruler', kind: 'chart_ruler' }),
      expect.objectContaining({ id: 'lunar-phase', kind: 'lunar_phase' }),
      expect.objectContaining({ kind: 'configuration', facts: expect.objectContaining({ type: 't_square' }) }),
      expect.objectContaining({ kind: 'configuration', facts: expect.objectContaining({ type: 'grand_trine' }) }),
    ]))
    expect(document.strengths.length).toBeGreaterThan(0)
    expect(document.challenges.length).toBeGreaterThan(0)
    expect(document.practices).toHaveLength(document.challenges.length)
  })

  it('makes every interpretation row traceable to normalized evidence', () => {
    const document    = tropicalReadingDocument(chart, aspects)
    const evidenceIds = new Set(document.evidence.map(row => row.id))

    expect(new Set(document.evidence.map(row => row.id)).size).toBe(document.evidence.length)
    for (const row of traceableRows(document)) {
      expect(row.evidenceIds.length, row.id || row.factorId).toBeGreaterThan(0)
      expect(row.evidenceIds.every(id => evidenceIds.has(id)), row.id || row.factorId).toBe(true)
    }
  })

  it('reports deterministic limits and completeness without dropping placements', () => {
    const options = {
      aspectLimit:        2,
      prominenceLimit:    3,
      themeLimit:         2,
      resourceLimit:      1,
      configurationLimit: 0,
    }
    const first  = tropicalReadingDocument(chart, aspects, options)
    const second = tropicalReadingDocument(structuredClone(chart), structuredClone(aspects), options)

    expect(second).toEqual(first)
    expect(first.completeness).toMatchObject({
      available: { placements: 14, aspects: 6, signAxes: 6 },
      included:  { placements: 14, aspects: 2, signAxes: 6, configurations: 0 },
      truncated: { aspects: true, prominence: true, configurations: true },
    })
    expect(first.prominence).toHaveLength(3)
    expect(first.summary.themes).toHaveLength(2)
    expect(first.evidence.filter(row => row.kind === 'placement')).toHaveLength(14)
  })

  it('adds factual evidence only for sign axes represented by reading bodies on both sides', () => {
    const axisChart = {
      zodiac: 'tropical',
      positions: [
        mk('Sun', 5),
        mk('Mercury', 10),
        mk('Moon', 185),
        mk('Venus', 190),
      ],
    }
    const document = tropicalReadingDocument(axisChart, [])
    const rows     = axisEvidence(document)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id:   expect.stringMatching(/^sign-axis:/),
      kind: 'sign_axis',
      facts: {
        primarySignIndex:  0,
        oppositeSignIndex: 6,
        signIndices:       [0, 6],
        modality:          expect.any(String),
        polarity:          expect.anything(),
        elements:          expect.anything(),
        totalWeight:       16,
        balance:           1,
        bothRepresented:   true,
        sides: [
          { signIndex: 0, weight: 8, bodies: ['Sun', 'Mercury'] },
          { signIndex: 6, weight: 8, bodies: ['Moon', 'Venus'] },
        ],
      },
    })
    expect(axisThemes(document)[0].token.params).toEqual({
      primarySignIndex:  0,
      oppositeSignIndex: 6,
      primaryBodies:     ['Sun', 'Mercury'],
      oppositeBodies:    ['Moon', 'Venus'],
    })
    expect(document.completeness.available.signAxes).toBe(1)
    expect(document.completeness.included.signAxes).toBe(1)
    expect(document.evidence.some(row => row.kind === 'aspect')).toBe(false)
    expect(JSON.stringify(document)).not.toContain('summary.aspect.opposition')
  })

  it('excludes unsupported chart bodies from sign-axis evidence, weights, and qualification', () => {
    const document = tropicalReadingDocument({
      zodiac: 'tropical',
      positions: [
        mk('Sun', 5),
        mk('Moon', 185),
        mk('Earth', 10),
        mk('Vertex', 35),
        mk('PartOfFortune', 215),
      ],
    }, [])

    expect(axisEvidence(document)).toEqual([expect.objectContaining({
      id: 'sign-axis:aries_libra',
      facts: expect.objectContaining({
        totalWeight: 10,
        balance:     1,
        sides: [
          { signIndex: 0, weight: 5, bodies: ['Sun'] },
          { signIndex: 6, weight: 5, bodies: ['Moon'] },
        ],
      }),
    })])
    expect(document.completeness).toMatchObject({
      available: { placements: 2, signAxes: 1 },
      included:  { placements: 2, signAxes: 1 },
    })
  })

  it('selects one strongest axis deterministically within the four-theme quota', () => {
    const higherWeightChart = {
      zodiac: 'tropical',
      positions: [
        mk('Sun', 5),
        mk('Uranus', 10),
        mk('Moon', 185),
        mk('Mercury', 35),
        mk('Jupiter', 40),
        mk('Venus', 215),
        mk('Saturn', 220),
      ],
    }
    const higherBalanceChart = {
      zodiac: 'tropical',
      positions: [
        mk('Sun', 5),
        mk('Uranus', 10),
        mk('Mercury', 185),
        mk('Neptune', 190),
        mk('Moon', 35),
        mk('Venus', 215),
        mk('Jupiter', 220),
      ],
    }
    const canonicalTieChart = {
      zodiac: 'tropical',
      positions: [
        mk('Sun', 5),
        mk('Moon', 185),
        mk('Mercury', 35),
        mk('Jupiter', 40),
        mk('Venus', 215),
        mk('Saturn', 220),
      ],
    }
    const weighted = tropicalReadingDocument(higherWeightChart, [])
    const balanced = tropicalReadingDocument(higherBalanceChart, [])
    const tied     = tropicalReadingDocument(canonicalTieChart, [])
    const theme    = axisThemes(balanced)[0]

    expect(axisThemes(weighted)[0].token.params.primarySignIndex).toBe(0)
    expect(axisThemes(balanced)).toHaveLength(1)
    expect(theme.token).toEqual({
      key:    'readings.tropical.summary.sign_axis.taurus_scorpio',
      params: {
        primarySignIndex:  1,
        oppositeSignIndex: 7,
        primaryBodies:     ['Moon'],
        oppositeBodies:    ['Venus', 'Jupiter'],
      },
    })
    expect(theme.evidenceIds).toEqual([theme.id.replace('theme:', '')])
    expect(balanced.evidence.some(row => row.id === theme.evidenceIds[0])).toBe(true)
    expect(balanced.summary.themes).toHaveLength(4)
    expect(axisThemes(tied)).toHaveLength(1)
    expect(axisThemes(tied)[0].token.params.primarySignIndex).toBe(0)
  })

  it('excludes one-sided axes and node-only axes from summary themes', () => {
    const oneSided = tropicalReadingDocument({
      zodiac:    'tropical',
      positions: [mk('Sun', 5), mk('Moon', 35)],
    }, [])
    const nodeOnly = tropicalReadingDocument({
      zodiac:    'tropical',
      positions: [mk('NorthNode', 5), mk('SouthNode', 185)],
    }, [])

    expect(axisEvidence(oneSided)).toHaveLength(0)
    expect(axisThemes(oneSided)).toHaveLength(0)
    expect(axisEvidence(nodeOnly)).toHaveLength(1)
    expect(axisThemes(nodeOnly)).toHaveLength(0)
  })

  it('emits concrete placement facts and ignores unsupported aspects', () => {
    const document = tropicalReadingDocument(chart, [
      ...aspects,
      { a: 'Sun', b: 'Mercury', type: 'semisquare', delta: 0.1, strength: 1 },
    ])
    const sun    = document.evidence.find(row => row.id === 'placement:sun')
    const saturn = document.evidence.find(row => row.id === 'placement:saturn')

    expect(sun.facts).toMatchObject({
      bodyRole:  'Sun',
      element:   'fire',
      signStyle: 0,
      houseArea: 1,
      motionNote: 'direct',
    })
    expect(saturn.facts.motionNote).toBe('retrograde')
    expect(document.completeness.available.aspects).toBe(aspects.length)
    expect(document.evidence.some(row => row.facts?.type === 'semisquare')).toBe(false)
    expect(document.summary.themes.length).toBeLessThanOrEqual(4)
    expect(document.prominence).toHaveLength(3)
    expect(document.strengths.length).toBeLessThanOrEqual(3)
    expect(document.challenges.length).toBeLessThanOrEqual(3)
  })

  it('uses canonical elements for placement and distribution facts', () => {
    const document       = tropicalReadingDocument(chart, [])
    const placementRows  = document.evidence.filter(row => row.kind === 'placement')
    const elementRow     = document.evidence.find(row => row.id === 'distribution:element')

    expect(placementRows.every(row => row.facts.element === elementForSign(row.facts.signIndex))).toBe(true)
    expect(elementRow.facts).toMatchObject({
      category:  'element',
      dominant:  'fire',
      values:    { fire: 13, air: 8, water: 6, earth: 3 },
    })
  })

  it('merges matching sign and house stelliums into one configuration', () => {
    const stelliumChart = {
      ...chart,
      positions: chart.positions.map(position =>
        position.name === 'Venus' ? { ...position, longitude: 25 } : position
      ),
    }
    const document = tropicalReadingDocument(stelliumChart, [])
    const stelliums = document.evidence.filter(row =>
      row.kind === 'configuration' && row.facts.bodies.join('|') === 'Mercury|Sun|Venus'
    )

    expect(stelliums).toHaveLength(1)
    expect(stelliums[0].facts).toMatchObject({ type: 'stellium', signIndex: 0, house: 1 })
  })

  it('contains translation tokens instead of embedded user-facing prose', () => {
    const document = tropicalReadingDocument(chart, aspects)
    const tokens   = [
      document.title,
      ...document.summary.themes.map(row => row.token),
      ...document.chapters.flatMap(chapter => [chapter.title, ...chapter.items.map(row => row.token)]),
      ...document.prominence.map(row => row.token),
      ...document.prominence.flatMap(row => row.reasons),
      ...document.strengths.map(row => row.token),
      ...document.challenges.map(row => row.token),
      ...document.practices.map(row => row.token),
    ]

    expect(tokens.length).toBeGreaterThan(20)
    for (const value of tokens) {
      expect(value).toEqual({
        key:    expect.stringMatching(/^readings\.tropical\.[a-z0-9_.]+$/),
        params: expect.any(Object),
      })
    }
    expect(JSON.stringify(document)).not.toMatch(/\b(?:you|your|should|feel|personality)\b/i)
  })

  it('omits unavailable calculations and rejects non-Tropical charts', () => {
    const partial = tropicalReadingDocument({ positions: [mk('Sun', 5)] })

    expect(partial.completeness.unavailable).toEqual([
      'houses',
      'ascendant',
      'chart_ruler',
      'midheaven',
      'lunar_phase',
    ])
    expect(partial.evidence.some(row => row.kind === 'lunar_phase')).toBe(false)
    expect(tropicalReadingDocument({ ...chart, zodiac: 'sidereal' }, aspects)).toBeNull()
  })
})
