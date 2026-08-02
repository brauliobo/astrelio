import { describe, expect, it } from 'vitest'
import { deriveHumanDesignGraph } from '../../../src/lib/human-design/bodygraph.js'
import {
  buildHumanDesignReadingDocument,
  HUMAN_DESIGN_READING_SCHEMA,
  HUMAN_DESIGN_READING_VERSION,
  humanDesignReadingDocument,
} from '../../../src/lib/human-design/interpretations.js'

const activation = (planet, gate, line, color = 1, tone = 1, base = 1) => ({
  planet,
  gate,
  line,
  color,
  tone,
  base,
  longitude: 0,
  progress:  0,
})

const readingChart = () => deriveHumanDesignGraph({
  personId:   'reading-fixture',
  personName: 'Reading Fixture',
  birthJd:    2460677,
  designJd:   2460589,
  lat:        0,
  lon:        0,
  personality: {
    Sun:       activation('Sun', 49, 6, 2, 5, 1),
    Earth:     activation('Earth', 4, 6, 2, 5, 1),
    NorthNode: activation('NorthNode', 27, 1, 2, 4, 3),
    SouthNode: activation('SouthNode', 28, 1, 2, 4, 3),
    Moon:      activation('Moon', 34, 3, 3, 3, 3),
    Mercury:   activation('Mercury', 20, 5, 4, 2, 4),
    Venus:     activation('Venus', 5, 2, 5, 1, 2),
    Mars:      activation('Mars', 15, 4, 1, 3, 2),
    Jupiter:   activation('Jupiter', 10, 4, 4, 4, 4),
  },
  design: {
    Sun:       activation('Sun', 14, 2, 3, 3, 5),
    Earth:     activation('Earth', 8, 2, 3, 3, 5),
    NorthNode: activation('NorthNode', 24, 2, 4, 5, 1),
    SouthNode: activation('SouthNode', 44, 2, 4, 5, 1),
    Moon:      activation('Moon', 10, 4, 6, 6, 4),
    Mercury:   activation('Mercury', 57, 1, 1, 4, 1),
    Venus:     activation('Venus', 34, 3, 2, 2, 2),
    Mars:      activation('Mars', 2, 5, 3, 4, 1),
  },
})

const expectToken = value => expect(value).toEqual({
  key:    expect.stringMatching(/^human_design\./),
  params: expect.any(Object),
})

