import { describe, expect, it } from 'vitest'
import { activationFromLongitude } from '../../../src/lib/human-design/activations.js'
import {
  buildHumanDesignTransitChart,
  deriveHumanDesignGraph,
  humanDesignTransitConnection,
} from '../../../src/lib/human-design/bodygraph.js'
import { humanDesignInterpretationSections } from '../../../src/lib/human-design/interpretations.js'
import { mandalaAngleForActivation, mandalaAngleForLongitude } from '../../../src/components/human-design/wheelCore.js'

const activation = (planet, gate, line = 1, extras = {}) => ({
  planet,
  gate,
  line,
  color:     1,
  tone:      1,
  base:      1,
  longitude: 0,
  progress:  0,
  ...extras,
})

const textValue = (object, keys) => keys.map(key => object?.[key]).find(value => typeof value === 'string' && value.trim())

const arrayValue = (object, keys) => keys.map(key => object?.[key]).find(Array.isArray) || []

const objectValue = (object, keys) =>
  keys.map(key => object?.[key]).find(value => value && typeof value === 'object' && !Array.isArray(value)) || null

const comprehensiveChart = () => deriveHumanDesignGraph({
  personId:    'reference-fixture',
  personName:  'Reference Fixture',
  birthJd:     2460677,
  designJd:    2460589,
  lat:         0,
  lon:         0,
  personality: {
    Sun:       activation('Sun', 49, 6, { color: 2, tone: 5, base: 1, longitude: 323.36, progress: 0.7821 }),
    Earth:     activation('Earth', 4, 6, { color: 2, tone: 5, base: 1 }),
    NorthNode: activation('NorthNode', 27, 1, { color: 2, tone: 4, base: 3 }),
    SouthNode: activation('SouthNode', 28, 1, { color: 2, tone: 4, base: 3 }),
    Moon:      activation('Moon', 34, 3, { color: 3, tone: 3, base: 3 }),
    Mercury:   activation('Mercury', 20, 5, { color: 4, tone: 2, base: 4 }),
    Venus:     activation('Venus', 5, 2, { color: 5, tone: 1, base: 2 }),
  },
  design: {
    Sun:       activation('Sun', 14, 2, { color: 3, tone: 3, base: 5 }),
    Earth:     activation('Earth', 8, 2, { color: 3, tone: 3, base: 5 }),
    NorthNode: activation('NorthNode', 24, 2, { color: 4, tone: 5, base: 1 }),
    SouthNode: activation('SouthNode', 44, 2, { color: 4, tone: 5, base: 1 }),
    Moon:      activation('Moon', 10, 4, { color: 6, tone: 6, base: 4 }),
    Mercury:   activation('Mercury', 57, 1, { color: 1, tone: 4, base: 1 }),
  },
})

const gateDetail = (chart, gate) => chart.details?.gates?.find(item => item.gate === gate)

const activationDetail = (chart, layer, planet) =>
  chart.details?.activations?.find(item => item.layer === layer && item.planet === planet)

