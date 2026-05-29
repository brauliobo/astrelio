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
    const a = { positions: [mk('Sun', 100)] }
    const b = { positions: [mk('Mars', 280)] }
    const out = crossAspects(a, b)
    expect(out[0].type).toBe('opposition')
  })
})
