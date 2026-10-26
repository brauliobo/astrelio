import { describe, expect, it } from 'vitest'
import { buildHumanDesignChart } from '../../../src/lib/human-design/bodygraph.js'
import { CENTER_BY_ID, CENTER_MODEL, centerStates } from '../../../src/lib/human-design/centers.js'
import { CHANNEL_CENTERS, GATE_CENTER } from '../../../src/lib/human-design/constants.js'

// independent canon table (Jovian Archive centers and gates), separate from constants.js
const CANON_GATES = {
  Head:           [61, 63, 64],
  Ajna:           [4, 11, 17, 24, 43, 47],
  Throat:         [8, 12, 16, 20, 23, 31, 33, 35, 45, 56, 62],
  G:              [1, 2, 7, 10, 13, 15, 25, 46],
  Ego:            [21, 26, 40, 51],
  'Solar Plexus': [6, 22, 30, 36, 37, 49, 55],
  Spleen:         [18, 28, 32, 44, 48, 50, 57],
  Sacral:         [3, 5, 9, 14, 27, 29, 34, 42, 59],
  Root:           [19, 38, 39, 41, 52, 53, 54, 58, 60],
}

const referencePerson = {
  id: 'ref-person', name: 'Bráulio Oliveira', isoLocal: '1986-02-12T18:10', ianaZone: 'America/Sao_Paulo',
  tzOffsetMinutes: -120, lat: -23.18, lon: -45.88, placeLabel: 'São José dos Campos, SP - Brasil',
}

const chartWithGates = (...gates) => ({ personality: Object.fromEntries(gates.map(gate => [`g${gate}`, { gate }])), design: {} })

describe('center model', () => {
  it('assigns each of the 64 gates to exactly one center with the canon counts', () => {
    const all = CENTER_MODEL.flatMap(center => center.gates)

    expect(new Set(all).size).toBe(64)
    expect([...all].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, index) => index + 1))
    expect(CENTER_MODEL.map(center => center.gates.length)).toEqual([3, 6, 11, 8, 4, 7, 7, 9, 9])
  })

  it('matches the independent canon gate table', () => {
    for (const center of CENTER_MODEL) expect([...center.gates].sort((a, b) => a - b)).toEqual(CANON_GATES[center.id])
  })

  it('agrees with every channel center pair of the engine', () => {
    for (const [key, centers] of Object.entries(CHANNEL_CENTERS)) {
      const fromGates = key.split('-').map(gate => GATE_CENTER[Number(gate)])

      expect([...fromGates].sort()).toEqual([...centers].sort())
    }
  })

  it('fixes gates the old derived table placed in the wrong center', () => {
    expect([2, 14, 3, 4, 6, 16, 35, 36, 59, 63, 64, 61].map(gate => GATE_CENTER[gate])).toEqual(
      ['G', 'Sacral', 'Sacral', 'Ajna', 'Solar Plexus', 'Throat', 'Throat', 'Solar Plexus', 'Sacral', 'Head', 'Head', 'Head'],
    )
  })

  it('classifies pressure, awareness, motor, expression and identity centers', () => {
    const withClass = name => CENTER_MODEL.filter(center => center.classes.includes(name)).map(center => center.id)

    expect(withClass('pressure')).toEqual(['Head', 'Root'])
    expect(withClass('awareness')).toEqual(['Ajna', 'Solar Plexus', 'Spleen'])
    expect(withClass('motor')).toEqual(['Ego', 'Solar Plexus', 'Sacral', 'Root'])
    expect(withClass('expression')).toEqual(['Throat'])
    expect(withClass('identity')).toEqual(['G'])
    expect(CENTER_BY_ID.Root.shape).toBe('square')
  })
})

describe('centerStates', () => {
  const stateOf = (states, id) => states.find(center => center.id === id)

  it('distinguishes defined, undefined (hanging gates) and open centers', () => {
    const states = centerStates(chartWithGates(34, 20, 2))

    expect(stateOf(states, 'Sacral')).toMatchObject({ state: 'defined', definedGates: [34], hangingGates: [], channels: ['20-34'] })
    expect(stateOf(states, 'Throat')).toMatchObject({ state: 'defined', definedGates: [20] })
    expect(stateOf(states, 'G')).toMatchObject({ state: 'undefined', white: true, undefinedActivatedGates: [2] })
    expect(stateOf(states, 'Head')).toMatchObject({ state: 'open', white: true, activatedGates: [], undefinedActivatedGates: [] })
  })

  it('keeps hanging gates of a defined center out of the conditioning carriers', () => {
    const sacral = stateOf(centerStates(chartWithGates(34, 20, 5)), 'Sacral')

    expect(sacral.state).toBe('defined')
    expect(sacral.hangingGates).toEqual([5])
    expect(sacral.undefinedActivatedGates).toEqual([])
  })

  it('matches the defined centers and channels of the reference chart', () => {
    const chart  = buildHumanDesignChart(referencePerson)
    const states = centerStates(chart)
    const defined = states.filter(center => center.state === 'defined').map(center => center.id)

    expect(defined.sort()).toEqual([...chart.centers].sort())
    expect(states.flatMap(center => center.channels).sort()).toEqual(
      chart.channels.flatMap(channel => [channel, channel]).sort(),
    )
    states.filter(center => center.white).forEach(center => {
      expect(center.activatedGates).toEqual(center.undefinedActivatedGates)
    })
  })
})