const interpret = (key, params = {}) => {
  const messages = {
    'human_design.insight_sections.essentials':              'Essentials',
    'human_design.insight_sections.gates':                   'Gates',
    'human_design.definition':                               'Definition',
    'human_design.incarnation_cross':                        'Incarnation Cross',
    'human_design.variables':                                'Variables',
    'human_design.strategy':                                 'Strategy',
    'human_design.centers_title':                            'Centers',
    'human_design.open_circuitry':                           'Open circuitry',
    'human_design.profile_title':                            `Profile ${params.profile}`,
    'human_design.authority_title':                          `${params.authority} authority`,
    'human_design.gate_title':                               `Gate ${params.gate}`,
    'human_design.insight_text.types.generator':             'Use sustainable response as the baseline for decisions.',
    'human_design.insight_text.types.manifesting_generator': 'Use response and then inform where movement affects others.',
    'human_design.insight_text.types.projector':             'Use recognition and invitation for major commitments.',
    'human_design.insight_text.types.reflector':             'Use time and environmental sampling for clarity.',
    'human_design.insight_text.types.fallback':              'Use the mechanics of the chart as a reflection tool.',
    'human_design.insight_text.authorities.emotional':       'Let the emotional wave settle before deciding.',
    'human_design.insight_text.authorities.sacral':          'Track simple body response before committing energy.',
    'human_design.insight_text.authorities.lunar':           'Let time and lunar sampling clarify the pattern.',
    'human_design.insight_text.authorities.fallback':        'Use the listed authority as a decision filter.',
    'human_design.insight_text.profile':                     'The profile describes a role pattern, not a fixed identity.',
    'human_design.insight_text.strategy':                    'Treat strategy as an experiment, not a rule of worth.',
    'human_design.insight_text.definition_count':            `${params.centers} centers and ${params.channels} channels are defined.`,
    'human_design.insight_text.circuits':                    'Circuitry shows the chart emphasis across individual, collective, and tribal themes.',
    'human_design.insight_text.centers':                     `${params.defined} defined centers and ${params.open} open centers are present.`,
    'human_design.insight_text.incarnation_cross':           `Quarter ${params.quarter} with gates ${params.gates}.`,
    'human_design.insight_text.variable':                    `${params.orientation} orientation, color ${params.color}, tone ${params.tone}, base ${params.base}.`,
    'human_design.insight_text.gate_multiple':               `${params.count} activations in ${params.center}.`,
    'human_design.insight_text.gate_personality':            'Conscious activation visible in behavior and language.',
    'human_design.insight_text.gate_design':                 'Unconscious activation often noticed through pattern and body.',
    'human_design.insight_text.gate_both':                   'Conscious and design layers repeat the same gate.',
  }
  return messages[key] || key
}

