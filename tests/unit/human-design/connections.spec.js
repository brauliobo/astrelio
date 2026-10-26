import { describe, expect, it } from 'vitest'
import { CHANNELS } from '../../../src/lib/human-design/constants.js'
import { humanDesignConnection } from '../../../src/lib/human-design/connections.js'
import { humanDesignStateForGates } from '../../../src/lib/human-design/definition.js'

const chart = ({ id, centers = [], channels = [], gates = [] }) => ({
  personId: id,
  centers,
  channels,
  gates,
})

const chartForGates = (id, gates) => {
  const state = humanDesignStateForGates(gates)
  return chart({ id, centers: state.centers, channels: state.channels, gates: state.gates })
}

describe('Human Design connections', () => {
  it('finds electromagnetic channels from harmonic gates across two charts', () => {
    const connection = humanDesignConnection(
      chart({ id: 'a', centers: ['G'], gates: [1] }),
      chart({ id: 'b', centers: ['Throat'], gates: [8] }),
    )

    expect(connection.electromagnetic).toEqual(['1-8'])
    expect(connection.sharedCenters).toEqual([])
    expect(connection.connectionTheme).toBe('2-7')
    expect(connection.compositeChannels).toEqual([
      expect.objectContaining({ channel: '1-8', name: 'Inspiration' }),
    ])
  })

  it('classifies shared, compromise, and dominance channels', () => {
    const connection = humanDesignConnection(
      chart({ id: 'a', centers: ['G', 'Throat'], channels: ['1-8', '13-33'], gates: [1, 8, 13, 33] }),
      chart({ id: 'b', centers: ['G', 'Throat'], channels: ['1-8'], gates: [1, 8, 13] }),
    )

    expect(connection.sharedCenters).toEqual(['G', 'Throat'])
    expect(connection.companionship).toEqual(['1-8'])
    expect(connection.compromise).toEqual([{ channel: '13-33', owner: 'a' }])
    expect(connection.dominance).toEqual([])
    expect(connection.openCenters).toContain('Head')
  })

  it('does not list a channel as electromagnetic when one person already holds it whole', () => {
    const connection = humanDesignConnection(chartForGates('a', [20, 34]), chartForGates('b', [20]))

    expect(connection.electromagnetic).toEqual([])
    expect(connection.compromise).toEqual([{ channel: '20-34', owner: 'a' }])
    expect(connection.dominance).toEqual([])
    expect(connection.companionship).toEqual([])
  })

  it('classifies electromagnetic, companionship, compromise, and dominance on separate channels', () => {
    const connection = humanDesignConnection(
      chartForGates('a', [1, 8, 2, 20, 34, 5, 15, 21]),
      chartForGates('b', [14, 20, 34, 5, 21, 45]),
    )

    expect(connection.electromagnetic).toEqual(['2-14'])
    expect(connection.companionship).toEqual(['20-34'])
    expect(connection.compromise).toEqual([{ channel: '5-15', owner: 'a' }, { channel: '21-45', owner: 'b' }])
    expect(connection.dominance).toEqual([{ channel: '1-8', owner: 'a' }])
    expect(connection.channelRelations.find(item => item.channel === '1-8')).toMatchObject({ relation: 'dominance', owner: 'a' })
  })

  it('keeps every channel in at most one relation for arbitrary gate sets', () => {
    let seed = 7
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
    const pick   = () => Array.from({ length: 64 }, (_, index) => index + 1).filter(() => random() < 0.4)

    for (let i = 0; i < 200; i += 1) {
      const connection = humanDesignConnection(chartForGates('a', pick()), chartForGates('b', pick()))
      const listed     = [
        ...connection.electromagnetic,
        ...connection.companionship,
        ...connection.compromise.map(item => item.channel),
        ...connection.dominance.map(item => item.channel),
      ]

      expect(new Set(listed).size).toBe(listed.length)
      expect(listed.length).toBe(connection.channelRelations.length)
      expect(connection.channelRelations.every(item => CHANNELS.some(channel => channel.key === item.channel))).toBe(true)
    }
  })

  it('classifies each center and describes the composite definition', () => {
    const connection = humanDesignConnection(chartForGates('a', [34, 57]), chartForGates('b', [21, 45]))
    const status     = center => connection.centerDynamics.find(item => item.center === center).status

    expect(['Sacral', 'Spleen', 'Ego', 'Throat', 'Head'].map(status)).toEqual(['onlyA', 'onlyA', 'onlyB', 'onlyB', 'open'])
    expect(connection.centerClassification).toMatchObject({ both: [], onlyA: ['Spleen', 'Sacral'], onlyB: ['Throat', 'Ego'] })
    expect(connection.composite).toMatchObject({ definition: 'Split Definition', splitSize: 'small', type: 'Manifesting Generator' })
    expect(connection.composite.bridges.gates).toEqual(expect.arrayContaining([expect.objectContaining({ gate: 20 })]))
  })

  it('reports both-defined centers as shared', () => {
    const connection = humanDesignConnection(chartForGates('a', [34, 57]), chartForGates('b', [27, 50]))

    expect(connection.centerClassification.both).toEqual(['Spleen', 'Sacral'])
    expect(connection.sharedCenters).toEqual(['Sacral', 'Spleen'])
  })
})
