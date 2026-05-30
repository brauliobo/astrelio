import { describe, it, expect } from 'vitest'
import { naturalAspects, crossAspects } from '../../src/lib/astro/aspects.js'

const mk = (name, lon, speed = 1) => ({ name, longitude: lon, latitude: 0, speed, retrograde: speed < 0 })

describe('aspects', () => {
  it('detects exact conjunction', () => {
    const chart = { positions: [mk('Sun', 100), mk('Mars', 102)] }
    const out   = naturalAspects(chart)
    expect(out[0].type).toBe('conjunction')
    expect(out[0].delta).toBeCloseTo(2, 1)
  })

  it('detects exact opposition with orb', () => {
    const chart = { positions: [mk('Sun', 0), mk('Moon', 178)] }
    const out   = naturalAspects(chart)
    expect(out[0].type).toBe('opposition')
  })

  it('rejects when out of orb', () => {
    const chart = { positions: [mk('Sun', 0), mk('Moon', 130)] }
    const out   = naturalAspects(chart)
    expect(out.length).toBe(0)
  })

  it('cross aspects between two charts', () => {
    const a   = { positions: [mk('Sun', 100)] }
    const b   = { positions: [mk('Mars', 280)] }
    const out = crossAspects(a, b)
    expect(out[0].type).toBe('opposition')
  })

  it('uses tighter orbs for nodes and Lilith', () => {
    const chart = { positions: [mk('Sun', 0), mk('NorthNode', 5.1, -0.053)] }
    expect(naturalAspects(chart)).toHaveLength(0)
  })

  it('returns orb, strength, and applying state', () => {
    const chart = { positions: [mk('Sun', 10, 1), mk('Mars', 72, 0.5)] }
    const [aspect] = naturalAspects(chart)
    expect(aspect.type).toBe('sextile')
    expect(aspect.orb).toBe(5)
    expect(aspect.strength).toBeGreaterThan(0)
    expect(typeof aspect.applying).toBe('boolean')
  })

  it('can restrict to major aspects', () => {
    const chart = { positions: [mk('Sun', 0), mk('Moon', 150)] }
    expect(naturalAspects(chart)).toHaveLength(1)
    expect(naturalAspects(chart, { aspectSet: 'major' })).toHaveLength(0)
  })

  it('can exclude modern planets and points', () => {
    const chart = { positions: [mk('Sun', 0), mk('Uranus', 180)] }
    expect(naturalAspects(chart)).toHaveLength(1)
    expect(naturalAspects(chart, { includeModernPlanets: false })).toHaveLength(0)
  })
})
