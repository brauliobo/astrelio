import { describe, expect, it } from 'vitest'
import {
  buildVedicPrerequisites,
  deriveConjunctions,
  deriveGrahaAspects,
  dignityOf,
} from '../../../src/lib/vedic/prerequisites.js'
import { vedicChartFixture } from './fixtures.js'

describe('Vedic prerequisites', () => {
  it('derives house occupants, sign lords, and lordships', () => {
    const facts = buildVedicPrerequisites(vedicChartFixture())

    expect(facts.houses[0]).toMatchObject({
      number: 1,
      signIndex: 0,
      lord: 'Mars',
      occupants: ['Sun', 'Venus'],
    })
    expect(facts.lordships.find(item => item.body === 'Mars').houses).toEqual([1, 8])
    expect(facts.placements.find(item => item.body === 'Mars').d1.house).toBe(4)
  })

  it('derives same-sign conjunctions and traditional graha aspects', () => {
    const chart = vedicChartFixture()
    const conjunctions = deriveConjunctions(chart.positions)
    const aspects = deriveGrahaAspects(chart.positions)

    expect(conjunctions).toContainEqual({
      id: 'conjunction:Sun:Venus',
      bodies: ['Sun', 'Venus'],
      signIndex: 0,
    })
    expect(aspects).toContainEqual(expect.objectContaining({
      source: 'Mars',
      target: 'Saturn',
      aspectHouse: 4,
    }))
    expect(aspects.some(item => item.source === 'NorthNode')).toBe(false)
  })

  it('limits dignity to supported classical sign conditions', () => {
    expect(dignityOf('Sun', 0)).toBe('exalted')
    expect(dignityOf('Mars', 3)).toBe('debilitated')
    expect(dignityOf('Jupiter', 8)).toBe('own_sign')
    expect(dignityOf('NorthNode', 10)).toBe('unassessed')
  })

  it('references D1/D9, nodes, nakshatra, Vimshottari, and explicit pattern coverage', () => {
    const facts = buildVedicPrerequisites(vedicChartFixture())
    const sun = facts.placements.find(item => item.body === 'Sun')

    expect(sun).toMatchObject({
      d1: { signIndex: 0, house: 1 },
      d9: { signIndex: 0 },
      nakshatra: { key: 'ashwini', pada: 4 },
    })
    expect(facts.nodeAxis).toEqual({
      rahu: { signIndex: 10, house: 11 },
      ketu: { signIndex: 4, house: 5 },
    })
    expect(facts.vimshottari.active).toMatchObject({ mahadasha: 'sun', antardasha: 'venus' })
    expect(facts.patterns).toContainEqual(expect.objectContaining({ pattern: 'vargottama', participants: ['Sun'] }))
    expect(facts.patterns).toContainEqual(expect.objectContaining({ pattern: 'mutual_reception', participants: ['Mercury', 'Jupiter'] }))
    expect(facts.coverage.completeYogaCatalog).toBe(false)
    expect(facts.coverage.supportedPatterns.map(item => item.key)).toEqual(['vargottama', 'mutual_reception'])
  })
})
