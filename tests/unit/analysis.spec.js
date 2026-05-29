import { describe, expect, it } from 'vitest'
import { chartSignature, placementFor, topAspects } from '../../src/lib/astro/analysis.js'

const mk = (name, longitude, speed = 1) => ({ name, longitude, latitude: 0, speed, retrograde: speed < 0 })

const chart = {
  ascendant: 15,
  mc: 100,
  cusps: [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345],
  positions: [
    mk('Sun', 10),
    mk('Moon', 132),
    mk('Mercury', 92, -1),
    mk('Mars', 190),
  ],
}

describe('chart analysis', () => {
  it('returns placements with sign and house context', () => {
    const sun = placementFor(chart, 'Sun')
    expect(sun.signIndex).toBe(0)
    expect(sun.house).toBe(12)
  })

  it('weights sign traits and angular planets', () => {
    const signature = chartSignature(chart)
    expect(signature.elements[0].key).toBe('fire')
    expect(signature.angularPlanets.map(item => item.name)).toContain('Sun')
    expect(signature.retrogrades).toEqual(['Mercury'])
  })

  it('sorts aspects by computed strength before orb', () => {
    const aspects = [
      { type: 'square', delta: 0.5, strength: 0.2 },
      { type: 'trine', delta: 1.5, strength: 0.8 },
    ]
    expect(topAspects(aspects, 1)[0].type).toBe('trine')
  })
})
