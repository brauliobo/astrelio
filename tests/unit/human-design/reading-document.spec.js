import { describe, expect, it } from 'vitest'
import { deriveHumanDesignGraph } from '../../../src/lib/human-design/bodygraph.js'
import {
  buildHumanDesignReadingDocument,
  HUMAN_DESIGN_READING_SCHEMA,
  HUMAN_DESIGN_READING_VERSION,
  humanDesignReadingDocument,
} from '../../../src/lib/human-design/interpretations.js'
import { lineContent } from '../../../src/lib/human-design/content/index.js'
import { referenceChart } from './reference-chart.js'

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

describe('Human Design ReadingDocument canon content', () => {
  const chart    = referenceChart()
  const document = buildHumanDesignReadingDocument(chart)
  const chapter  = id => document.chapters.find(item => item.id === id)
  const keysOf   = id => chapter(id).items.map(item => item.content.key)
  const content  = (...path) => ['human_design', 'content', ...path].join('.')

  it('keeps every chapter id and an overview row before the canon rows', () => {
    expect(document.chapters.map(item => item.id)).toEqual([
      'decision_making',
      'energy_and_expression',
      'identity_and_role',
      'conditioning_and_openness',
      'relationships_and_circuitry',
      'life_theme',
      'variables_and_transference',
      'gates_and_lines',
      'integration',
    ])
    for (const item of document.chapters) expect(item.items[0].content).toEqual(item.overview)
    expect(document.schemaVersion).toBe(HUMAN_DESIGN_READING_VERSION)
  })

  it('reads type, aura, strategy, signature, not-self and authority from the content scheme', () => {
    expect(keysOf('decision_making')).toEqual(expect.arrayContaining([
      ...['summary', 'aura', 'strategy', 'signature', 'not_self', 'guidance'].map(field => content('types', 'generator', field)),
      content('authorities', 'emotional', 'how'),
      content('authorities', 'emotional', 'practice'),
    ]))
  })

  it('reads profile, line archetypes and the line 6 stages', () => {
    expect(keysOf('identity_and_role')).toEqual(expect.arrayContaining([
      content('profiles', '6_2', 'name'),
      content('profiles', '6_2', 'summary'),
      content('line_archetypes', 6, 'summary'),
      content('line_archetypes', 2, 'summary'),
      content('line6_stages', 'trial', 'summary'),
      content('line6_stages', 'role_model', 'summary'),
    ]))
  })

  it('reads definition, split size and bridges from the integration chapter', () => {
    expect(keysOf('integration')).toEqual(expect.arrayContaining([
      content('definitions', 'triple_split', 'summary'),
      content('split_size', 'small'),
      content('bridge', 'summary'),
    ]))
  })

  it('reads defined centers and the conditioning carriers of white centers', () => {
    const defined = keysOf('energy_and_expression')
    const white   = keysOf('conditioning_and_openness')

    expect(defined).toEqual(expect.arrayContaining([content('centers', 'g', 'defined'), content('centers', 'sacral', 'role')]))
    expect(defined).not.toContain(content('centers', 'head', 'defined'))
    expect(white).toEqual(expect.arrayContaining([
      content('center_states', 'open', 'summary'),
      content('center_states', 'undefined', 'summary'),
      content('centers', 'head', 'not_self_question'),
      content('centers', 'ajna', 'healthy'),
    ]))
    expect(chapter('conditioning_and_openness').items.find(item => item.id === 'center:ajna:state').content.params)
      .toEqual({ center: 'ajna', gates: '4/24' })
  })

  it('reads circuits, cross angle and quarter', () => {
    expect(keysOf('relationships_and_circuitry')).toEqual(expect.arrayContaining([
      content('circuits_info', 'tribal', 'summary'),
      content('circuits_info', 'ego', 'summary'),
    ]))
    expect(keysOf('life_theme')).toEqual(expect.arrayContaining([content('crosses', 'left_angle', 'summary')]))
    expect(document.facts.incarnationCross.quarterKey).toBe(chart.incarnationCross.quarter.name.toLowerCase())
    expect(keysOf('life_theme')).toContain(content('quarters', document.facts.incarnationCross.quarterKey, 'summary'))
  })

  it('reads each of the four variables with color, arrow and cognition', () => {
    const keys = keysOf('variables_and_transference')

    for (const area of ['digestion', 'environment', 'motivation', 'perspective']) {
      expect(keys).toContain(content('variables', 'areas', area, 'summary'))
      expect(keys).toContain(content('variables', 'colors', area, chart.variableDetails.arrows[area].color, 'summary'))
      expect(keys).toContain(content('variables', 'arrows', chart.variableDetails.arrows[area].orientation, area, 'summary'))
    }
    expect(keys).toContain(content('variables', 'cognition', 'outer_vision', 'summary'))
    expect(chapter('variables_and_transference').items.find(item => item.id === 'variable:shorthand').content.params)
      .toEqual({ shorthand: 'PRR DLL' })
    expect(document.facts.variables.map(item => Boolean(item.transference))).toEqual([false, false, true, false])
  })

  it('references line texts by gate and line for the Sun/Earth cross and the top gates', () => {
    const cross = document.facts.lineTexts.filter(item => item.role === 'cross')

    expect(cross.map(item => [item.layer, item.planet])).toEqual([
      ['personality', 'sun'], ['personality', 'earth'], ['design', 'sun'], ['design', 'earth'],
    ])
    expect(chapter('life_theme').lineTextIds).toEqual(cross.map(item => item.id))
    expect(chapter('gates_and_lines').lineTextIds.length).toBeGreaterThan(0)
    for (const item of document.facts.lineTexts) {
      expect(item.lineText).toEqual({ gate: item.gate, line: item.line })
      expect(lineContent('en', item.gate, item.line).text).toEqual(expect.any(String))
    }
  })

  it('adds a sensitivity caveat when an activation is within 10 minutes of a headline boundary', () => {
    const { sensitivity } = document.facts

    expect(sensitivity.minutes).toBe(10)
    expect(sensitivity.fields.map(item => item.id)).toEqual(expect.arrayContaining(['line']))
    expect(sensitivity.fields.every(item => item.label.key === content('sensitivity', 'fields', item.id))).toBe(true)
    expect(sensitivity.flagged).toBe(true)
    expect(document.caveats.map(item => item.key)).toEqual([
      'human_design.reading.caveats.exact_time',
      content('sensitivity', 'note'),
    ])
  })

  it('references only evidence that exists', () => {
    const evidenceIds = new Set(document.evidence.map(item => item.id))
    const referenced  = document.chapters.flatMap(item => item.items.flatMap(row => row.evidenceIds))

    expect(referenced.filter(id => !evidenceIds.has(id))).toEqual([])
    expect(document.facts.lineTexts.flatMap(item => item.evidenceIds).filter(id => !evidenceIds.has(id))).toEqual([])
  })
})
