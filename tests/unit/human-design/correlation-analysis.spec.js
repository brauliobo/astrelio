import { describe, expect, it } from 'vitest'
import * as humanDesign from '../../../src/lib/human-design/bodygraph.js'

const activation = (planet, gate, line = 1, extras = {}) => ({
  planet,
  gate,
  line,
  color: 1,
  tone: 1,
  base: 1,
  longitude: 0,
  progress: 0,
  ...extras,
})

const chartFixture = () => humanDesign.deriveHumanDesignGraph({
  personId: 'correlation-a',
  personName: 'Correlation A',
  birthJd: 2460677,
  designJd: 2460589,
  lat: 0,
  lon: 0,
  personality: {
    Sun: activation('Sun', 34, 3, { color: 2, tone: 2 }),
    Earth: activation('Earth', 20, 5),
    NorthNode: activation('NorthNode', 49, 6, { color: 2, tone: 5 }),
    SouthNode: activation('SouthNode', 4, 6),
    Moon: activation('Moon', 10, 4),
    Mercury: activation('Mercury', 57, 1),
    Venus: activation('Venus', 5, 2),
  },
  design: {
    Sun: activation('Sun', 14, 2, { color: 3, tone: 3 }),
    Earth: activation('Earth', 8, 2),
    NorthNode: activation('NorthNode', 24, 2, { color: 4, tone: 5 }),
    SouthNode: activation('SouthNode', 44, 2),
    Moon: activation('Moon', 1, 4),
    Mercury: activation('Mercury', 33, 1),
  },
})

const partnerFixture = () => humanDesign.deriveHumanDesignGraph({
  personId: 'correlation-b',
  personName: 'Correlation B',
  birthJd: 2460600,
  designJd: 2460512,
  lat: 0,
  lon: 0,
  personality: {
    Sun: activation('Sun', 8, 5),
    Earth: activation('Earth', 1, 5),
    NorthNode: activation('NorthNode', 15, 2),
    SouthNode: activation('SouthNode', 5, 2),
    Moon: activation('Moon', 57, 3),
  },
  design: {
    Sun: activation('Sun', 19, 4),
    Earth: activation('Earth', 49, 4),
    NorthNode: activation('NorthNode', 20, 1),
    SouthNode: activation('SouthNode', 34, 1),
  },
})

const requiredHelper = (name) => {
  expect(
    humanDesign[name],
    `${name} should be exported from src/lib/human-design/bodygraph.js`,
  ).toBeTypeOf('function')
  return humanDesign[name]
}

const expectOriginalText = value => {
  expect(value).toEqual(expect.any(String))
  expect(value.trim().length).toBeGreaterThan(20)
}

