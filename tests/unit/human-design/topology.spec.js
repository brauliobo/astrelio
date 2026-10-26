import { describe, expect, it } from 'vitest'
import { definitionWith, humanDesignStateForGates } from '../../../src/lib/human-design/bodygraph.js'
import {
  CENTER_GATES,
  CENTERS,
  CHANNELS,
  CHANNEL_CENTERS,
  CHANNEL_CIRCUITS,
  CHANNEL_STREAMS,
  GATE_CENTER,
  GATE_NAMES,
  HARMONIC_GATES,
  HD_AUTHORITIES,
  HD_DEFINITIONS,
  HD_TYPES,
  INCARNATION_QUARTERS,
} from '../../../src/lib/human-design/constants.js'

const GATE_COUNTS = { Head: 3, Ajna: 6, Throat: 11, G: 8, Ego: 4, 'Solar Plexus': 7, Spleen: 7, Sacral: 9, Root: 9 }

// Independent canon table: channel -> unordered center pair.
const CANON_PAIRS = {
  '1-8': 'G,Throat', '2-14': 'G,Sacral', '3-60': 'Root,Sacral', '4-63': 'Ajna,Head', '5-15': 'G,Sacral',
  '6-59': 'Sacral,Solar Plexus', '7-31': 'G,Throat', '9-52': 'Root,Sacral', '10-20': 'G,Throat', '10-34': 'G,Sacral',
  '10-57': 'G,Spleen', '11-56': 'Ajna,Throat', '12-22': 'Solar Plexus,Throat', '13-33': 'G,Throat',
  '16-48': 'Spleen,Throat', '17-62': 'Ajna,Throat', '18-58': 'Root,Spleen', '19-49': 'Root,Solar Plexus',
  '20-34': 'Sacral,Throat', '20-57': 'Spleen,Throat', '21-45': 'Ego,Throat', '23-43': 'Ajna,Throat',
  '24-61': 'Ajna,Head', '25-51': 'Ego,G', '26-44': 'Ego,Spleen', '27-50': 'Sacral,Spleen', '28-38': 'Root,Spleen',
  '29-46': 'G,Sacral', '30-41': 'Root,Solar Plexus', '32-54': 'Root,Spleen', '34-57': 'Sacral,Spleen',
  '35-36': 'Solar Plexus,Throat', '37-40': 'Ego,Solar Plexus', '39-55': 'Root,Solar Plexus', '42-53': 'Root,Sacral',
  '47-64': 'Ajna,Head',
}

const SUB_CIRCUITS = {
  Knowing:       ['1-8', '2-14', '3-60', '12-22', '20-57', '23-43', '24-61', '28-38', '39-55'],
  Centering:     ['10-34', '25-51'],
  Integration:   ['10-20', '10-57', '20-34', '34-57'],
  Ego:           ['19-49', '21-45', '26-44', '32-54', '37-40'],
  Defense:       ['6-59', '27-50'],
  Understanding: ['4-63', '5-15', '7-31', '9-52', '16-48', '17-62', '18-58'],
  Sensing:       ['11-56', '13-33', '29-46', '30-41', '35-36', '42-53', '47-64'],
}

const gatesOf = (...channels) => channels.flatMap(channel => channel.split('-').map(Number))
const stateFor = (...channels) => humanDesignStateForGates(gatesOf(...channels))

describe('Human Design topology', () => {
  it('maps every gate to exactly one center with the canon gate counts', () => {
    const listed = Object.values(CENTER_GATES).flat()

    expect(listed).toHaveLength(64)
    expect(new Set(listed).size).toBe(64)
    expect(Object.keys(GATE_CENTER)).toHaveLength(64)
    expect(Object.fromEntries(CENTERS.map(center => [center, CENTER_GATES[center].length]))).toEqual(GATE_COUNTS)
    expect(Object.keys(GATE_NAMES)).toHaveLength(64)
    expect(GATE_NAMES[2]).toBe('Direction of the Self')
  })

  it('lists 36 channels whose centers agree with the gate centers in gate order', () => {
    expect(CHANNELS).toHaveLength(36)
    expect(Object.keys(CANON_PAIRS).sort()).toEqual(CHANNELS.map(channel => channel.key).sort())

    for (const channel of CHANNELS) {
      expect(channel.gates.map(gate => GATE_CENTER[gate])).toEqual(channel.centers)
      expect(channel.centers).toEqual(CHANNEL_CENTERS[channel.key])
      expect([...channel.centers].sort().join(',')).toBe(CANON_PAIRS[channel.key])
      expect(channel.gates[0]).toBeLessThan(channel.gates[1])
      expect(HARMONIC_GATES[channel.gates[0]]).toContain(channel.gates[1])
      expect(HARMONIC_GATES[channel.gates[1]]).toContain(channel.gates[0])
    }
  })

  it('splits the circuits into the canon sub-circuits', () => {
    for (const [subCircuit, channels] of Object.entries(SUB_CIRCUITS)) {
      expect(CHANNELS.filter(channel => channel.subCircuit === subCircuit).map(channel => channel.key).sort())
        .toEqual([...channels].sort())
      for (const channel of channels) expect(CHANNEL_STREAMS[channel]).toBe(subCircuit)
    }

    const groups = Object.groupBy(CHANNELS, channel => channel.circuitGroup)
    expect(Object.fromEntries(Object.entries(groups).map(([group, items]) => [group, items.length])))
      .toEqual({ Individual: 15, Tribal: 7, Collective: 14 })
    expect(CHANNEL_CIRCUITS['19-49']).toBe('Tribal')
  })

  it('names the Mutation quarter Transformation', () => {
    expect(INCARNATION_QUARTERS.map(quarter => quarter.theme)).toEqual(['Mind', 'Form', 'Bonding', 'Transformation'])
  })
})

