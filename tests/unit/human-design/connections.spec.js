import { describe, expect, it } from 'vitest'
import { humanDesignConnection } from '../../../src/lib/human-design/connections.js'

const chart = ({ id, centers = [], channels = [], gates = [] }) => ({
  personId: id,
  centers,
  channels,
  gates,
})

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
})