describe('Human Design ReadingDocument', () => {
  it('represents every active gate and every personality/design activation without a display cap', () => {
    const chart    = readingChart()
    const document = buildHumanDesignReadingDocument(chart)
    const expectedActivations = Object.keys(chart.personality).length + Object.keys(chart.design).length

    expect(chart.gates.length).toBeGreaterThan(8)
    expect(document.facts.gates.map(item => item.gate)).toEqual([...chart.gates].sort((a, b) => a - b))
    expect(document.facts.activations).toHaveLength(expectedActivations)
    expect(document.facts.activations.map(item => [item.layer, item.planet, item.gate, item.line])).toEqual([
      ...Object.entries(chart.personality).map(([planet, item]) => ['personality', planet.toLowerCase(), item.gate, item.line]),
      ...Object.entries(chart.design).map(([planet, item]) => ['design', planet.toLowerCase(), item.gate, item.line]),
    ])
    expect(document.coverage.complete).toEqual({
      activeGates: true,
      activations: true,
      activeLines: true,
    })
  })

  it('declares its schema and coverage and resolves every evidence reference', () => {
    const chart    = readingChart()
    const document = humanDesignReadingDocument(chart)
    const evidenceIds = new Set(document.evidence.map(item => item.id))
    const referencedIds = [
      ...document.summary.themes.flatMap(item => item.evidenceIds),
      ...document.summary.prominence.flatMap(item => item.evidenceIds),
      ...document.chapters.flatMap(item => item.evidenceIds),
      ...document.facts.gates.flatMap(item => item.evidenceIds),
      ...document.facts.activations.flatMap(item => item.evidenceIds),
    ]

    expect(document).toMatchObject({
      schema:          HUMAN_DESIGN_READING_SCHEMA,
      schemaVersion:   HUMAN_DESIGN_READING_VERSION,
      languageNeutral: true,
      coverage: {
        declared: expect.arrayContaining([
          'mechanics',
          'profile',
          'centers',
          'channels',
          'circuitry',
          'streams',
          'gates',
          'lines',
          'incarnationCross',
          'variables',
          'psychologicalThemes',
          'guidance',
        ]),
        counts: {
          gates:       chart.gates.length,
          activations: Object.keys(chart.personality).length + Object.keys(chart.design).length,
        },
      },
    })
    expect(document.evidence.length).toBeGreaterThan(document.facts.activations.length)
    expect(new Set(document.evidence.map(item => item.id)).size).toBe(document.evidence.length)
    expect(referencedIds.every(id => evidenceIds.has(id))).toBe(true)
    expect(document.chapters.map(item => item.id)).toEqual(expect.arrayContaining([
      'decision_making',
      'energy_and_expression',
      'identity_and_role',
      'conditioning_and_openness',
      'relationships_and_circuitry',
      'life_theme',
      'variables_and_transference',
      'gates_and_lines',
      'integration',
    ]))
    expect(document.guidance.strengths).toHaveLength(document.chapters.length)
    expect(document.guidance.challenges).toHaveLength(document.chapters.length)
    expect(document.guidance.practices).toHaveLength(document.chapters.length)
  })

  it('uses translation tokens for all user-facing reading output and caveats exact-time layers', () => {
    const document = buildHumanDesignReadingDocument(readingChart())
    const userFacingTokens = [
      document.title,
      ...document.summary.themes.map(item => item.content),
      ...document.summary.prominence.map(item => item.content),
      ...document.chapters.flatMap(item => [
        item.title,
        item.overview,
        ...item.strengths,
        ...item.challenges,
        ...item.practices,
      ]),
      ...document.guidance.strengths,
      ...document.guidance.challenges,
      ...document.guidance.practices,
      ...document.facts.centers.defined.flatMap(item => [item.label, item.theme]),
      ...document.facts.centers.open.flatMap(item => [item.label, item.theme]),
      ...document.facts.channels.map(item => item.label),
      ...document.facts.circuitry.map(item => item.label),
      ...document.facts.streams.map(item => item.label),
      ...document.facts.gates.map(item => item.label),
      ...document.facts.activations.map(item => item.label),
      ...document.facts.variables.flatMap(item => [item.label, item.transference].filter(Boolean)),
      document.facts.incarnationCross.label,
      document.facts.mechanics.type.label,
      document.facts.mechanics.strategy.label,
      document.facts.mechanics.authority.label,
      document.facts.mechanics.signature.label,
      document.facts.mechanics.notSelf.label,
      document.facts.profile.label,
      document.facts.definition.label,
      ...document.caveats,
    ]

    for (const output of userFacingTokens) expectToken(output)
    expect(document.facts.activations.every(item => item.caveats.includes(document.caveats[0]))).toBe(true)
    expect(document.facts.variables.every(item => item.caveats.includes(document.caveats[0]))).toBe(true)
    expect(document.facts.profile.caveats).toContain(document.caveats[0])
    expect(document.facts.incarnationCross.caveats).toContain(document.caveats[0])
    expect(document.caveats[0].key).toBe('human_design.reading.caveats.exact_time')
  })

  it('is deterministic and returns null when no chart is supplied', () => {
    const chart = readingChart()

    expect(buildHumanDesignReadingDocument(chart)).toEqual(buildHumanDesignReadingDocument(chart))
    expect(buildHumanDesignReadingDocument(null)).toBeNull()
  })

  it('limits prominence and omits chapters whose facts are unavailable', () => {
    const chart = readingChart()
    const document = buildHumanDesignReadingDocument({
      ...chart,
      channels:         [],
      incarnationCross: null,
      variables:        [],
      details: {
        ...chart.details,
        channels:      [],
        circuits:      [],
        streamSummary: [],
      },
    })
    const chapterIds = document.chapters.map(item => item.id)

    expect(document.summary.prominence.length).toBeLessThanOrEqual(4)
    expect(chapterIds).not.toContain('relationships_and_circuitry')
    expect(chapterIds).not.toContain('life_theme')
    expect(chapterIds).not.toContain('variables_and_transference')
    expect(document.coverage.represented.incarnationCross).toBe(false)
    expect(document.coverage.represented.variables).toBe(false)
  })
})