describe('Human Design correlation analysis contracts', () => {
  it('correlates user diary events with repeated gates, lines, circuits, and tags', () => {
    const analyze = requiredHelper('humanDesignEventDiaryCorrelations')
    const chart = chartFixture()
    const events = [
      { id: 'launch', dateMs: Date.UTC(2026, 0, 1), tags: ['work'], gates: [34, 20], note: 'large energy push' },
      { id: 'repair', dateMs: Date.UTC(2026, 0, 8), tags: ['work', 'body'], gates: [34, 57], note: 'response under pressure' },
      { id: 'family', dateMs: Date.UTC(2026, 0, 15), tags: ['relationship'], gates: [49, 19], note: 'boundaries and needs' },
    ]

    const analysis = analyze(chart, events)

    expect(analysis.events).toHaveLength(events.length)
    expect(analysis.gateCorrelations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        gate: 34,
        count: 2,
        eventIds: expect.arrayContaining(['launch', 'repair']),
        summary: expect.any(String),
      }),
    ]))
    expect(analysis.tagCorrelations).toEqual(expect.arrayContaining([
      expect.objectContaining({ tag: 'work', gates: expect.arrayContaining([34]) }),
    ]))
    expect(analysis.lineCorrelations.length).toBeGreaterThan(0)
    expect(analysis.circuitCorrelations.length).toBeGreaterThan(0)
  })

  it('summarizes line pattern dominance across personality and design activations', () => {
    const analyze = requiredHelper('humanDesignLinePatternAnalysis')
    const analysis = analyze(chartFixture())

    expect(analysis.activationCount).toBeGreaterThan(0)
    expect(analysis.lineCounts).toEqual(expect.objectContaining({
      1: expect.any(Number),
      2: expect.any(Number),
      3: expect.any(Number),
      4: expect.any(Number),
      5: expect.any(Number),
      6: expect.any(Number),
    }))
    expect(analysis.dominantLines[0]).toEqual(expect.objectContaining({
      line: expect.any(Number),
      count: expect.any(Number),
      role: expect.any(String),
      summary: expect.any(String),
    }))
    expect(analysis.profileResonance).toEqual(expect.objectContaining({
      profile: '3 / 2',
      profileLines: expect.arrayContaining([3, 2]),
    }))
  })

  it('weights gates by planet importance and separates conscious/design emphasis', () => {
    const analyze = requiredHelper('humanDesignPlanetGateWeighting')
    const analysis = analyze(chartFixture())

    expect(analysis.planetWeights.Sun).toBeGreaterThan(analysis.planetWeights.Mercury)
    expect(analysis.weightedGates[0]).toEqual(expect.objectContaining({
      gate: expect.any(Number),
      score: expect.any(Number),
      sources: expect.any(Array),
      summary: expect.any(String),
    }))
    expect(analysis.weightedGates[0].score).toBeGreaterThanOrEqual(analysis.weightedGates.at(-1).score)
    expect(analysis.layerTotals).toEqual(expect.objectContaining({
      personality: expect.any(Number),
      design: expect.any(Number),
    }))
  })

  it('finds future harmonic completion windows for hanging natal gates', () => {
    const analyze = requiredHelper('humanDesignHarmonicCompletionTiming')
    const chart = chartFixture()
    const dateMs = Date.UTC(2026, 0, 1, 12)

    const analysis = analyze(chart, { dateMs, lat: 0, lon: 0, days: 45 })

    expect(analysis.hangingGates.length).toBeGreaterThan(0)
    expect(analysis.completions.length).toBeGreaterThan(0)
    expect(analysis.completions[0]).toEqual(expect.objectContaining({
      natalGate: expect.any(Number),
      transitGate: expect.any(Number),
      channel: expect.stringMatching(/^\d+-\d+$/),
      dateMs: expect.any(Number),
      summary: expect.any(String),
    }))
    expect(analysis.completions.every(item => item.dateMs >= dateMs)).toBe(true)
  })

  it('balances channels by circuit group and awareness stream', () => {
    const analyze = requiredHelper('humanDesignCircuitStreamBalance')
    const analysis = analyze(chartFixture())

    expect(analysis.channelCount).toBeGreaterThan(0)
    expect(analysis.circuitGroups.length).toBeGreaterThan(0)
    expect(analysis.streams.length).toBeGreaterThan(0)
    expect(analysis.dominantCircuit).toEqual(expect.objectContaining({
      key: expect.any(String),
      count: expect.any(Number),
      percent: expect.any(Number),
      summary: expect.any(String),
    }))
    expect(analysis.streams.every(stream => Array.isArray(stream.channels))).toBe(true)
  })

  it('scores incarnation cross resonance against current transits and chart definition', () => {
    const analyze = requiredHelper('humanDesignIncarnationCrossResonance')
    const chart = chartFixture()
    const transit = humanDesign.buildHumanDesignTransitChart(Date.UTC(2026, 0, 1, 12), 0, 0)

    const analysis = analyze(chart, transit)

    expect(analysis.crossGates).toEqual(expect.arrayContaining(chart.incarnationCross.gates))
    expect(analysis.resonanceScore).toBeGreaterThanOrEqual(0)
    expect(analysis.resonanceScore).toBeLessThanOrEqual(1)
    expect(analysis.gateResonance).toHaveLength(4)
    expect(analysis.gateResonance[0]).toEqual(expect.objectContaining({
      gate: expect.any(Number),
      role: expect.any(String),
      natalDefined: expect.any(Boolean),
      transitActive: expect.any(Boolean),
      summary: expect.any(String),
    }))
  })

  it('checks variable consistency and warns when birth-time precision is weak', () => {
    const analyze = requiredHelper('humanDesignVariableConsistencyChecks')
    const analysis = analyze(chartFixture(), { birthTimePrecisionMinutes: 30 })

    expect(analysis.variables).toHaveLength(4)
    expect(analysis.orientationPattern).toMatch(/[LR?]{4}/)
    expect(analysis.reliable).toBe(false)
    expect(analysis.warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/birth|time|precision/i),
    ]))
    expect(analysis.variables[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      orientation: expect.stringMatching(/left|right|unknown/),
      fragile: expect.any(Boolean),
    }))
  })

  it('overlays relationship activations across hanging gates, open centers, and cross gates', () => {
    const analyze = requiredHelper('humanDesignRelationshipActivationOverlay')
    const chartA = chartFixture()
    const chartB = partnerFixture()

    const overlay = analyze(chartA, chartB)

    expect(overlay.connectionTheme).toMatch(/^\d+-\d+$/)
    expect(overlay.completedHangingGates.length).toBeGreaterThan(0)
    expect(overlay.completedHangingGates[0]).toEqual(expect.objectContaining({
      ownerId: expect.stringMatching(/correlation-/),
      activatorId: expect.stringMatching(/correlation-/),
      natalGate: expect.any(Number),
      activatorGate: expect.any(Number),
      channel: expect.stringMatching(/^\d+-\d+$/),
    }))
    expect(overlay.openCenterTouches).toEqual(expect.any(Array))
    expect(overlay.crossGateContacts).toEqual(expect.any(Array))
  })

  it('clusters transit themes by center, circuit, line, and natal completions', () => {
    const analyze = requiredHelper('humanDesignTransitThemeClusters')
    const natal = chartFixture()
    const transit = humanDesign.buildHumanDesignTransitChart(Date.UTC(2026, 0, 1, 12), 0, 0)
    const analysis = analyze(natal, transit)

    expect(analysis.todayThemes.length).toBeGreaterThan(0)
    expect(analysis.byCenter.length).toBeGreaterThan(0)
    expect(analysis.byLine.length).toBeGreaterThan(0)
    expect(analysis.completedChannels).toEqual(expect.any(Array))
    expect(analysis.clusters[0]).toEqual(expect.objectContaining({
      key: expect.any(String),
      gates: expect.any(Array),
      summary: expect.any(String),
    }))
  })

  it('bridges astrology transits to the matching Human Design gate and line context', () => {
    const analyze = requiredHelper('humanDesignAstrologyBridge')
    const chart = chartFixture()
    const astrologyTransits = [
      {
        planet: 'Sun',
        aspect: 'trine',
        natalPlanet: 'Moon',
        orb: 0.8,
        longitude: 323.36,
        dateMs: Date.UTC(2026, 0, 1, 12),
      },
      {
        planet: 'Mars',
        aspect: 'square',
        natalPlanet: 'Venus',
        orb: 1.2,
        longitude: 35.5,
        dateMs: Date.UTC(2026, 0, 2, 12),
      },
    ]

    const bridge = analyze(chart, astrologyTransits)

    expect(bridge.entries).toHaveLength(astrologyTransits.length)
    expect(bridge.entries[0]).toEqual(expect.objectContaining({
      planet: 'Sun',
      aspect: 'trine',
      gate: expect.any(Number),
      line: expect.any(Number),
      code: expect.stringMatching(/^\d+\.\d+\.\d+\.\d+\.\d+$/),
      gateSummary: expect.any(String),
      astrologySummary: expect.any(String),
    }))
    expectOriginalText(bridge.entries[0].combinedSummary)
  })
})
