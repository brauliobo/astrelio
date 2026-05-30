import { describe, expect, it } from 'vitest'
import { deriveHumanDesignGraph } from '../../../src/lib/human-design/bodygraph.js'

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
  })
})
