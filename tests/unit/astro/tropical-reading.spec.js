import { describe, expect, it } from 'vitest'
import {
  TROPICAL_READING_CHAPTERS,
  TROPICAL_READING_SCHEMA_VERSION,
  tropicalReadingDocument,
} from '../../../src/lib/astro/interpretations.js'

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
      available: { placements: 14, aspects: 6 },
      included:  { placements: 14, aspects: 2, configurations: 0 },
      truncated: { aspects: true, prominence: true, configurations: true },
    })
    expect(first.prominence).toHaveLength(3)
    expect(first.summary.themes).toHaveLength(2)
    expect(first.evidence.filter(row => row.kind === 'placement')).toHaveLength(14)
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