describe('Human Design type and authority', () => {
  const cases = [
    ['no channels',                            [],                                   'Reflector',             'Lunar',          'No Definition'],
    ['Head-Ajna only',                         ['64-47'],                            'Projector',             'Sounding Board', 'Single Definition'],
    ['Ajna-Throat',                            ['17-62'],                            'Projector',             'Sounding Board', 'Single Definition'],
    ['G-Throat',                               ['1-8'],                              'Projector',             'Self Projected', 'Single Definition'],
    ['Ego-G',                                  ['25-51'],                            'Projector',             'Ego Projected',  'Single Definition'],
    ['Ego-Throat',                             ['21-45'],                            'Manifestor',            'Ego Manifested', 'Single Definition'],
    ['Ego-G plus G-Throat',                    ['25-51', '10-20'],                   'Manifestor',            'Ego Manifested', 'Single Definition'],
    ['Spleen-Throat',                          ['16-48'],                            'Projector',             'Splenic',        'Single Definition'],
    ['Spleen-Root',                            ['28-38'],                            'Projector',             'Splenic',        'Single Definition'],
    ['Spleen-Root plus Spleen-Throat',         ['28-38', '16-48'],                   'Manifestor',            'Splenic',        'Single Definition'],
    ['Solar Plexus-Throat',                    ['35-36'],                            'Manifestor',            'Emotional',      'Single Definition'],
    ['Solar Plexus-Root without Throat',       ['19-49'],                            'Projector',             'Emotional',      'Single Definition'],
    ['Sacral-Root',                            ['3-60'],                             'Generator',             'Sacral',         'Single Definition'],
    ['Sacral-Throat directly',                 ['20-34'],                            'Manifesting Generator', 'Sacral',         'Single Definition'],
    ['Sacral-G without Throat',                ['10-34'],                            'Generator',             'Sacral',         'Single Definition'],
    ['Sacral-G-Throat via 10-34 and 10-20',    ['10-34', '10-20'],                   'Manifesting Generator', 'Sacral',         'Single Definition'],
    ['Sacral-G-Throat via 2-14 and 1-8',       ['2-14', '1-8'],                      'Manifesting Generator', 'Sacral',         'Single Definition'],
    ['Sacral-Spleen-Throat',                   ['27-50', '16-48'],                   'Manifesting Generator', 'Sacral',         'Single Definition'],
    ['Sacral plus separate Ego-Throat',        ['3-60', '21-45'],                    'Manifesting Generator', 'Sacral',         'Split Definition'],
    ['Sacral plus separate Solar Plexus-Throat', ['3-60', '12-22'],                  'Manifesting Generator', 'Emotional',      'Split Definition'],
    ['Sacral plus Root-Spleen without Throat', ['3-60', '28-38'],                    'Generator',             'Sacral',         'Single Definition'],
    ['Sacral with Root-Solar Plexus apart',    ['34-57', '19-49'],                   'Generator',             'Emotional',      'Split Definition'],
    ['Root reaches Throat only through Spleen', ['18-58', '16-48'],                  'Manifestor',            'Splenic',        'Single Definition'],
    ['Ego-Spleen-Throat',                      ['26-44', '20-57'],                   'Manifestor',            'Splenic',        'Single Definition'],
    ['Ego-G motor path 25-51 with 13-33',      ['25-51', '13-33'],                   'Manifestor',            'Ego Manifested', 'Single Definition'],
  ]

  it.each(cases)('%s', (_name, channels, type, authority, definition) => {
    const state = stateFor(...channels)

    expect(state.channels).toEqual(expect.arrayContaining(channels.map(channel => channel.split('-').sort((a, b) => a - b).join('-'))))
    expect([state.type, state.authority, state.definition]).toEqual([type, authority, definition])
  })

  it('finds the Sacral-G-Throat route through 10-34 when the throat gates are held', () => {
    expect(humanDesignStateForGates([10, 34, 1, 8]).type).toBe('Manifesting Generator')
    expect(humanDesignStateForGates([10, 34, 1]).type).toBe('Generator')
  })

  it('sorts gates numerically', () => {
    expect(humanDesignStateForGates([34, 8, 10, 1]).gates).toEqual([1, 8, 10, 34])
  })

  it('exposes the full type, authority, and definition lists', () => {
    expect(HD_TYPES).toEqual(['Generator', 'Manifesting Generator', 'Manifestor', 'Projector', 'Reflector'])
    expect(HD_AUTHORITIES).toEqual(expect.arrayContaining(['Ego Manifested', 'Ego Projected', 'Self Projected', 'Sounding Board', 'Lunar']))
    expect(HD_DEFINITIONS).toHaveLength(5)
  })
})

