import { describe, expect, it } from 'vitest'
import {
  buildHumanDesignTransitChart,
  deriveHumanDesignGraph,
  gateLibraryEntry,
  humanDesignTeamAnalysis,
  humanDesignTransitConnection,
  lineLibraryEntry,
} from '../../../src/lib/human-design/bodygraph.js'
import { activationFromLongitude } from '../../../src/lib/human-design/activations.js'

const activation = (planet, gate, line = 1) => ({
  planet,
  gate,
  line,
  color: 1,
  tone: 1,
  base: 1,
  longitude: 0,
  progress: 0,
})

describe('Human Design bodygraph derivation', () => {
  it('detects channels, centers, type, authority, and definition from paired gates', () => {
    const chart = deriveHumanDesignGraph({
      personId: 'fixture',
      personName: 'Fixture',
      birthJd: 1,
      designJd: 0,
      personality: {
        Sun: activation('Sun', 34, 3),
        Earth: activation('Earth', 3, 4),
      },
      design: {
        Sun: activation('Sun', 20, 5),
        Earth: activation('Earth', 4, 6),
      },
    })

    expect(chart.channels).toEqual(['20-34'])
    expect(chart.centers).toEqual(['Sacral', 'Throat'])
    expect(chart.type).toBe('Manifesting Generator')
    expect(chart.authority).toBe('Sacral')
    expect(chart.profile).toBe('3 / 5')
    expect(chart.definition).toBe('Single Definition')
    expect(chart.strategy).toBe('Wait to respond, then inform')
    expect(chart.details.channels[0]).toMatchObject({
      channel: '20-34',
      name: 'Charisma',
      circuitGroup: 'Individual',
      stream: 'Sacral Manifestation',
    })
    expect(chart.details.gates.map(gate => gate.gate)).toEqual([3, 4, 20, 34])
    expect(chart.details.gates.find(gate => gate.gate === 34)).toMatchObject({
      summary: expect.stringMatching(/power|respond/i),
      lines: [expect.objectContaining({ line: 3, role: 'Adaptation' })],
    })
  })

  it('treats charts without channels as reflectors', () => {
    const chart = deriveHumanDesignGraph({
      personId: 'open',
      personName: 'Open',
      birthJd: 1,
      designJd: 0,
      personality: { Sun: activation('Sun', 1, 2) },
      design: { Sun: activation('Sun', 3, 4) },
    })

    expect(chart.channels).toEqual([])
    expect(chart.centers).toEqual([])
    expect(chart.type).toBe('Reflector')
    expect(chart.authority).toBe('Lunar')
    expect(chart.definition).toBe('No Definition')
    expect(chart.strategy).toBe('Wait through the lunar cycle')
  })

  it('derives variables and incarnation cross metadata from activation substructure', () => {
    const chart = deriveHumanDesignGraph({
      personId: 'cross',
      personName: 'Cross',
      birthJd: 1,
      designJd: 0,
      personality: {
        Sun: activation('Sun', 49, 6),
        Earth: activation('Earth', 4, 6),
        NorthNode: { ...activation('NorthNode', 27, 1), tone: 4, color: 2, base: 3 },
      },
      design: {
        Sun: { ...activation('Sun', 14, 2), tone: 3, color: 1, base: 5 },
        Earth: activation('Earth', 8, 2),
        NorthNode: { ...activation('NorthNode', 24, 2), tone: 5, color: 4, base: 1 },
      },
    })

    expect(chart.profile).toBe('6 / 2')
    expect(chart.incarnationCross).toMatchObject({
      name: 'Left Angle Cross of Revolution',
      geometry: 'Left Angle',
      gates: [49, 4, 14, 8],
      summary: expect.stringContaining('geometry links'),
    })
    expect(chart.incarnationCross.gateDetails).toHaveLength(4)
    expect(chart.variables.map(variable => [variable.id, variable.orientation])).toEqual([
      ['digestion', 'left'],
      ['environment', 'right'],
      ['motivation', 'left'],
      ['perspective', 'right'],
    ])
  })

  it('builds transit connections and monotonic next activation changes', () => {
    const natal = deriveHumanDesignGraph({
      personId: 'natal',
      personName: 'Natal',
      birthJd: 1,
      designJd: 0,
      personality: { Sun: activation('Sun', 1, 1) },
      design: { Sun: activation('Sun', 3, 1) },
    })
    const transit = buildHumanDesignTransitChart(Date.UTC(2026, 0, 1, 12), 0, 0)
    const connection = humanDesignTransitConnection(natal, transit, { lat: 0, lon: 0 })

    expect(connection.activationWatch.length).toBeGreaterThan(0)
    expect(connection.activationWatch[0]).toMatchObject({
      code: expect.any(String),
      planetMeaning: expect.any(String),
      lineDetail: expect.objectContaining({ summary: expect.any(String) }),
    })
    expect(connection.nextChanges.length).toBeGreaterThan(0)
    expect(connection.nextChanges.every(change => change.dateMs > transit.dateMs)).toBe(true)
    expect(connection.nextChanges[0].toCode).toMatch(/\d+\.\d+\.\d+\.\d+\.\d+/)
  })

  it('summarizes team penta coverage and composite channels', () => {
    const charts = [
      { personId: 'a', gates: [31, 8], channels: [], centers: [] },
      { personId: 'b', gates: [1, 13, 7], channels: [], centers: [] },
      { personId: 'c', gates: [33, 15], channels: [], centers: [] },
    ]
    const analysis = humanDesignTeamAnalysis(charts)

    expect(analysis.memberCount).toBe(3)
    expect(analysis.pentaCoverage.find(item => item.gate === 31).owners).toEqual(['a'])
    expect(analysis.pentaPercent).toBeGreaterThan(0)
    expect(analysis.compositeChannels.map(channel => channel.channel)).toContain('1-8')
  })

  it('adds precise mandala degree metadata to activations', () => {
    const activation = activationFromLongitude(0)

    expect(activation.mandala).toMatchObject({
      gateIndex: expect.any(Number),
      gateDegrees: expect.any(Number),
      lineDegrees: expect.any(Number),
      gateArcDegrees: 5.625,
    })
    expect(activation.mandala.lineArcDegrees).toBeCloseTo(0.9375)
  })

  it('exposes original gate and line library entries', () => {
    expect(gateLibraryEntry(34)).toMatchObject({
      gate: 34,
      name: 'Power',
      streams: expect.arrayContaining(['Sacral Manifestation']),
      summary: expect.stringMatching(/power|respond/i),
    })
    expect(lineLibraryEntry(34, 5)).toMatchObject({
      line: 5,
      role: 'Projection',
      exaltationTheme: expect.any(String),
      detrimentTheme: expect.any(String),
    })
  })
})