describe('Human Design comprehensive reference expectations', () => {
  it('exposes gate explorer metadata with centers, harmonics, sources, and original detail text', () => {
    const chart  = comprehensiveChart()
    const gate49 = gateDetail(chart, 49)

    expect(gate49).toMatchObject({
      gate:          49,
      name:          expect.any(String),
      center:        'Solar Plexus',
      harmonicGates: expect.arrayContaining([19]),
      activations:   expect.arrayContaining([
        expect.objectContaining({
          layer:  'personality',
          planet: 'Sun',
          line:   6,
          code:   '49.6.2.5.1',
        }),
      ]),
    })
    expect(textValue(gate49, ['summary', 'description', 'interpretation', 'theme']))
      .toEqual(expect.any(String))
  })

  it('adds line-level interpretation metadata to every activation row', () => {
    const chart          = comprehensiveChart()
    const personalitySun = activationDetail(chart, 'personality', 'Sun')
    const lineDetail     = objectValue(personalitySun, ['lineDetail', 'lineMetadata', 'lineInterpretation'])

    expect(personalitySun).toMatchObject({ gate: 49, line: 6, color: 2, tone: 5, base: 1 })
    expect(lineDetail).toMatchObject({ line: 6, summary: expect.any(String) })
    expect(textValue(lineDetail, ['title', 'role', 'keynote'])).toEqual(expect.any(String))
  })

  it('adds planet-specific meaning to activation rows without relying on report prose', () => {
    const chart          = comprehensiveChart()
    const personalitySun = activationDetail(chart, 'personality', 'Sun')
    const designMoon     = activationDetail(chart, 'design', 'Moon')

    expect(textValue(personalitySun, ['planetMeaning', 'planetTheme', 'planetInterpretation']))
      .toEqual(expect.any(String))
    expect(textValue(designMoon, ['planetMeaning', 'planetTheme', 'planetInterpretation']))
      .toEqual(expect.any(String))
    expect(textValue(personalitySun, ['planetMeaning', 'planetTheme', 'planetInterpretation']))
      .not.toBe(textValue(designMoon, ['planetMeaning', 'planetTheme', 'planetInterpretation']))
  })

  it('enriches incarnation cross detail with geometry, quarter, four gates, and role metadata', () => {
    const chart = comprehensiveChart()
    const cross = chart.incarnationCross
    const roles = arrayValue(cross, ['roles', 'gateRoles', 'activationRoles', 'gateDetails'])

    expect(cross).toMatchObject({
      name:     'Left Angle Cross of Revolution',
      geometry: 'Left Angle',
      gates:    [49, 4, 14, 8],
      quarter:  expect.objectContaining({
        name:  expect.any(String),
        gates: expect.arrayContaining([49]),
      }),
    })
    expect(roles).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: 'personalitySun', gate: 49, line: 6 }),
      expect.objectContaining({ role: 'personalityEarth', gate: 4, line: 6 }),
      expect.objectContaining({ role: 'designSun', gate: 14, line: 2 }),
      expect.objectContaining({ role: 'designEarth', gate: 8, line: 2 }),
    ]))
    expect(textValue(cross, ['summary', 'description', 'interpretation']))
      .toEqual(expect.any(String))
  })

  it('marks hanging gates and complete harmonic channels for gate explorer use', () => {
    const chart       = comprehensiveChart()
    const hangingGate = gateDetail(chart, 5)
    const definedGate = gateDetail(chart, 34)

    expect(hangingGate).toMatchObject({
      gate:             5,
      isHanging:        true,
      hangingHarmonics: [15],
      definedChannels:  [],
    })
    expect(definedGate.definedChannels).toEqual(expect.arrayContaining(['10-34', '20-34', '34-57']))
    expect(definedGate.isHanging).toBe(false)
  })

  it('aggregates channels by circuit group and stream for summary panels', () => {
    const chart             = comprehensiveChart()
    const circuitSummary    = arrayValue(chart.details, ['circuitSummary', 'circuits', 'circuitGroups'])
    const streamSummary     = arrayValue(chart.details, ['streamSummary', 'streams', 'awarenessStreams'])
    const individualCircuit = circuitSummary.find(item => [item.key, item.circuit, item.group].includes('Individual'))

    expect(individualCircuit).toBeTruthy()
    expect(individualCircuit.channels).toEqual(expect.arrayContaining(['10-34', '20-34', '34-57']))
    expect(streamSummary.length || circuitSummary.some(item => item.streams?.length)).toBeTruthy()
    for (const stream of streamSummary) {
      expect(stream).toEqual(expect.objectContaining({
        key:      expect.any(String),
        gates:    expect.any(Array),
        channels: expect.any(Array),
      }))
    }
  })

  it('carries exaltation and detriment metadata as structured facts, not copied prose', () => {
    const chart          = comprehensiveChart()
    const personalitySun = activationDetail(chart, 'personality', 'Sun')
    const lineDetail     = objectValue(personalitySun, ['lineDetail', 'lineMetadata', 'lineInterpretation'])
    const exaltation     = objectValue(lineDetail, ['exaltation', 'exalted'])
    const detriment      = objectValue(lineDetail, ['detriment', 'detrimental'])
    const polarityThemes = [lineDetail?.exaltationTheme, lineDetail?.detrimentTheme].filter(Boolean)

    expect(lineDetail).toBeTruthy()
    expect([exaltation, detriment, ...polarityThemes].filter(Boolean).length).toBeGreaterThan(0)
    for (const polarity of [exaltation, detriment].filter(Boolean)) {
      expect(polarity).toEqual(expect.objectContaining({
        planet:  expect.any(String),
        summary: expect.any(String),
      }))
    }
    expect(polarityThemes.every(theme => theme.length > 20)).toBe(true)
  })

  it('preserves mandala degree precision down to color, tone, and base spans', () => {
    const gateStep  = 360 / 64
    const lineStep  = 360 / 384
    const colorStep = 360 / 2304
    const toneStep  = 360 / 13824
    const baseStep  = 360 / 69120

    expect(gateStep).toBeCloseTo(5.625, 12)
    expect(lineStep).toBeCloseTo(0.9375, 12)
    expect(colorStep).toBeCloseTo(0.15625, 12)
    expect(toneStep).toBeCloseTo(0.026041666667, 12)
    expect(baseStep).toBeCloseTo(0.005208333333, 12)

    expect(activationFromLongitude(302)).toMatchObject({ gate: 41, line: 1, color: 1, tone: 1, base: 1 })
    expect(activationFromLongitude(302 + baseStep * 1.1)).toMatchObject({ gate: 41, line: 1, color: 1, tone: 1, base: 2 })
    expect(activationFromLongitude(302 + toneStep * 1.1)).toMatchObject({ gate: 41, line: 1, color: 1, tone: 2 })
    expect(activationFromLongitude(302 + colorStep * 1.1)).toMatchObject({ gate: 41, line: 1, color: 2 })
    expect(activationFromLongitude(302 + lineStep * 1.1)).toMatchObject({ gate: 41, line: 2 })
    expect(activationFromLongitude(302 + gateStep * 1.1)).toMatchObject({ gate: 19 })

    const transit           = buildHumanDesignTransitChart(Date.UTC(2026, 0, 1, 12), 0, 0)
    const preciseActivation = transit.details.activations.find(item => item.mandala)

    expect(mandalaAngleForActivation(activationFromLongitude(323.36))).toEqual(expect.any(Number))
    expect(mandalaAngleForLongitude(323.36)).toEqual(expect.any(Number))
    expect(preciseActivation.mandala).toEqual(expect.objectContaining({
      gateDegrees:  expect.any(Number),
      lineDegrees:  expect.any(Number),
      colorDegrees: expect.any(Number),
      toneDegrees:  expect.any(Number),
      baseDegrees:  expect.any(Number),
    }))
    expect(preciseActivation.mandala.gateArcDegrees).toBeCloseTo(gateStep, 12)
    expect(preciseActivation.mandala.lineArcDegrees).toBeCloseTo(lineStep, 12)
    expect(preciseActivation.mandala.colorArcDegrees).toBeCloseTo(colorStep, 12)
    expect(preciseActivation.mandala.toneArcDegrees).toBeCloseTo(toneStep, 12)
    expect(preciseActivation.mandala.baseArcDegrees).toBeCloseTo(baseStep, 12)
  })

  it('enhances transit watch entries with gate metadata and both line and gate change searches', () => {
    const natal       = comprehensiveChart()
    const transit     = buildHumanDesignTransitChart(Date.UTC(2026, 0, 1, 12), 0, 0)
    const connection  = humanDesignTransitConnection(natal, transit, { lat: 0, lon: 0 })
    const sunWatch    = connection.activationWatch.find(item => item.planet === 'Sun')
    const sunLibrary  = sunWatch.library || sunWatch
    const lineChanges = connection.nextChanges.filter(change => change.level === 'line')
    const gateChanges = [
      ...connection.nextChanges.filter(change => change.level === 'gate'),
      ...arrayValue(connection, ['nextGateChanges']),
    ]

    expect(sunWatch).toEqual(expect.objectContaining({
      planet: 'Sun',
      code:   expect.stringMatching(/^\d+\.\d+\.\d+\.\d+\.\d+$/),
      name:   expect.any(String),
      center: expect.any(String),
    }))
    expect(sunLibrary.harmonicGates).toEqual(expect.any(Array))
    expect(lineChanges.length).toBeGreaterThan(0)
    expect(gateChanges.length).toBeGreaterThan(0)
    expect([...lineChanges, ...gateChanges].every(change => change.dateMs > transit.dateMs)).toBe(true)
  })

  it('returns original interpretation sections for gates, lines, variables, and cross detail', () => {
    const chart         = comprehensiveChart()
    const sections      = humanDesignInterpretationSections(chart, interpret)
    const allItems      = sections.flatMap(section => section.items || [])
    const gateItems     = allItems.filter(item => item.key?.startsWith('gate-'))
    const variableItems = allItems.filter(item => item.key?.startsWith('variable-'))
    const lineDetails   = chart.details.gates.flatMap(gate => gate.lines || [])

    expect(sections.map(section => section.key)).toEqual(expect.arrayContaining([
      'essentials',
      'definition',
      'incarnation-cross',
      'variables',
      'gates',
    ]))
    expect(gateItems.length).toBeGreaterThan(0)
    expect(variableItems).toHaveLength(4)
    expect(allItems.every(item => !String(item.text).startsWith('human_design.'))).toBe(true)
    expect(lineDetails.length).toBeGreaterThan(0)
    expect(lineDetails.every(line => textValue(line, ['summary', 'interpretation']))).toBe(true)
  })
})