// Independent reference: union-find over centers and brute-force motor reachability.
const referenceState = (gates) => {
  const gateSet  = new Set(gates)
  const defined  = CHANNELS.filter(channel => channel.gates.every(gate => gateSet.has(gate)))
  const parent   = Object.fromEntries(CENTERS.map(center => [center, center]))
  const find     = center => parent[center] === center ? center : (parent[center] = find(parent[center]))
  for (const channel of defined) parent[find(channel.centers[0])] = find(channel.centers[1])

  const active    = new Set(defined.flatMap(channel => channel.centers))
  const joined    = (a, b) => active.has(a) && active.has(b) && find(a) === find(b)
  const motors    = ['Sacral', 'Solar Plexus', 'Ego', 'Root'].filter(motor => joined(motor, 'Throat'))
  const type      = !active.size ? 'Reflector'
    : active.has('Sacral') ? (motors.length ? 'Manifesting Generator' : 'Generator')
      : (motors.length ? 'Manifestor' : 'Projector')
  const authority = !active.size ? 'Lunar'
    : active.has('Solar Plexus') ? 'Emotional'
      : active.has('Sacral') ? 'Sacral'
        : active.has('Spleen') ? 'Splenic'
          : active.has('Ego') ? (joined('Ego', 'Throat') ? 'Ego Manifested' : 'Ego Projected')
            : active.has('G') ? 'Self Projected' : 'Sounding Board'
  const areas     = new Set([...active].map(find)).size

  return { channels: defined.map(channel => channel.key), type, authority, areas }
}

const mulberry32 = (seed) => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
  return ((t ^ t >>> 14) >>> 0) / 4294967296
}

describe('Human Design derivation against an independent reference', () => {
  it('agrees on channels, type, authority, and definition count for random gate sets', () => {
    const random = mulberry32(1986)

    for (let i = 0; i < 3000; i += 1) {
      const density = 0.15 + random() * 0.6
      const gates   = Array.from({ length: 64 }, (_, index) => index + 1).filter(() => random() < density)
      const state   = humanDesignStateForGates(gates)
      const expected = referenceState(gates)

      expect(state.channels).toEqual(expected.channels)
      expect(state.type).toBe(expected.type)
      expect(state.authority).toBe(expected.authority)
      expect(state.components).toHaveLength(expected.areas)
    }
  })
})

describe('Human Design definition, bridges, and temporary definition', () => {
  it('reports a small split when a single missing gate joins the areas', () => {
    // Throat-G (1-8) and Sacral-Root (3-60) apart; holding gate 2 brings the 2-14 bridge within one gate (14 missing).
    const state = humanDesignStateForGates([...gatesOf('1-8', '3-60'), 2])

    expect(state.definition).toBe('Split Definition')
    expect(state.splitSize).toBe('small')
    expect(state.bridges.gates).toEqual(expect.arrayContaining([expect.objectContaining({ gate: 14, channel: '2-14' })]))
  })

  it('reports a large split when only whole channels would join the areas', () => {
    const state = stateFor('12-22', '3-60')

    expect(state.definition).toBe('Split Definition')
    expect(state.splitSize).toBe('large')
    expect(state.bridges.gates).toEqual([])
    expect(state.bridges.channels.map(bridge => bridge.channel)).toEqual(expect.arrayContaining(['6-59', '20-34']))
  })

  it('has no split size or bridges for a single definition', () => {
    const state = stateFor('34-57')

    expect(state.splitSize).toBeNull()
    expect(state.bridges).toEqual({ gates: [], channels: [] })
  })

  it('counts triple and quad splits', () => {
    expect(stateFor('10-34', '19-49', '26-44').definition).toBe('Triple Split Definition')
    expect(stateFor('10-34', '19-49', '26-44', '47-64').definition).toBe('Quad Split Definition')
  })

  it('computes type, authority, and definition under extra gates', () => {
    const natal = humanDesignStateForGates(gatesOf('3-60'))
    const under = definitionWith(natal, [34, 20])

    expect(natal.type).toBe('Generator')
    expect(under).toMatchObject({
      type:       'Manifesting Generator',
      authority:  'Sacral',
      definition: 'Single Definition',
      channels:   ['3-60', '20-34'],
      centers:    ['Root', 'Sacral', 'Throat'],
    })
    expect(definitionWith({ gates: [] }, [])).toMatchObject({ type: 'Reflector', authority: 'Lunar' })
  })

  it('bridges a split with a partner gate', () => {
    const natal = humanDesignStateForGates(gatesOf('21-45', '3-60'))

    expect(natal.definition).toBe('Split Definition')
    expect(definitionWith(natal, gatesOf('20-34')).definition).toBe('Single Definition')
  })
})
